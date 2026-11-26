import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, GoogleAuthProvider } from 'firebase/auth';
import { doc, Firestore, getDocFromServer, getFirestore } from 'firebase/firestore';
import { resolveFirebaseConfig, TARGET_FIREBASE_PROJECT_ID } from './config';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirebaseConnectionHealth {
  status: 'connected' | 'disabled' | 'unavailable' | 'misconfigured';
  message: string;
  projectId: string | null;
  authDomain: string | null;
  databaseId: string | null;
  source: string;
  checkedAt: string;
}

const resolution = resolveFirebaseConfig();

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

if (resolution.enabled && resolution.config) {
  const cfg = resolution.config;
  appInstance = getApps().length > 0 ? getApp() : initializeApp(cfg);
  dbInstance = cfg.firestoreDatabaseId
    ? getFirestore(appInstance, cfg.firestoreDatabaseId)
    : getFirestore(appInstance);
  authInstance = getAuth(appInstance);
}

export const firebaseApp = appInstance;
export const db = dbInstance as Firestore;
export const auth = authInstance as Auth;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const firebaseConfigResolution = resolution;

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  _path: string | null
): never {
  const code = (error as { code?: string })?.code || 'unknown';
  console.error('Firestore request failed', { code, operationType });
  throw new Error(`Firestore request failed (${code}).`);
}

export function formatFirebaseAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code || '';
  const projectId = resolution.config?.projectId || TARGET_FIREBASE_PROJECT_ID;
  const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';

  switch (code) {
    case 'auth/unauthorized-domain':
      return `Domain "${host}" is not authorised for Google Sign-In. Add "${host}" under Firebase Console → Authentication → Settings → Authorized domains (project: ${projectId}).`;
    case 'auth/operation-not-allowed':
      return `Google Sign-In provider is disabled in Firebase Console for project ${projectId}.`;
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completion.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
    case 'auth/network-request-failed':
      return 'Network connection to Firebase Authentication failed. Verify internet connectivity and retry.';
    default:
      return 'Google sign-in failed. Please try again or contact DayTech support.';
  }
}

export async function testConnection(): Promise<FirebaseConnectionHealth> {
  const checkedAt = new Date().toISOString();
  const projectId = resolution.config?.projectId || null;
  const authDomain = resolution.config?.authDomain || null;
  const databaseId = resolution.config?.firestoreDatabaseId || '(default)';

  if (!resolution.enabled) {
    return {
      status: resolution.source === 'disabled' ? 'disabled' : 'misconfigured',
      message: resolution.diagnosticNote,
      projectId,
      authDomain,
      databaseId,
      source: resolution.source,
      checkedAt,
    };
  }

  if (!dbInstance) {
    return {
      status: 'misconfigured',
      message: 'Cloud Firestore failed to initialise. Verify Firebase SDK credentials.',
      projectId,
      authDomain,
      databaseId,
      source: resolution.source,
      checkedAt,
    };
  }

  try {
    await getDocFromServer(doc(dbInstance, 'test', 'connection'));
    return {
      status: 'connected',
      message: `Connected to Cloud Firestore (${projectId} / ${databaseId}).`,
      projectId,
      authDomain,
      databaseId,
      source: resolution.source,
      checkedAt,
    };
  } catch (error) {
    const rawMsg = error instanceof Error ? error.message : String(error);
    const lower = rawMsg.toLowerCase();
    if (lower.includes('offline') || lower.includes('unavailable') || lower.includes('network')) {
      return {
        status: 'unavailable',
        message: `Cloud Firestore (${projectId}) is currently unreachable or offline. Verify network connectivity or check Firebase project status.`,
        projectId,
        authDomain,
        databaseId,
        source: resolution.source,
        checkedAt,
      };
    }
    if (lower.includes('permission')) {
      return {
        status: 'misconfigured',
        message: `Connected to ${projectId}, but Firestore rules rejected the connection probe (test/connection). Deploy updated firestore.rules.`,
        projectId,
        authDomain,
        databaseId,
        source: resolution.source,
        checkedAt,
      };
    }
    return {
      status: 'unavailable',
      message: `Firestore connectivity warning: ${rawMsg}`,
      projectId,
      authDomain,
      databaseId,
      source: resolution.source,
      checkedAt,
    };
  }
}
