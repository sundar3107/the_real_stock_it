export type UserRole =
  | 'ADMIN'
  | 'INVENTORY_MANAGER'
  | 'SALES_MANAGER'
  | 'PURCHASE_MANAGER'
  | 'VIEWER';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface IUserItem {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface IUserFilterQuery {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface IUserListResponse {
  users: IUserItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ICreateUserFormData {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
}

export interface IUpdateUserFormData {
  full_name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface IRoleWithPermissions {
  id: string;
  name: UserRole;
  description: string | null;
  created_at: string;
  permissions: string[];
}

export interface ISystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  category: string;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export type ISystemSettingsMap = Record<string, string>;

export interface IAdminSummary {
  users: {
    total: number;
    active: number;
    inactive: number;
    by_role: Record<string, number>;
  };
  catalog: {
    total_products: number;
    total_categories: number;
    total_suppliers: number;
    total_customers: number;
  };
  transactions: {
    total_purchase_orders: number;
    total_sales_orders: number;
    total_invoices: number;
  };
  system: {
    status: 'HEALTHY' | 'DEGRADED';
    version: string;
    uptime_seconds: number;
    node_version: string;
    database_driver: string;
    active_settings_count: number;
    total_audit_logs: number;
    unread_notifications: number;
  };
}
