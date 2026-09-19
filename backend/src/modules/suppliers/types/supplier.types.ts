export type SupplierStatus = 'ACTIVE' | 'INACTIVE';

export interface ISupplier {
  id: string;
  supplier_name: string;
  company_name: string;
  email: string;
  phone: string;
  alternate_phone: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  tax_number: string | null;
  contact_person: string;
  notes: string | null;
  status: SupplierStatus;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

export interface ISupplierFormData {
  supplier_name: string;
  company_name: string;
  email: string;
  phone: string;
  alternate_phone?: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  tax_number?: string | null;
  contact_person: string;
  notes?: string | null;
  status?: SupplierStatus;
}

export interface ISupplierFilterQuery {
  search?: string;
  status?: SupplierStatus | 'ALL';
  city?: string;
  state?: string;
  page?: number;
  limit?: number;
  sort_by?: 'supplier_name' | 'company_name' | 'city' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface ISupplierProduct {
  id: string;
  supplier_id: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  category_name?: string;
  purchase_price?: number;
  unit?: string;
  created_at: string;
}

export interface ISupplierMetrics {
  total_suppliers: number;
  active_suppliers: number;
  inactive_suppliers: number;
}
