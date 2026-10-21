import { apiRequest } from '../../../services/apiClient';
import {
  ISalesOrder,
  ISalesOrderDetail,
  ISalesFilterState,
  ISalesOrderFormData,
  ISalesMetrics,
  SalesStatus,
} from '../types/sales.types';
import { IPaginatedResult } from '../../products/types/product.types';

export const salesService = {
  async getSales(filters: Partial<ISalesFilterState> = {}): Promise<IPaginatedResult<ISalesOrder>> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.customer_id) params.append('customer_id', filters.customer_id);
    if (filters.from_date) params.append('from_date', filters.from_date);
    if (filters.to_date) params.append('to_date', filters.to_date);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);

    const queryString = params.toString();
    const endpoint = queryString ? `/sales?${queryString}` : '/sales';

    const response = await apiRequest<IPaginatedResult<ISalesOrder>>(endpoint, {
      method: 'GET',
    });
    return response.data!;
  },

  async getSaleById(id: string): Promise<ISalesOrderDetail> {
    const response = await apiRequest<ISalesOrderDetail>(`/sales/${id}`, {
      method: 'GET',
    });
    return response.data!;
  },

  async createSale(data: ISalesOrderFormData): Promise<ISalesOrderDetail> {
    const response = await apiRequest<ISalesOrderDetail>('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  async updateSale(id: string, data: Partial<ISalesOrderFormData>): Promise<ISalesOrderDetail> {
    const response = await apiRequest<ISalesOrderDetail>(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  async updateStatus(id: string, status: SalesStatus): Promise<ISalesOrderDetail> {
    const response = await apiRequest<ISalesOrderDetail>(`/sales/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return response.data!;
  },

  async completeSale(id: string): Promise<ISalesOrderDetail> {
    const response = await apiRequest<ISalesOrderDetail>(`/sales/${id}/complete`, {
      method: 'POST',
    });
    return response.data!;
  },

  async getMetrics(): Promise<ISalesMetrics> {
    const response = await apiRequest<ISalesMetrics>('/sales/metrics', {
      method: 'GET',
    });
    return response.data!;
  },
};
