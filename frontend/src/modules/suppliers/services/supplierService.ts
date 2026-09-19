import { apiRequest } from '../../../services/apiClient';
import {
  ISupplier,
  ISupplierDetail,
  ISupplierFilterState,
  ISupplierFormData,
  ISupplierMetrics,
  ISupplierProduct,
  SupplierStatus,
} from '../types/supplier.types';
import { IPaginatedResult } from '../../products/types/product.types';

export const supplierService = {
  async getSuppliers(filters: Partial<ISupplierFilterState> = {}): Promise<IPaginatedResult<ISupplier>> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.city) params.append('city', filters.city);
    if (filters.state) params.append('state', filters.state);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);

    const queryString = params.toString();
    const endpoint = queryString ? `/suppliers?${queryString}` : '/suppliers';

    const response = await apiRequest<IPaginatedResult<ISupplier>>(endpoint, {
      method: 'GET',
    });
    return response.data!;
  },

  async getSupplierById(id: string): Promise<ISupplierDetail> {
    const response = await apiRequest<ISupplierDetail>(`/suppliers/${id}`, {
      method: 'GET',
    });
    return response.data!;
  },

  async createSupplier(data: ISupplierFormData): Promise<ISupplier> {
    const response = await apiRequest<ISupplier>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  async updateSupplier(id: string, data: Partial<ISupplierFormData>): Promise<ISupplier> {
    const response = await apiRequest<ISupplier>(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  async updateStatus(id: string, status: SupplierStatus): Promise<ISupplier> {
    const response = await apiRequest<ISupplier>(`/suppliers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return response.data!;
  },

  async deleteSupplier(id: string): Promise<ISupplier> {
    const response = await apiRequest<ISupplier>(`/suppliers/${id}`, {
      method: 'DELETE',
    });
    return response.data!;
  },

  async getMetrics(): Promise<ISupplierMetrics> {
    const response = await apiRequest<ISupplierMetrics>('/suppliers/metrics', {
      method: 'GET',
    });
    return response.data!;
  },

  async getSupplierProducts(supplierId: string): Promise<ISupplierProduct[]> {
    const response = await apiRequest<ISupplierProduct[]>(`/suppliers/${supplierId}/products`, {
      method: 'GET',
    });
    return response.data!;
  },

  async associateProducts(supplierId: string, productIds: string[]): Promise<ISupplierProduct[]> {
    const response = await apiRequest<ISupplierProduct[]>(`/suppliers/${supplierId}/products`, {
      method: 'POST',
      body: JSON.stringify({ product_ids: productIds }),
    });
    return response.data!;
  },

  async disassociateProduct(supplierId: string, productId: string): Promise<void> {
    await apiRequest(`/suppliers/${supplierId}/products/${productId}`, {
      method: 'DELETE',
    });
  },
};
