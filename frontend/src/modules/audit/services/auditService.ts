import { apiRequest } from '../../../services/apiClient';
import {
  IActivityLog,
  IAuditFilterQuery,
  IAuditListResponse,
} from '../types/audit.types';

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

export const auditService = {
  async getLogs(filters: IAuditFilterQuery = {}): Promise<IAuditListResponse> {
    const qs = buildQueryString({
      page: filters.page,
      limit: filters.limit,
      user_id: filters.user_id,
      module: filters.module,
      action: filters.action,
      entity_type: filters.entity_type,
      start_date: filters.start_date,
      end_date: filters.end_date,
      search: filters.search,
    });
    const res = await apiRequest<IAuditListResponse>(`/audit/logs${qs}`);
    return res.data!;
  },

  async getLogById(id: string): Promise<IActivityLog> {
    const res = await apiRequest<IActivityLog>(`/audit/logs/${id}`);
    return res.data!;
  },
};
