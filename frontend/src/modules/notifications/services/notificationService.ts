import { apiRequest } from '../../../services/apiClient';
import {
  INotification,
  INotificationFilterQuery,
  INotificationListResponse,
} from '../types/notification.types';

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

export const notificationService = {
  async getNotifications(filters: INotificationFilterQuery = {}): Promise<INotificationListResponse> {
    const qs = buildQueryString({
      page: filters.page,
      limit: filters.limit,
      is_read: filters.is_read,
      type: filters.type,
    });
    const res = await apiRequest<INotificationListResponse>(`/notifications${qs}`);
    return res.data!;
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiRequest<{ unread_count: number }>('/notifications/unread-count');
    return res.data?.unread_count ?? 0;
  },

  async markAsRead(id: string): Promise<INotification> {
    const res = await apiRequest<INotification>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
    return res.data!;
  },

  async markAllAsRead(): Promise<{ updated_count: number }> {
    const res = await apiRequest<{ updated_count: number }>('/notifications/read-all', {
      method: 'PATCH',
    });
    return res.data!;
  },
};
