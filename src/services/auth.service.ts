import { api } from './axios';
import type { AuthUser, LoginResponse } from '../types/api';

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
    return data;
  },

  async me(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>('/auth/me');
    return data;
  },

  async refresh(): Promise<string> {
    const { data } = await api.post<{ accessToken: string }>('/auth/refresh');
    return data.accessToken;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};