import { api } from './axios';
import type { Organization, Paginated } from '../types/api';

export interface OrganizationInput {
  name: string;
  description?: string;
  contactName?: string;
  contactPhone?: string;
}

export const organizationsService = {
  list: (params: Record<string, unknown>) =>
    api.get<Paginated<Organization>>('/organizations', { params }).then((r) => r.data),
  create: (input: OrganizationInput) =>
    api.post<Organization>('/organizations', input).then((r) => r.data),
  update: (id: string, input: Partial<OrganizationInput & { isActive: boolean }>) =>
    api.patch<Organization>(`/organizations/${id}`, input).then((r) => r.data),
  deactivate: (id: string) =>
    api.patch<Organization>(`/organizations/${id}/deactivate`).then((r) => r.data),
};