import { apiRequest } from '../../../services/apiClient';
import {
  IProduct,
  IProductFilterState,
  IProductFormData,
  IPaginatedResult,
} from '../types/product.types';

export const productService = {
  async getProducts(filters: Partial<IProductFilterState> = {}): Promise<IPaginatedResult<IProduct>> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.category_id && filters.category_id !== 'ALL') params.append('category_id', filters.category_id);
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.stock_status && filters.stock_status !== 'ALL') params.append('stock_status', filters.stock_status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);

    const queryString = params.toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';

    const response = await apiRequest<IPaginatedResult<IProduct>>(endpoint, {
      method: 'GET',
    });
    return response.data!;
  },

  async getProductById(id: string): Promise<IProduct> {
    const response = await apiRequest<IProduct>(`/products/${id}`, {
      method: 'GET',
    });
    return response.data!;
  },

  async createProduct(data: IProductFormData): Promise<IProduct> {
    const payload = {
      name: data.name.trim(),
      sku: data.sku.trim().toUpperCase(),
      category_id: data.category_id,
      description: data.description ? data.description.trim() : null,
      unit: data.unit || 'pcs',
      purchase_price: Number(data.purchase_price) || 0,
      selling_price: Number(data.selling_price) || 0,
      opening_stock: data.opening_stock !== undefined ? Number(data.opening_stock) : 0,
      reorder_level: data.reorder_level !== undefined ? Number(data.reorder_level) : 10,
      status: data.status,
    };

    const response = await apiRequest<IProduct>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data!;
  },

  async updateProduct(id: string, data: Partial<IProductFormData>): Promise<IProduct> {
    const payload: any = { ...data };
    if (payload.purchase_price !== undefined) payload.purchase_price = Number(payload.purchase_price);
    if (payload.selling_price !== undefined) payload.selling_price = Number(payload.selling_price);
    if (payload.reorder_level !== undefined) payload.reorder_level = Number(payload.reorder_level);
    if (payload.sku) payload.sku = payload.sku.trim().toUpperCase();

    const response = await apiRequest<IProduct>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response.data!;
  },

  async deactivateProduct(id: string): Promise<IProduct> {
    const response = await apiRequest<IProduct>(`/products/${id}`, {
      method: 'DELETE',
    });
    return response.data!;
  },
};
