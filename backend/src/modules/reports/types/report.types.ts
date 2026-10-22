export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface IInventoryValuationItem {
  product_id: string;
  name: string;
  sku: string;
  category_id: string;
  category_name: string;
  unit: string;
  current_quantity: number;
  reorder_level: number;
  purchase_price: number;
  selling_price: number;
  total_cost_valuation: number;
  total_retail_valuation: number;
  potential_margin: number;
  margin_percentage: number;
  stock_status: StockStatus;
}

export interface IInventoryValuationSummary {
  total_products: number;
  total_units: number;
  total_cost_valuation: number;
  total_retail_valuation: number;
  total_potential_margin: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

export interface IInventoryValuationReport {
  summary: IInventoryValuationSummary;
  items: IInventoryValuationItem[];
}

export interface ISalesReportItem {
  sales_order_id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  order_date: string;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  total_quantity: number;
}

export interface ISalesReportProductSummary {
  product_id: string;
  name: string;
  sku: string;
  units_sold: number;
  total_revenue: number;
}

export interface ISalesReportSummary {
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  total_tax: number;
  total_discount: number;
  average_order_value: number;
}

export interface ISalesReport {
  summary: ISalesReportSummary;
  orders: ISalesReportItem[];
  top_products: ISalesReportProductSummary[];
}

export interface IPurchaseReportItem {
  purchase_order_id: string;
  supplier_id: string;
  supplier_name: string;
  supplier_company: string;
  order_date: string;
  expected_delivery_date: string | null;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  total_ordered: number;
  total_received: number;
  fulfillment_percentage: number;
}

export interface IPurchaseReportSupplierSummary {
  supplier_id: string;
  supplier_name: string;
  orders_count: number;
  total_spend: number;
}

export interface IPurchaseReportSummary {
  total_orders: number;
  received_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  total_spend: number;
  overall_fulfillment_rate: number;
}

export interface IPurchaseReport {
  summary: IPurchaseReportSummary;
  orders: IPurchaseReportItem[];
  supplier_spend: IPurchaseReportSupplierSummary[];
}

export interface IStockMovementReportItem {
  transaction_id: string;
  created_at: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  category_name: string;
  transaction_type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  reference: string | null;
  performed_by_name: string;
  performed_by_email: string;
}

export interface IStockMovementSummary {
  total_movements: number;
  stock_in_count: number;
  stock_in_quantity: number;
  stock_out_count: number;
  stock_out_quantity: number;
  adjustment_count: number;
  net_quantity_change: number;
}

export interface IStockMovementReport {
  summary: IStockMovementSummary;
  movements: IStockMovementReportItem[];
}

export interface IInventoryValuationFilters {
  category_id?: string;
  stock_status?: string;
  search?: string;
}

export interface ISalesReportFilters {
  start_date?: string;
  end_date?: string;
  customer_id?: string;
  status?: string;
  search?: string;
}

export interface IPurchaseReportFilters {
  start_date?: string;
  end_date?: string;
  supplier_id?: string;
  status?: string;
  search?: string;
}

export interface IStockMovementFilters {
  start_date?: string;
  end_date?: string;
  product_id?: string;
  transaction_type?: string;
  search?: string;
}
