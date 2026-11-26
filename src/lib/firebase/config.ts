import firebaseAppletConfig from '../../../firebase-applet-config.json';
import { isFirebaseFeatureEnabled } from '../../config/features';

export const TARGET_FIREBASE_PROJECT_ID = 'daytech-bba8f';

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

export type FirebaseConfigSource = 'env' | 'applet-config' | 'disabled' | 'unconfigured';

export interface FirebaseConfigResolution {
  enabled: boolean;
  source: FirebaseConfigSource;
  config: FirebaseWebConfig | null;
  partialEnvOverride: boolean;
  matchesTargetProject: boolean;
  diagnosticNote: string;
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
 * Resolves Firebase Web SDK configuration with deterministic precedence:
 * 1. Feature gate: VITE_FEATURE_FIREBASE="false" disables Firebase unconditionally.
 * 2. Complete VITE_FIREBASE_* environment variables take Priority 1 (env override).
 * 3. Provisioned firebase-applet-config.json (project: daytech-bba8f) is Priority 2 fallback.
 */
export function resolveFirebaseConfig(
  env: Record<string, string | undefined> = import.meta.env as unknown as Record<string, string | undefined>,
  appletConfig: Partial<FirebaseWebConfig> | null | undefined = firebaseAppletConfig
): FirebaseConfigResolution {
  const hasApplet = isValidConfigObject(appletConfig);
  const featureEnabled = isFirebaseFeatureEnabled(env.VITE_FEATURE_FIREBASE, hasApplet);

  if (!featureEnabled) {
    return {
      enabled: false,
      source: 'disabled',
      config: null,
      partialEnvOverride: false,
      matchesTargetProject: false,
      diagnosticNote: 'Firebase integration is disabled (VITE_FEATURE_FIREBASE="false").',
    };
  }

  const envApiKey = env.VITE_FIREBASE_API_KEY?.trim() || '';
  const envAuthDomain = env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || '';
  const envProjectId = env.VITE_FIREBASE_PROJECT_ID?.trim() || '';
  const envAppId = env.VITE_FIREBASE_APP_ID?.trim() || '';
  const envStorageBucket = env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || '';
  const envSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || '';
  const envDatabaseId = env.VITE_FIREBASE_DATABASE_ID?.trim() || '';

  const providedEnvCount = [envApiKey, envAuthDomain, envProjectId, envAppId].filter(Boolean).length;
  const partialEnvOverride = providedEnvCount > 0 && providedEnvCount < 4;

  if (providedEnvCount === 4 && envProjectId !== 'remixed-project-id') {
    const config: FirebaseWebConfig = {
      apiKey: envApiKey,
      authDomain: envAuthDomain,
      projectId: envProjectId,
      storageBucket: envStorageBucket || `${envProjectId}.firebasestorage.app`,
      messagingSenderId: envSenderId,
      appId: envAppId,
      firestoreDatabaseId: envDatabaseId || undefined,
    };
    return {
      enabled: true,
      source: 'env',
      config,
      partialEnvOverride: false,
      matchesTargetProject: config.projectId === TARGET_FIREBASE_PROJECT_ID,
      diagnosticNote:
        config.projectId === TARGET_FIREBASE_PROJECT_ID
          ? `Configured via VITE_FIREBASE_* environment overrides (project: ${config.projectId}).`
          : `Configured via VITE_FIREBASE_* env overrides (project: ${config.projectId}; expected ${TARGET_FIREBASE_PROJECT_ID}).`,
    };
  }

  if (hasApplet) {
    const config: FirebaseWebConfig = {
      apiKey: appletConfig.apiKey.trim(),
      authDomain: appletConfig.authDomain.trim(),
      projectId: appletConfig.projectId.trim(),
      storageBucket:
        appletConfig.storageBucket?.trim() || `${appletConfig.projectId.trim()}.firebasestorage.app`,
      messagingSenderId: appletConfig.messagingSenderId?.trim() || '',
      appId: appletConfig.appId.trim(),
      firestoreDatabaseId: appletConfig.firestoreDatabaseId?.trim() || undefined,
    };
    return {
      enabled: true,
      source: 'applet-config',
      config,
      partialEnvOverride,
      matchesTargetProject: config.projectId === TARGET_FIREBASE_PROJECT_ID,
      diagnosticNote: partialEnvOverride
        ? `Partial VITE_FIREBASE_* env vars ignored; using firebase-applet-config.json (${config.projectId}).`
        : `Configured via firebase-applet-config.json (project: ${config.projectId}).`,
    };
  }

  return {
    enabled: false,
    source: 'unconfigured',
    config: null,
    partialEnvOverride,
    matchesTargetProject: false,
    diagnosticNote:
      'VITE_FEATURE_FIREBASE is enabled, but neither complete VITE_FIREBASE_* variables nor valid firebase-applet-config.json credentials were found.',
  };
}

export function getFirebaseWebConfig(): FirebaseWebConfig | null {
  return resolveFirebaseConfig().config;
}

export function isFirebaseReady(): boolean {
  const res = resolveFirebaseConfig();
  return res.enabled && res.config !== null;
}
