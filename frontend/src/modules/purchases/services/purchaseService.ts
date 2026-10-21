import { apiRequest } from '../../../services/apiClient';
import {
  IPurchaseOrder,
  IPurchaseOrderDetail,
  IPurchaseFilterState,
  IPurchaseOrderFormData,
  IPurchaseMetrics,
  IReceivePurchaseDto,
  PurchaseStatus,
} from '../types/purchase.types';
import { IPaginatedResult } from '../../products/types/product.types';

export const purchaseService = {
  async getPurchases(filters: Partial<IPurchaseFilterState> = {}): Promise<IPaginatedResult<IPurchaseOrder>> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.supplier_id) params.append('supplier_id', filters.supplier_id);
    if (filters.from_date) params.append('from_date', filters.from_date);
    if (filters.to_date) params.append('to_date', filters.to_date);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);

    const queryString = params.toString();
    const endpoint = queryString ? `/purchases?${queryString}` : '/purchases';

    const response = await apiRequest<IPaginatedResult<IPurchaseOrder>>(endpoint, {
      method: 'GET',
    });
    return response.data!;
  },

  async getPurchaseById(id: string): Promise<IPurchaseOrderDetail> {
    const response = await apiRequest<IPurchaseOrderDetail>(`/purchases/${id}`, {
      method: 'GET',
    });
    return response.data!;
  },

  async createPurchase(data: IPurchaseOrderFormData): Promise<IPurchaseOrderDetail> {
    const response = await apiRequest<IPurchaseOrderDetail>('/purchases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  async updatePurchase(id: string, data: Partial<IPurchaseOrderFormData>): Promise<IPurchaseOrderDetail> {
    const response = await apiRequest<IPurchaseOrderDetail>(`/purchases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  async updateStatus(id: string, status: PurchaseStatus): Promise<IPurchaseOrderDetail> {
    const response = await apiRequest<IPurchaseOrderDetail>(`/purchases/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return response.data!;
  },

  async receivePurchase(
    id: string,
    dto: IReceivePurchaseDto
  ): Promise<{ purchase_order: IPurchaseOrderDetail; received_count: number }> {
    const response = await apiRequest<{ purchase_order: IPurchaseOrderDetail; received_count: number }>(
      `/purchases/${id}/receive`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      }
    );
    return response.data!;
  },

  async getMetrics(): Promise<IPurchaseMetrics> {
    const response = await apiRequest<IPurchaseMetrics>('/purchases/metrics', {
      method: 'GET',
    });
    return response.data!;
  },
};
