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
const firebaseConfigured = isFirebaseReady();

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
        persistent: true,
        provider: 'local-file-store',
        note: 'Checking backend storage status...',
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
    const firebaseActive = isFirebaseReady();

    fetch('/api/public-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PublicConfig | null) => {
        if (active && data) {
          const localPersistent = Boolean(data.storage?.persistent);
          setPublicConfig({
            ...data,
            features: {
              firebaseEnabled: firebaseActive,
              paymentsEnabled: Boolean(clientFlags.payments && data.features.paymentsEnabled),
              googleCalendarEnabled: Boolean(clientFlags.googleCalendar && data.features.googleCalendarEnabled),
              whatsappEnabled: Boolean(clientFlags.whatsapp && data.features.whatsappEnabled && data.officialWhatsApp),
            },
            storage: firebaseActive
              ? {
                  persistent: true,
                  provider: localPersistent ? 'firestore+local' : 'firestore',
                  note: localPersistent
                    ? 'Persisted to Cloud Firestore (daytech-bba8f) with local server mirror.'
                    : 'Persisted to Cloud Firestore (daytech-bba8f).',
                }
              : data.storage,
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
            storage: firebaseActive
              ? {
                  persistent: true,
                  provider: 'firestore',
                  note: 'Persisted to Cloud Firestore (daytech-bba8f).',
                }
              : {
                  persistent: false,
                  provider: 'unavailable',
                  note: 'Backend persistence server is unreachable. Submissions cannot be stored.',
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
