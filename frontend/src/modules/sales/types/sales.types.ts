export type SalesStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ISalesOrderItem {
  id: string;
  sales_order_id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  tax: number;
  discount: number;
  line_total: number;
  created_at: string;
}

export interface ISalesOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name?: string;
  company_name?: string | null;
  order_date: string;
  status: SalesStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes: string | null;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface ISalesOrderDetail extends ISalesOrder {
  items: ISalesOrderItem[];
  customer?: {
    id: string;
    customer_name: string;
    company_name: string | null;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    tax_number: string | null;
  } | null;
}

export interface ISalesOrderItemInput {
  product_id: string;
  quantity: number;
  unit_price?: number;
  tax?: number;
  discount?: number;
  line_total?: number;
}

export interface ISalesOrderFormData {
  customer_id: string;
  order_number?: string;
  order_date?: string;
  status?: SalesStatus;
  tax?: number;
  discount?: number;
  notes?: string | null;
  items: ISalesOrderItemInput[];
}

export interface ISalesFilterState {
  search: string;
  status: SalesStatus | 'ALL';
  customer_id: string;
  from_date: string;
  to_date: string;
  page: number;
  limit: number;
  sort_by: 'order_date' | 'total' | 'status' | 'created_at' | 'order_number';
  sort_order: 'asc' | 'desc';
}

export interface ISalesMetrics {
  total_orders: number;
  draft_orders: number;
  confirmed_orders: number;
  processing_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
}
