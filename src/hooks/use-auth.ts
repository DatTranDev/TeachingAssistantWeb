'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api/auth';
import { ROUTES } from '@/constants/routes';

export function useAuth() {
  const { user, accessToken, isHydrated, setAuth, signOut: storeSignOut } = useAuthStore();
  const router = useRouter();

  const signOut = async () => {
    try {
      await authApi.logout();
    } finally {
      storeSignOut();
      router.replace(ROUTES.LOGIN);
    }
  };

  return {
    user,
    accessToken,
    isHydrated,
    isAuthenticated: !!accessToken,
    setAuth,
    signOut,
  };
}
