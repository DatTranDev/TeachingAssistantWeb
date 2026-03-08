'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { injectAuthStore } from '@/lib/api/client';
import { authApi } from '@/lib/api/auth';

/**
 * AuthProvider — placed in the root layout.
 * 1. Injects the auth store into the Axios client so request interceptors can access the token.
 * 2. On mount, attempts to hydrate the session by calling the internal /api/auth/refresh route handler.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, setAccessToken, signOut } = useAuthStore();

  // Inject store reference into Axios client (runs once, before any API call)
  useEffect(() => {
    injectAuthStore({
      getAccessToken: () => useAuthStore.getState().accessToken,
      setAccessToken,
      signOut,
    });
  }, [setAccessToken, signOut]);

  // Hydrate session from httpOnly cookie on mount
  useEffect(() => {
    const hydrate = async () => {
      try {
        const res = await fetch('/api/auth/refresh', { cache: 'no-store' });
        if (res.ok) {
          const { accessToken } = (await res.json()) as { accessToken: string };
          setAccessToken(accessToken);
          // Fetch full user profile (includes language & colorMode preferences)
          try {
            const user = await authApi.getMe();
            setAuth(user, accessToken);
          } catch {
            // Token valid but profile fetch failed — still hydrated
          }
        }
      } catch {
        // Not authenticated — middleware (WEB-009) will handle redirect
      } finally {
        useAuthStore.setState({ isHydrated: true });
      }
    };

    void hydrate();
  }, [setAuth, setAccessToken]);

  return <>{children}</>;
}
