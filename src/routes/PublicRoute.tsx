import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

export function PublicRoute() {
  const { accessToken, user, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Cargando…
      </div>
    );
  }

  if (accessToken && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}