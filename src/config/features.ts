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

export interface ClientFeatureFlags {
  firebase: boolean;
  payments: boolean;
  googleCalendar: boolean;
  whatsapp: boolean;
}

export function getClientFeatureFlags(): ClientFeatureFlags {
  return {
    firebase: parseBooleanFlag(import.meta.env.VITE_FEATURE_FIREBASE, false),
    payments: parseBooleanFlag(import.meta.env.VITE_FEATURE_PAYMENTS, false),
    googleCalendar: parseBooleanFlag(import.meta.env.VITE_FEATURE_GOOGLE_CALENDAR, false),
    whatsapp: parseBooleanFlag(import.meta.env.VITE_FEATURE_WHATSAPP, false),
  };
}
