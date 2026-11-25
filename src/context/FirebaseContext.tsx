import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase/client';
import { isFirebaseReady } from '../lib/firebase/config';
import { syncUserAccountOnSignIn } from '../lib/firebase/firestoreService';
import { UserAccountRecord } from '../types/domain';

interface FirebaseContextValue {
  firebaseReady: boolean;
  authReady: boolean;
  user: User | null;
  userAccount: UserAccountRecord | null;
  isStaff: boolean;
  isAdmin: boolean;
  authError: string | null;
  signingIn: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
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
        setAuthReady(true);
        return;
      }

      try {
        const account = await syncUserAccountOnSignIn(nextUser);
        setUserAccount(account);
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Unable to verify Firebase user profile.');
        setUserAccount(null);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, [firebaseReady]);

  const signInWithGoogle = async () => {
    if (!firebaseReady || !auth) {
      setAuthError('Firebase Authentication is not configured.');
      return;
    }
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Google sign-in popup was closed before completion.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups for this site.');
      } else {
        setAuthError(err instanceof Error ? err.message : 'Google sign-in failed.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const signOutUser = async () => {
    if (!auth) return;
    await signOut(auth);
    setUserAccount(null);
  };

  const isBootstrappedAdmin = Boolean(
    user?.emailVerified && user.email?.toLowerCase() === 'mugarurajohnson56@gmail.com'
  );
  const isStaff = Boolean(
    isBootstrappedAdmin || (userAccount?.active && STAFF_ROLES.has(userAccount.role))
  );
  const isAdmin = Boolean(
    isBootstrappedAdmin || (userAccount?.active && ADMIN_ROLES.has(userAccount.role))
  );

  return (
    <FirebaseContext.Provider
      value={{
        firebaseReady,
        authReady,
        user,
        userAccount,
        isStaff,
        isAdmin,
        authError,
        signingIn,
        signInWithGoogle,
        signOutUser,
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
