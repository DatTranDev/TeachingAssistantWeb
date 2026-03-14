'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import type { ColorMode } from '@/types/domain';

export type { ColorMode };

interface ColorModeContextValue {
  colorMode: ColorMode;
  resolvedMode: 'light' | 'dark';
  setColorMode: (mode: ColorMode) => void;
}

const ColorModeContext = createContext<ColorModeContextValue>({
  colorMode: 'system',
  resolvedMode: 'light',
  setColorMode: () => undefined,
});

const STORAGE_KEY = 'ta-color-mode';

function getSystemDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorModeState] = useState<ColorMode>('system');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ColorMode | null;
    if (stored) {
      setColorModeState(stored);
    }
  }, []);

  const [systemDark, setSystemDark] = useState(getSystemDark);

  // Listen for OS-level preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Apply or remove `.dark` class on <html>
  useEffect(() => {
    const isDark = colorMode === 'dark' || (colorMode === 'system' && systemDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, [colorMode, systemDark]);

  // Sync from authenticated user's stored preference when user changes
  const userColorMode = useAuthStore((s) => s.user?.colorMode as ColorMode | undefined);
  useEffect(() => {
    if (userColorMode) {
      setColorModeState(userColorMode);
      localStorage.setItem(STORAGE_KEY, userColorMode);
    }
  }, [userColorMode]);

  const setColorMode = (mode: ColorMode) => {
    setColorModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    // Fire-and-forget BE persistence
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      apiClient.patch('/user/preferences', { colorMode: mode }).catch(() => {});
    }
  };

  const resolvedMode = colorMode === 'system' ? (systemDark ? 'dark' : 'light') : colorMode;

  return (
    <ColorModeContext.Provider value={{ colorMode, resolvedMode, setColorMode }}>
      {children}
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  return useContext(ColorModeContext);
}
