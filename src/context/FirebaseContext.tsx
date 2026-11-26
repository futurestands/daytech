import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  auth,
  FirebaseConnectionHealth,
  formatFirebaseAuthError,
  googleProvider,
  testConnection,
} from '../lib/firebase/client';
import { isFirebaseReady } from '../lib/firebase/config';
import {
  BootstrapStatus,
  claimInitialSuperAdmin,
  getBootstrapStatus,
  sealBootstrapForExistingAdmin,
  syncUserAccountOnSignIn,
} from '../lib/firebase/firestoreService';
import { UserAccountRecord } from '../types/domain';

interface FirebaseContextValue {
  firebaseReady: boolean;
  authReady: boolean;
  user: User | null;
  userAccount: UserAccountRecord | null;
  isStaff: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isDeactivated: boolean;
  authError: string | null;
  connectionHealth: FirebaseConnectionHealth | null;
  bootstrapStatus: BootstrapStatus;
  signingIn: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  recheckConnection: () => Promise<void>;
  provisionInitialSuperAdmin: () => Promise<void>;
  sealBootstrapLock: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

const STAFF_ROLES = new Set([
  'super_admin',
  'admin',
  'content_manager',
  'sales_officer',
  'project_manager',
  'support_officer',
]);

const ADMIN_ROLES = new Set(['super_admin', 'admin']);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const firebaseReady = isFirebaseReady();
  const [authReady, setAuthReady] = useState(!firebaseReady || !auth);
  const [user, setUser] = useState<User | null>(null);
  const [userAccount, setUserAccount] = useState<UserAccountRecord | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [connectionHealth, setConnectionHealth] = useState<FirebaseConnectionHealth | null>(null);
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus>({
    checked: false,
    claimed: false,
  });

  const recheckConnection = useCallback(async () => {
    const health = await testConnection();
    setConnectionHealth(health);
  }, []);

  useEffect(() => {
    void recheckConnection();
  }, [recheckConnection]);

  useEffect(() => {
    if (!firebaseReady || !auth) {
      setAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthError(null);
      if (!nextUser) {
        setUserAccount(null);
        setBootstrapStatus({ checked: false, claimed: false });
        setAuthReady(true);
        return;
      }

      try {
        const account = await syncUserAccountOnSignIn(nextUser);
        setUserAccount(account);
        if (!account.active) {
          setAuthError(
            'Your account has been deactivated by an administrator. Contact DayTech Solutions support for assistance.'
          );
        }
        if (nextUser.emailVerified) {
          const bs = await getBootstrapStatus().catch(() => ({ checked: false, claimed: true }));
          setBootstrapStatus(bs);
        }
      } catch (err) {
        setAuthError(formatFirebaseAuthError(err));
        setUserAccount(null);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, [firebaseReady]);

  const signInWithGoogle = async () => {
    if (!firebaseReady || !auth) {
      setAuthError('Firebase Authentication is disabled or not configured.');
      return;
    }
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(formatFirebaseAuthError(err));
    } finally {
      setSigningIn(false);
    }
  };

  const signOutUser = async () => {
    if (!auth) return;
    await signOut(auth);
    setUserAccount(null);
    setAuthError(null);
  };

  const provisionInitialSuperAdmin = async () => {
    if (!user) throw new Error('Sign in with Google first.');
    const updated = await claimInitialSuperAdmin(user);
    setUserAccount(updated);
    setBootstrapStatus({ checked: true, claimed: true, initialSuperAdminUid: user.uid });
  };

  const sealBootstrapLock = async () => {
    if (!user) return;
    await sealBootstrapForExistingAdmin(user);
    setBootstrapStatus({ checked: true, claimed: true, initialSuperAdminUid: user.uid });
  };

  const getIdToken = useCallback(async () => {
    if (!user) return null;
    return user.getIdToken();
  }, [user]);

  const isDeactivated = Boolean(userAccount && !userAccount.active);
  const isStaff = Boolean(userAccount?.active && STAFF_ROLES.has(userAccount.role));
  const isAdmin = Boolean(userAccount?.active && ADMIN_ROLES.has(userAccount.role));
  const isSuperAdmin = Boolean(userAccount?.active && userAccount.role === 'super_admin');

  return (
    <FirebaseContext.Provider
      value={{
        firebaseReady,
        authReady,
        user,
        userAccount,
        isStaff,
        isAdmin,
        isSuperAdmin,
        isDeactivated,
        authError,
        connectionHealth,
        bootstrapStatus,
        signingIn,
        signInWithGoogle,
        signOutUser,
        recheckConnection,
        provisionInitialSuperAdmin,
        sealBootstrapLock,
        getIdToken,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used inside FirebaseProvider');
  }
  return ctx;
}
