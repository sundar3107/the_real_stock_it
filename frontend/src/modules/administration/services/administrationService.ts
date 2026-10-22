import { apiRequest } from '../../../services/apiClient';
import {
  IAdminSummary,
  ICreateUserFormData,
  IRoleWithPermissions,
  ISystemSetting,
  ISystemSettingsMap,
  IUpdateUserFormData,
  IUserFilterQuery,
  IUserItem,
  IUserListResponse,
  UserRole,
  UserStatus,
} from '../types/administration.types';

function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, String(val));
    }
  });
  const str = query.toString();
  return str ? `?${str}` : '';
}

export const administrationService = {
  // User Management
  async getUsers(filters: IUserFilterQuery = {}): Promise<IUserListResponse> {
    const qs = buildQueryString({
      page: filters.page,
      limit: filters.limit,
      search: filters.search,
      role: filters.role,
      status: filters.status,
    });
    const res = await apiRequest<IUserListResponse>(`/admin/users${qs}`);
    return res.data!;
  },

  async getUserById(id: string): Promise<IUserItem> {
    const res = await apiRequest<IUserItem>(`/admin/users/${id}`);
    return res.data!;
  },

  async createUser(data: ICreateUserFormData): Promise<IUserItem> {
    const res = await apiRequest<IUserItem>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async updateUser(id: string, data: IUpdateUserFormData): Promise<IUserItem> {
    const res = await apiRequest<IUserItem>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async updateUserStatus(id: string, status: UserStatus): Promise<IUserItem> {
    const res = await apiRequest<IUserItem>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data!;
  },

  async updateUserRole(id: string, role: UserRole): Promise<IUserItem> {
    const res = await apiRequest<IUserItem>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    return res.data!;
  },

  // Roles & Permissions
  async getRoles(): Promise<IRoleWithPermissions[]> {
    const res = await apiRequest<IRoleWithPermissions[]>('/admin/roles');
    return res.data!;
  },

  // System Settings
  async getSettings(): Promise<{ settings: ISystemSetting[]; map: ISystemSettingsMap }> {
    const res = await apiRequest<{ settings: ISystemSetting[]; map: ISystemSettingsMap }>('/admin/settings');
    return res.data!;
  },

  async updateSettings(settingsMap: Record<string, string>): Promise<ISystemSettingsMap> {
    const res = await apiRequest<ISystemSettingsMap>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings: settingsMap }),
    });
    return res.data!;
  },

  // Telemetry Summary
  async getSummary(): Promise<IAdminSummary> {
    const res = await apiRequest<IAdminSummary>('/admin/summary');
    return res.data!;
  },
};
