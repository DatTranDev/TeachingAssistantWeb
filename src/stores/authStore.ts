import { create } from 'zustand';
import type { User } from '@/types/domain';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isHydrated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isHydrated: false,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  setAccessToken: (accessToken) => set({ accessToken }),
  signOut: () => set({ user: null, accessToken: null, isHydrated: true }),
}));

/** Getter for use outside React (e.g. Axios interceptor) */
export const getAuthStore = () => useAuthStore.getState();
