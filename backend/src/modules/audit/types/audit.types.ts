export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE'
  | 'UPDATE'
  | 'DEACTIVATE'
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'ADJUSTMENT'
  | 'STATUS_CHANGE'
  | 'SYSTEM_INIT';

export type AuditModule =
  | 'AUTHENTICATION'
  | 'PRODUCTS'
  | 'INVENTORY'
  | 'SUPPLIERS'
  | 'CUSTOMERS'
  | 'PURCHASES'
  | 'SALES'
  | 'INVOICES'
  | 'REPORTS'
  | 'NOTIFICATIONS'
  | 'SYSTEM';

export interface IActivityLog {
  id: string;
  user_id: string | null;
  user_name?: string | null;
  user_email?: string | null;
  action: string;
  module: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string;
  old_value: any | null;
  new_value: any | null;
  metadata: any | null;
  timestamp: string;
}

export interface IRecordActivityDto {
  user_id?: string | null;
  action: string;
  module: string;
  entity_type?: string | null;
  entity_id?: string | null;
  description: string;
  old_value?: any;
  new_value?: any;
  metadata?: any;
}

export interface IAuditFilterQuery {
  search?: string;
  user_id?: string;
  module?: string;
  action?: string;
  entity_type?: string;
  start_date?: string;
  end_date?: string;
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
