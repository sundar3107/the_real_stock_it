export type TransactionType = 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT';

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export type AdjustmentType = 'INCREASE' | 'DECREASE' | 'SET_QUANTITY';

export interface IInventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  category_id: string;
  category_name?: string;
  unit: string;
  current_quantity: number;
  reorder_level: number;
  stock_status: StockStatus;
  product_status: string;
  created_at: string;
  updated_at: string;
}

export interface IStockTransaction {
  id: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  transaction_type: TransactionType;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  reference: string | null;
  performed_by: string;
  performer_name?: string;
  created_at: string;
}

export interface IStockInDto {
  product_id: string;
  quantity: number;
  reference?: string;
  reason?: string;
}

export interface IStockOutDto {
  product_id: string;
  quantity: number;
  reference?: string;
  reason?: string;
}

export interface IStockAdjustmentDto {
  product_id: string;
  adjustment_type: AdjustmentType;
  quantity: number;
  reason: string;
  reference?: string;
}

export interface IInventoryFilterQuery {
  search?: string;
  category_id?: string;
  stock_status?: StockStatus | 'ALL';
  product_status?: string | 'ALL';
  page?: number;
  limit?: number;
  sort_by?: 'product_name' | 'sku' | 'current_quantity' | 'reorder_level' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface ITransactionFilterQuery {
  product_id?: string;
  transaction_type?: TransactionType | 'ALL';
  date_from?: string;
  date_to?: string;
  performed_by?: string;
  page?: number;
  limit?: number;
  sort_order?: 'asc' | 'desc';
}

export interface IInventoryMetrics {
  total_items: number;
  in_stock_items: number;
  low_stock_items: number;
  out_of_stock_items: number;
  total_stock_units: number;
}
