export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'CANCELLED';

export interface IInvoiceItem {
  id: string;
  invoice_id: string;
  product_id?: string | null;
  product_name?: string;
  product_sku?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax: number;
  discount: number;
  line_total: number;
  created_at: string;
}

export interface IInvoice {
  id: string;
  invoice_number: string;
  sales_order_id?: string | null;
  sales_order_number?: string | null;
  customer_id: string;
  customer_name?: string;
  company_name?: string | null;
  invoice_date: string;
  due_date: string;
  status: InvoiceStatus;
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

export interface IInvoiceDetail extends IInvoice {
  items: IInvoiceItem[];
  customer?: {
    id: string;
    customer_name: string;
    company_name: string | null;
    email: string;
    phone: string;
    alternate_phone?: string | null;
    address: string;
    city: string;
    state: string;
    country?: string;
    postal_code: string;
    tax_number: string | null;
  } | null;
  sales_order?: {
    id: string;
    order_number: string;
    order_date: string;
    status: string;
    total: number;
  } | null;
}

export interface IInvoiceItemInput {
  product_id?: string | null;
  description: string;
  quantity: number;
  unit_price?: number;
  tax?: number;
  discount?: number;
  line_total?: number;
}

export interface IInvoiceFormData {
  invoice_number?: string;
  sales_order_id?: string | null;
  customer_id: string;
  invoice_date?: string;
  due_date?: string;
  status?: InvoiceStatus;
  tax?: number;
  discount?: number;
  notes?: string | null;
  items?: IInvoiceItemInput[];
}

export interface IInvoiceFilterQuery {
  search?: string;
  status?: InvoiceStatus | 'ALL';
  customer_id?: string;
  sales_order_id?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
  sort_by?: 'invoice_date' | 'due_date' | 'total' | 'status' | 'created_at' | 'invoice_number';
  sort_order?: 'asc' | 'desc';
}

export interface IInvoiceMetrics {
  total_invoices: number;
  draft_invoices: number;
  issued_invoices: number;
  paid_invoices: number;
  partially_paid_invoices: number;
  cancelled_invoices: number;
  total_invoiced_value: number;
  total_paid_value: number;
}
