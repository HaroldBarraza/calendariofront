import { api } from './axios';
import type { AuthUser, Paginated, Role } from '../types/api';

export interface UserInput {
  email: string;
  password?: string;
  fullName: string;
  role?: Role;
  isActive?: boolean;
}

export const usersService = {
  list: (params: Record<string, unknown>) =>
    api.get<Paginated<AuthUser>>('/users', { params }).then((r) => r.data),
  create: (input: UserInput) =>
    api.post<AuthUser>('/users', input).then((r) => r.data),
  update: (id: string, input: Partial<UserInput>) =>
    api.patch<AuthUser>(`/users/${id}`, input).then((r) => r.data),
};