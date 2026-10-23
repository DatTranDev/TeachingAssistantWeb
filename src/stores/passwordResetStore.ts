import { create } from 'zustand';

export interface ResetGrant {
  email: string;
  resetToken: string;
  expiresAt: string;
}

// Deliberately memory-only: reset credentials never enter URLs or browser storage.
export const usePasswordResetStore = create<{
  grant: ResetGrant | null;
  setGrant: (grant: ResetGrant) => void;
  clear: () => void;
}>((set) => ({
  grant: null,
  setGrant: (grant) => set({ grant }),
  clear: () => set({ grant: null }),
}));
