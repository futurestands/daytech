import React, { createContext, useContext, useEffect, useState } from 'react';
import { CurrencyCode, PublicConfig } from '../types/domain';
import { getClientFeatureFlags } from '../config/features';
import { isFirebaseReady } from '../lib/firebase/config';

type ThemeMode = 'light' | 'dark';

interface AppContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  publicConfig: PublicConfig;
}

const initialFlags = getClientFeatureFlags();
const firebaseConfigured = isFirebaseReady() && initialFlags.firebase;

const DEFAULT_CONFIG: PublicConfig = {
  defaultCurrency: 'UGX',
  defaultTimezone: 'Africa/Kampala',
  officialEmail: null,
  officialPhone: null,
  officialWhatsApp: null,
  officialAddress: null,
  features: {
    firebaseEnabled: firebaseConfigured,
    paymentsEnabled: initialFlags.payments,
    googleCalendarEnabled: initialFlags.googleCalendar,
    whatsappEnabled: false,
  },
  storage: firebaseConfigured
    ? {
        persistent: true,
        provider: 'firestore',
        note: 'Persisted to Cloud Firestore (daytech-bba8f).',
      }
    : {
        persistent: false,
        provider: 'unavailable',
        note: 'Checking backend persistence status...',
      },
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  const [currency, setCurrency] = useState<CurrencyCode>('UGX');
  const [publicConfig, setPublicConfig] = useState<PublicConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('daytech-theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    let active = true;
    const clientFlags = getClientFeatureFlags();
    const firebaseActive = isFirebaseReady() && clientFlags.firebase;

    fetch('/api/public-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PublicConfig | null) => {
        if (active && data) {
          const serverLocalPersistent = data.storage?.provider === 'local-file-store';
          const effectiveStorage = firebaseActive
            ? {
                persistent: true,
                provider: serverLocalPersistent ? ('firestore+local' as const) : ('firestore' as const),
                note: serverLocalPersistent
                  ? 'Persisted to Cloud Firestore (daytech-bba8f) with local server mirror.'
                  : 'Persisted to Cloud Firestore (daytech-bba8f).',
              }
            : data.storage || {
                persistent: false,
                provider: 'unavailable' as const,
                note: 'Persistent storage is unavailable (Firebase disabled and no durable server storage).',
              };

          setPublicConfig({
            ...data,
            features: {
              firebaseEnabled: firebaseActive,
              paymentsEnabled: Boolean(clientFlags.payments && data.features.paymentsEnabled),
              googleCalendarEnabled: Boolean(clientFlags.googleCalendar && data.features.googleCalendarEnabled),
              whatsappEnabled: Boolean(clientFlags.whatsapp && data.features.whatsappEnabled && data.officialWhatsApp),
            },
            storage: effectiveStorage,
          });
          if (
            data.defaultCurrency === 'UGX' ||
            data.defaultCurrency === 'USD' ||
            data.defaultCurrency === 'KES'
          ) {
            setCurrency(data.defaultCurrency);
          }
        }
      })
      .catch(() => {
        if (active) {
          setPublicConfig((prev) => ({
            ...prev,
            features: {
              ...prev.features,
              firebaseEnabled: firebaseActive,
            },
            storage: firebaseActive
              ? {
                  persistent: true,
                  provider: 'firestore',
                  note: 'Persisted to Cloud Firestore (daytech-bba8f).',
                }
              : {
                  persistent: false,
                  provider: 'unavailable',
                  note: 'Backend persistence server is unreachable and Firebase is disabled. Submissions cannot be stored.',
                },
          }));
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme, currency, setCurrency, publicConfig }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used inside AppProvider');
  }
  return ctx;
}
