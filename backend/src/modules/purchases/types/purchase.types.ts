export type PurchaseStatus =
  | 'DRAFT'
  | 'ORDERED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED';

export interface IPurchaseOrder {
  id: string;
  supplier_id: string;
  supplier_name?: string;
  supplier_company?: string;
  order_date: string;
  expected_delivery_date: string | null;
  status: PurchaseStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes: string | null;
  created_by: string;
  creator_name?: string;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface IPurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  unit?: string;
  quantity: number;
  received_quantity: number;
  unit_price: number;
  tax: number;
  discount: number;
  line_total: number;
  created_at: string;
}

export interface IPurchaseOrderItemInput {
  product_id: string;
  quantity: number;
  unit_price: number;
  tax?: number;
  discount?: number;
}

export interface IPurchaseOrderFormData {
  supplier_id: string;
  order_date?: string;
  expected_delivery_date?: string | null;
  notes?: string | null;
  status?: PurchaseStatus;
  tax?: number;
  discount?: number;
  items: IPurchaseOrderItemInput[];
}

export interface IReceiveItemDto {
  item_id: string;
  receive_quantity: number;
}

export interface IReceivePurchaseDto {
  items: IReceiveItemDto[];
  notes?: string;
}

export interface IPurchaseFilterQuery {
  search?: string;
  status?: PurchaseStatus | 'ALL';
  supplier_id?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
  sort_by?: 'order_date' | 'total' | 'status' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface IPurchaseMetrics {
  total_orders: number;
  draft_orders: number;
  ordered_orders: number;
  partially_received_orders: number;
  received_orders: number;
  cancelled_orders: number;
  total_spend: number;
}

export interface IPurchaseOrderDetail extends IPurchaseOrder {
  items: IPurchaseOrderItem[];
  supplier?: any;
  creator?: any;
}
