import firebaseAppletConfig from '../../../firebase-applet-config.json';

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

function isValidConfigObject(cfg: Partial<FirebaseWebConfig> | null | undefined): cfg is FirebaseWebConfig {
  if (!cfg) return false;
  const projectId = cfg.projectId?.trim();
  const apiKey = cfg.apiKey?.trim();
  const authDomain = cfg.authDomain?.trim();
  const appId = cfg.appId?.trim();
  if (!projectId || projectId === 'remixed-project-id' || !apiKey || !authDomain || !appId) {
    return false;
  }
  return true;
}

/**
 * Loads the provisioned Firebase Web SDK config from firebase-applet-config.json
 * (provisioned for project daytech-bba8f), with fallback to VITE_FIREBASE_* env vars.
 */
export function getFirebaseWebConfig(): FirebaseWebConfig | null {
  if (isValidConfigObject(firebaseAppletConfig)) {
    return {
      apiKey: firebaseAppletConfig.apiKey.trim(),
      authDomain: firebaseAppletConfig.authDomain.trim(),
      projectId: firebaseAppletConfig.projectId.trim(),
      storageBucket:
        firebaseAppletConfig.storageBucket?.trim() || `${firebaseAppletConfig.projectId.trim()}.firebasestorage.app`,
      messagingSenderId: firebaseAppletConfig.messagingSenderId?.trim() || '',
      appId: firebaseAppletConfig.appId.trim(),
      firestoreDatabaseId: firebaseAppletConfig.firestoreDatabaseId?.trim() || undefined,
    };
  }

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim();
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = import.meta.env.VITE_FIREBASE_APP_ID?.trim();
  const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID?.trim() || undefined;

  if (!apiKey || !authDomain || !projectId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: storageBucket || `${projectId}.firebasestorage.app`,
    messagingSenderId: messagingSenderId || '',
    appId,
    firestoreDatabaseId,
  };
}

export function isFirebaseReady(): boolean {
  return getFirebaseWebConfig() !== null;
}
