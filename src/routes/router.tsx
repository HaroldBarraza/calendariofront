import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ActivitiesPage } from '../pages/ActivitiesPage';
import { CalendarPage } from '../pages/CalendarPage';
import { OrganizationsPage } from '../pages/OrganizationsPage';
import { NeighborhoodsPage } from '../pages/NeighborhoodsPage';
import { PlacesPage } from '../pages/PlacesPage';
import { UsersPage } from '../pages/UsersPage';
import { ReportsPage } from '../pages/ReportsPage';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/calendar', element: <CalendarPage /> },
          { path: '/activities', element: <ActivitiesPage /> },
          { path: '/organizations', element: <OrganizationsPage /> },
          { path: '/neighborhoods', element: <NeighborhoodsPage /> },
          { path: '/places', element: <PlacesPage /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/reports', element: <ReportsPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);