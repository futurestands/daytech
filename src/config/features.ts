import firebaseAppletConfig from '../../firebase-applet-config.json';

export function parseBooleanFlag(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === '') {
    return false;
  }
  return fallback;
}

function hasValidAppletConfig(cfg: Record<string, unknown> | null | undefined): boolean {
  if (!cfg) return false;
  const projectId = typeof cfg.projectId === 'string' ? cfg.projectId.trim() : '';
  const apiKey = typeof cfg.apiKey === 'string' ? cfg.apiKey.trim() : '';
  const authDomain = typeof cfg.authDomain === 'string' ? cfg.authDomain.trim() : '';
  const appId = typeof cfg.appId === 'string' ? cfg.appId.trim() : '';
  return Boolean(projectId && projectId !== 'remixed-project-id' && apiKey && authDomain && appId);
}

/**
 * Determines whether Firebase is enabled on the client:
 * 1. If VITE_FEATURE_FIREBASE is explicitly set, parseBooleanFlag strictly governs it
 *    ("false" disables Firebase even when firebase-applet-config.json is present).
 * 2. If VITE_FEATURE_FIREBASE is unset (undefined), fall back to true only when
 *    a non-placeholder provisioned firebase-applet-config.json exists.
 */
export function isFirebaseFeatureEnabled(
  envValue: unknown = import.meta.env.VITE_FEATURE_FIREBASE,
  appletConfigAvailable: boolean = hasValidAppletConfig(firebaseAppletConfig as Record<string, unknown>)
): boolean {
  if (typeof envValue === 'boolean') {
    return envValue;
  }
  if (typeof envValue === 'string' && envValue.trim() !== '') {
    return parseBooleanFlag(envValue, false);
  }
  return appletConfigAvailable;
}

export interface ClientFeatureFlags {
  firebase: boolean;
  payments: boolean;
  googleCalendar: boolean;
  whatsapp: boolean;
}

export function getClientFeatureFlags(
  env: Record<string, unknown> = import.meta.env as unknown as Record<string, unknown>
): ClientFeatureFlags {
  return {
    firebase: isFirebaseFeatureEnabled(env.VITE_FEATURE_FIREBASE),
    payments: parseBooleanFlag(env.VITE_FEATURE_PAYMENTS, false),
    googleCalendar: parseBooleanFlag(env.VITE_FEATURE_GOOGLE_CALENDAR, false),
    whatsapp: parseBooleanFlag(env.VITE_FEATURE_WHATSAPP, false),
  };
}
