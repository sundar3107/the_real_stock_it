import { apiRequest } from '../../../services/apiClient';
import {
  IAuthResponse,
  ILoginCredentials,
  IRegisterData,
  IRole,
  IUpdateProfileData,
  IUser,
} from '../types/auth.types';

export const authService = {
  async login(credentials: ILoginCredentials): Promise<IAuthResponse> {
    const res = await apiRequest<IAuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return res.data!;
  },

  async register(data: IRegisterData): Promise<IAuthResponse> {
    const res = await apiRequest<IAuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async logout(): Promise<void> {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Best-effort logout notification
    }
  },

  async getCurrentUser(): Promise<{ user: IUser; permissions: string[] }> {
    const res = await apiRequest<{ user: IUser; permissions: string[] }>('/auth/me', {
      method: 'GET',
    });
    return res.data!;
  },

  async updateProfile(updates: IUpdateProfileData): Promise<IUser> {
    const res = await apiRequest<IUser>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res.data!;
  },

  async getRoles(): Promise<IRole[]> {
    const res = await apiRequest<IRole[]>('/auth/roles', {
      method: 'GET',
    });
    return res.data || [];
  },
};
