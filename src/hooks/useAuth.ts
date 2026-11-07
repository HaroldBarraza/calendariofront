import { useCallback } from 'react';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';

export function useAuth() {
  const { accessToken, user, hasHydrated, setSession, clear } = useAuthStore();

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authService.login(email, password);
      setSession(data.accessToken, data.user);
    },
    [setSession],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // aunque falle el logout remoto, limpiamos local
    }
    clear();
  }, [clear]);

  const bootstrap = useCallback(async () => {
    const state = useAuthStore.getState();
    if (state.accessToken && state.user) {
      state.setHydrated();
      return;
    }
    try {
      const token = await authService.refresh();
      const me = await authService.me();
      setSession(token, me);
    } catch {
      clear();
    }
  }, [setSession, clear]);

  return {
    isAuthenticated: Boolean(accessToken && user),
    hasHydrated,
    user,
    login,
    logout,
    bootstrap,
  };
}