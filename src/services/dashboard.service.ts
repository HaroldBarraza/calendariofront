import { api } from './axios';
import type { DashboardCharts, DashboardSummary } from '../types/api';

export interface DashboardFilters {
  organizationId?: string;
  neighborhoodId?: string;
  placeId?: string;
  status?: string;
  timeDefined?: boolean;
  month?: number;
}

export const dashboardService = {
  summary: (params: DashboardFilters) =>
    api.get<DashboardSummary>('/dashboard/summary', { params }).then((r) => r.data),
  charts: (params: DashboardFilters) =>
    api.get<DashboardCharts>('/dashboard/charts', { params }).then((r) => r.data),
};