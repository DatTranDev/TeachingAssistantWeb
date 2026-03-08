'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { type Locale, defaultLocale, locales } from '@/lib/i18n';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: defaultLocale,
  setLocale: () => undefined,
});

const STORAGE_KEY = 'ta-locale';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return defaultLocale;
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && stored in locales) return stored;
    return defaultLocale;
  });

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
    // Fire-and-forget BE persistence
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      apiClient.patch('/user/preferences', { language: next }).catch(() => {});
    }
  };

  // Sync from authenticated user's stored preference when user changes
  const userLanguage = useAuthStore((s) => s.user?.language as Locale | undefined);
  useEffect(() => {
    if (userLanguage && userLanguage in locales) {
      setLocaleState(userLanguage);
      localStorage.setItem(STORAGE_KEY, userLanguage);
      document.documentElement.lang = userLanguage;
    }
  }, [userLanguage]);

  // Sync <html lang> whenever locale changes
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
