export type CustomerStatus = 'ACTIVE' | 'INACTIVE';

export interface ICustomer {
  id: string;
  customer_name: string;
  company_name: string | null;
  email: string;
  phone: string;
  alternate_phone: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  tax_number: string | null;
  notes: string | null;
  status: CustomerStatus;
  created_at: string;
  updated_at: string;
}

export interface ICustomerFormData {
  customer_name: string;
  company_name?: string | null;
  email: string;
  phone: string;
  alternate_phone?: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  tax_number?: string | null;
  notes?: string | null;
  status?: CustomerStatus;
}

export interface ICustomerFilterState {
  search: string;
  status: CustomerStatus | 'ALL';
  city: string;
  state: string;
  page: number;
  limit: number;
  sort_by: 'customer_name' | 'company_name' | 'city' | 'state' | 'created_at' | 'updated_at';
  sort_order: 'asc' | 'desc';
}

export interface ICustomerMetrics {
  total_customers: number;
  active_customers: number;
  inactive_customers: number;
}

export interface ICustomerDetail extends ICustomer {
  sales_history: any[];
  orders: any[];
  invoices: any[];
}
