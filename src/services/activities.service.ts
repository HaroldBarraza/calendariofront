import { api } from './axios';
import type { Activity, Conflict, Paginated } from '../types/api';

export interface ActivityInput {
  name: string;
  description?: string;
  activityDate: string;
  timeDefined: boolean;
  startTime?: string;
  status?: string;
  observations?: string;
  placeId: string;
  organizationId: string;
  neighborhoodId: string;
  force?: boolean;
}

export interface ConflictCheckInput {
  activityDate: string;
  timeDefined: boolean;
  startTime?: string;
  placeId: string;
  organizationId: string;
  excludeId?: string;
}

export const activitiesService = {
  list: (params: Record<string, unknown>) =>
    api.get<Paginated<Activity>>('/activities', { params }).then((r) => r.data),
  get: (id: string) =>
    api.get<Activity>(`/activities/${id}`).then((r) => r.data),
  create: (input: ActivityInput) =>
    api.post<Activity>('/activities', input).then((r) => r.data),
  update: (id: string, input: Partial<ActivityInput>) =>
    api.patch<Activity>(`/activities/${id}`, input).then((r) => r.data),
  softDelete: (id: string) =>
    api.patch<Activity>(`/activities/${id}/delete`).then((r) => r.data),
  restore: (id: string) =>
    api.patch<Activity>(`/activities/${id}/restore`).then((r) => r.data),
  checkConflicts: (input: ConflictCheckInput) =>
    api
      .post<{ hasConflicts: boolean; conflicts: Conflict[] }>('/conflicts/check', input)
      .then((r) => r.data),
};

export const calendarService = {
  getRange: (params: {
    dateFrom: string;
    dateTo: string;
    organizationId?: string;
    neighborhoodId?: string;
    placeId?: string;
    status?: string;
  }) =>
    api
      .get<{
        dateFrom: string;
        dateTo: string;
        total: number;
        scheduled: Activity[];
        unscheduled: Activity[];
      }>('/calendar/activities', { params })
      .then((r) => r.data),
};