import { api } from './axios';
import type { Paginated, Place } from '../types/api';

export interface PlaceInput {
  name: string;
  address: string;
  reference?: string;
  description?: string;
}

export const placesService = {
  list: (params: Record<string, unknown>) =>
    api.get<Paginated<Place>>('/places', { params }).then((r) => r.data),
  create: (input: PlaceInput) =>
    api.post<Place>('/places', input).then((r) => r.data),
  update: (id: string, input: Partial<PlaceInput & { isActive: boolean }>) =>
    api.patch<Place>(`/places/${id}`, input).then((r) => r.data),
  deactivate: (id: string) =>
    api.patch<Place>(`/places/${id}/deactivate`).then((r) => r.data),
};