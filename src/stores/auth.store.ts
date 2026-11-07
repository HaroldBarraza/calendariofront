import { create } from 'zustand';
import type { AuthUser } from '../types/api';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  hasHydrated: boolean;
  setSession: (token: string, user: AuthUser) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  setHydrated: () => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  hasHydrated: false,
  setSession: (accessToken, user) => set({ accessToken, user, hasHydrated: true }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  setHydrated: () => set({ hasHydrated: true }),
  clear: () => set({ accessToken: null, user: null, hasHydrated: true }),
}));