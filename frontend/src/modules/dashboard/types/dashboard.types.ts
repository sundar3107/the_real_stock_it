import { UserRole } from '../../authentication/types/auth.types';

export interface IDashboardSummary {
  role: UserRole;
  products: {
    total: number;
    active: number;
    inactive: number;
  };
  inventory: {
    total_items: number;
    in_stock_items: number;
    low_stock_items: number;
    out_of_stock_items: number;
    total_stock_units: number;
  };
  suppliers: {
    total: number;
    active: number;
    inactive: number;
  };
  customers: {
    total: number;
    active: number;
    inactive: number;
  };
  purchases: {
    total_orders: number;
    pending_orders: number;
    received_orders: number;
    cancelled_orders: number;
    total_spend: number;
  };
  sales: {
    total_orders: number;
    pending_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    total_revenue: number;
  };
  invoices: {
    total_invoices: number;
    draft_invoices: number;
    issued_invoices: number;
    paid_invoices: number;
    total_invoiced_value: number;
    total_paid_value: number;
  };
}

export interface IInventoryStockAlert {
  product_id: string;
  product_name: string;
  sku: string;
  category_name?: string;
  current_quantity: number;
  reorder_level: number;
  unit: string;
  stock_status: 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface ICategoryStockDistribution {
  category_id: string;
  category_name: string;
  product_count: number;
  total_units: number;
}

export interface IInventorySummary {
  metrics: {
    total_items: number;
    in_stock_items: number;
    low_stock_items: number;
    out_of_stock_items: number;
    total_stock_units: number;
  };
  low_stock_products: IInventoryStockAlert[];
  out_of_stock_products: IInventoryStockAlert[];
  stock_by_category: ICategoryStockDistribution[];
}

export interface ISalesSummary {
  metrics: {
    total_orders: number;
    draft_orders: number;
    confirmed_orders: number;
    processing_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    total_revenue: number;
  };
  recent_orders: Array<{
    id: string;
    order_number: string;
    customer_name: string;
    order_date: string;
    status: string;
    total: number;
  }>;
  monthly_trend: Array<{
    month: string;
    order_count: number;
    total_revenue: number;
  }>;
}

export interface IPurchaseSummary {
  metrics: {
    total_orders: number;
    draft_orders: number;
    ordered_orders: number;
    partially_received_orders: number;
    received_orders: number;
    cancelled_orders: number;
    total_spend: number;
  };
  pending_orders: Array<{
    id: string;
    po_number: string;
    supplier_name: string;
    order_date: string;
    status: string;
    total: number;
  }>;
  recent_orders: Array<{
    id: string;
    po_number: string;
    supplier_name: string;
    order_date: string;
    status: string;
    total: number;
  }>;
  monthly_trend: Array<{
    month: string;
    order_count: number;
    total_spend: number;
  }>;
}

export interface IRecentActivityItem {
  id: string;
  type:
    | 'PRODUCT_CREATED'
    | 'STOCK_IN'
    | 'STOCK_OUT'
    | 'STOCK_ADJUST'
    | 'PURCHASE_CREATED'
    | 'PURCHASE_RECEIVED'
    | 'SALE_CREATED'
    | 'SALE_COMPLETED'
    | 'INVOICE_CREATED'
    | 'INVOICE_PAID';
  title: string;
  description: string;
  timestamp: string;
  reference_id?: string;
  user_name?: string;
  badge_color: 'blue' | 'emerald' | 'amber' | 'purple' | 'slate' | 'rose';
}

export interface IChartData {
  sales_vs_purchases: Array<{
    month: string;
    sales: number;
    purchases: number;
  }>;
  stock_status_distribution: Array<{
    status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
    count: number;
    percentage: number;
  }>;
  category_distribution: Array<{
    category_name: string;
    product_count: number;
    total_units: number;
  }>;
}
