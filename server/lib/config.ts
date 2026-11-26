import fs from 'fs';
import path from 'path';
import appletConfig from '../../firebase-applet-config.json';
import { CurrencyCode } from '../../src/types/domain';

export function parseBooleanFlag(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === '') {
    return false;
  }
  return fallback;
}

export interface ServerFirebaseConfig {
  projectId: string | null;
  firestoreDatabaseId: string;
}

export function getServerFirebaseConfig(env: NodeJS.ProcessEnv = process.env): ServerFirebaseConfig {
  const webFields = [
    env.VITE_FIREBASE_API_KEY, env.VITE_FIREBASE_AUTH_DOMAIN,
    env.VITE_FIREBASE_PROJECT_ID, env.VITE_FIREBASE_APP_ID,
  ];
  const webOverride = webFields.every((field) => field?.trim()) &&
    env.VITE_FIREBASE_PROJECT_ID?.trim() !== 'remixed-project-id';
  const hasApplet = Boolean(
    appletConfig.projectId?.trim() && appletConfig.projectId !== 'remixed-project-id' &&
    appletConfig.apiKey?.trim() && appletConfig.authDomain?.trim() && appletConfig.appId?.trim()
  );
  const projectId = webOverride
    ? env.VITE_FIREBASE_PROJECT_ID!.trim()
    : hasApplet ? appletConfig.projectId.trim() : null;
  const firestoreDatabaseId = (webOverride
    ? env.VITE_FIREBASE_DATABASE_ID?.trim()
    : hasApplet ? appletConfig.firestoreDatabaseId?.trim() : undefined) || '(default)';


  return {
    projectId,
    firestoreDatabaseId,
  };
}

export function isServerlessRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.VERCEL === '1' || parseBooleanFlag(env.SERVERLESS, false);
}

export function isFirebaseFeatureEnabledServer(env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env.VITE_FEATURE_FIREBASE;
  if (typeof raw === 'string' && raw.trim() !== '') {
    return parseBooleanFlag(raw, false);
  }
  return getServerFirebaseConfig(env).projectId !== null;
}

export function isUnkeyedLocalAdminAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV === 'production' || isServerlessRuntime(env)) {
    return false;
  }
  return parseBooleanFlag(env.ALLOW_UNKEYED_LOCAL_ADMIN, false);
}

export function normalizeCurrency(raw: string | undefined): CurrencyCode {
  const val = (raw || '').trim().toUpperCase();
  if (val.includes('UGX')) return 'UGX';
  if (val.includes('KES')) return 'KES';
  if (val.includes('USD')) return 'USD';
  return 'UGX';
}

export function normalizeTimezone(raw: string | undefined): string {
  const val = (raw || '').trim();
  if (!val || val.toLowerCase() === 'uganda' || val.toLowerCase() === 'eat') {
    return 'Africa/Kampala';
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: val });
    return val;
  } catch {
    return 'Africa/Kampala';
  }
}

export interface StorageStatus {
  persistent: boolean;
  provider: 'local-file-store' | 'firestore' | 'firestore+local' | 'unavailable';
  mode: 'serverless' | 'persistent-node';
  note: string;
}

export function getStorageStatus(env: NodeJS.ProcessEnv = process.env): StorageStatus {
  const serverless = isServerlessRuntime(env);
  const firebaseEnabled = isFirebaseFeatureEnabledServer(env);

  if (serverless) {
    if (firebaseEnabled) {
      return {
        persistent: true,
        provider: 'firestore',
        mode: 'serverless',
        note: 'Serverless runtime using Cloud Firestore (daytech-bba8f) for durable storage. Local disk files are disabled.',
      };
    }
    return {
      persistent: false,
      provider: 'unavailable',
      mode: 'serverless',
      note: 'Serverless runtime requires Cloud Firestore (VITE_FEATURE_FIREBASE="true"). Local file storage is disabled.',
    };
  }

  const dataDir = path.resolve(process.cwd(), 'data');
  let localWritable = false;
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.accessSync(dataDir, fs.constants.R_OK | fs.constants.W_OK);
    localWritable = true;
  } catch {
    localWritable = false;
  }

  if (firebaseEnabled && localWritable) {
    return {
      persistent: true,
      provider: 'firestore+local',
      mode: 'persistent-node',
      note: 'Cloud Firestore active alongside local Node fallback store.',
    };
  }
  if (firebaseEnabled) {
    return {
      persistent: true,
      provider: 'firestore',
      mode: 'persistent-node',
      note: 'Persisted to Cloud Firestore (daytech-bba8f).',
    };
  }
  if (localWritable) {
    return {
      persistent: true,
      provider: 'local-file-store',
      mode: 'persistent-node',
      note: 'Persisted to local server JSON store (Firebase disabled).',
    };
  }

  return {
    persistent: false,
    provider: 'unavailable',
    mode: 'persistent-node',
    note: 'Server storage directory is unavailable and Firebase is disabled.',
  };
}
