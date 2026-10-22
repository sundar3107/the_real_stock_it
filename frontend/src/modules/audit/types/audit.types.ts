export interface IActivityLog {
  id: string;
  user_id: string | null;
  user_name: string;
  user_email: string | null;
  action: string;
  module: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string;
  old_value?: Record<string, any> | null;
  new_value?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  timestamp: string;
}

export interface IAuditFilterQuery {
  user_id?: string;
  module?: string;
  action?: string;
  entity_type?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface IAuditListResponse {
  logs: IActivityLog[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
