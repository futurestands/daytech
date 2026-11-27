type Environment = Record<string, string | undefined>;

export const previewProjectId = 'daytech-acceptance-preview';
export const previewDatabaseId = '(default)';

export function needsPreviewIsolation(env: Environment) {
  return env.DAYTECH_ENV === 'preview' || env.VITE_DAYTECH_PREVIEW === 'true' ||
    env.VERCEL_ENV === 'preview' || (env.VERCEL === '1' && env.VERCEL_ENV !== 'production');
}

export function validPreviewWebConfig(env: Environment, productionApiKey?: string) {
  const senderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const apiKey = env.VITE_FIREBASE_API_KEY;
  return env.VITE_FEATURE_FIREBASE === 'true' &&
    env.VITE_FIREBASE_PROJECT_ID === previewProjectId &&
    env.VITE_FIREBASE_DATABASE_ID === previewDatabaseId &&
    env.VITE_FIREBASE_AUTH_DOMAIN === previewProjectId + '.firebaseapp.com' &&
    env.VITE_FIREBASE_STORAGE_BUCKET === previewProjectId + '.firebasestorage.app' &&
    Boolean(apiKey && /^AIza[\w-]{35}$/.test(apiKey) && apiKey !== productionApiKey) &&
    Boolean(senderId && /^\d+$/.test(senderId) && env.VITE_FIREBASE_APP_ID?.startsWith(`1:${senderId}:web:`) &&
      /^1:\d+:web:[a-f0-9]+$/.test(env.VITE_FIREBASE_APP_ID));
}

export function previewIntegrationsDisabled(env: Environment) {
  return !env.VITE_GOOGLE_MAPS_API_KEY?.trim() &&
    ['VITE_FEATURE_PAYMENTS', 'VITE_FEATURE_GOOGLE_CALENDAR', 'VITE_FEATURE_WHATSAPP', 'VITE_FEATURE_LIVE_VOICE']
      .every(key => env[key] === 'false');
}
