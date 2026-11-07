import { api } from './axios';
import type { Neighborhood, Paginated } from '../types/api';

export interface NeighborhoodInput {
  name: string;
  description?: string;
  reference?: string;
}

export const neighborhoodsService = {
  list: (params: Record<string, unknown>) =>
    api.get<Paginated<Neighborhood>>('/neighborhoods', { params }).then((r) => r.data),
  create: (input: NeighborhoodInput) =>
    api.post<Neighborhood>('/neighborhoods', input).then((r) => r.data),
  update: (id: string, input: Partial<NeighborhoodInput & { isActive: boolean }>) =>
    api.patch<Neighborhood>(`/neighborhoods/${id}`, input).then((r) => r.data),
  deactivate: (id: string) =>
    api.patch<Neighborhood>(`/neighborhoods/${id}/deactivate`).then((r) => r.data),
};