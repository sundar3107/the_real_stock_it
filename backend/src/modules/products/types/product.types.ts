export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface ICategory {
  id: string;
  name: string;
  description: string | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface IProduct {
  id: string;
  name: string;
  sku: string;
  category_id: string;
  category_name?: string;
  description: string | null;
  unit: string;
  purchase_price: number;
  selling_price: number;
  opening_stock: number;
  current_stock: number;
  reorder_level: number;
  status: ProductStatus;
  stock_status?: StockStatus;
  created_at: string;
  updated_at: string;
}

export interface ICreateProductDto {
  name: string;
  sku: string;
  category_id: string;
  description?: string;
  unit?: string;
  purchase_price: number;
  selling_price: number;
  opening_stock?: number;
  reorder_level?: number;
  status?: ProductStatus;
}

export interface IUpdateProductDto {
  name?: string;
  sku?: string;
  category_id?: string;
  description?: string;
  unit?: string;
  purchase_price?: number;
  selling_price?: number;
  reorder_level?: number;
  status?: ProductStatus;
}

export interface ICreateCategoryDto {
  name: string;
  description?: string;
}

export interface IUpdateCategoryDto {
  name?: string;
  description?: string;
  status?: ProductStatus;
}

export interface IProductFilterQuery {
  search?: string;
  category_id?: string;
  status?: ProductStatus | 'ALL';
  stock_status?: StockStatus | 'ALL';
  page?: number;
  limit?: number;
  sort_by?: 'name' | 'sku' | 'selling_price' | 'current_stock' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface IPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
