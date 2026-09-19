import { apiRequest } from '../../../services/apiClient';
import {
  IInventoryFilterState,
  IInventoryItem,
  IInventoryMetrics,
  IStockAdjustmentFormData,
  IStockInFormData,
  IStockOutFormData,
  IStockTransaction,
  ITransactionFilterState,
} from '../types/inventory.types';
import { IPaginatedResult } from '../../products/types/product.types';

export const inventoryService = {
  async getOverview(filters: Partial<IInventoryFilterState> = {}): Promise<IPaginatedResult<IInventoryItem>> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.category_id && filters.category_id !== 'ALL') params.append('category_id', filters.category_id);
    if (filters.stock_status && filters.stock_status !== 'ALL') params.append('stock_status', filters.stock_status);
    if (filters.product_status && filters.product_status !== 'ALL') params.append('product_status', filters.product_status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);

    const queryString = params.toString();
    const endpoint = queryString ? `/inventory?${queryString}` : '/inventory';

    const response = await apiRequest<IPaginatedResult<IInventoryItem>>(endpoint, {
      method: 'GET',
    });
    return response.data!;
  },

  async getItemStock(productId: string): Promise<IInventoryItem> {
    const response = await apiRequest<IInventoryItem>(`/inventory/item/${productId}`, {
      method: 'GET',
    });
    return response.data!;
  },

  async stockIn(data: IStockInFormData): Promise<{ inventory: IInventoryItem; transaction: IStockTransaction }> {
    const payload = {
      product_id: data.product_id,
      quantity: Number(data.quantity),
      reference: data.reference ? data.reference.trim() : undefined,
      reason: data.reason ? data.reason.trim() : undefined,
    };

    const response = await apiRequest<{ inventory: IInventoryItem; transaction: IStockTransaction }>(
      '/inventory/stock-in',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return response.data!;
  },

  async stockOut(data: IStockOutFormData): Promise<{ inventory: IInventoryItem; transaction: IStockTransaction }> {
    const payload = {
      product_id: data.product_id,
      quantity: Number(data.quantity),
      reference: data.reference ? data.reference.trim() : undefined,
      reason: data.reason ? data.reason.trim() : undefined,
    };

    const response = await apiRequest<{ inventory: IInventoryItem; transaction: IStockTransaction }>(
      '/inventory/stock-out',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return response.data!;
  },

  async adjustStock(data: IStockAdjustmentFormData): Promise<{ inventory: IInventoryItem; transaction: IStockTransaction }> {
    const payload = {
      product_id: data.product_id,
      adjustment_type: data.adjustment_type,
      quantity: Number(data.quantity),
      reason: data.reason.trim(),
      reference: data.reference ? data.reference.trim() : undefined,
    };

    const response = await apiRequest<{ inventory: IInventoryItem; transaction: IStockTransaction }>(
      '/inventory/adjust',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return response.data!;
  },

  async getTransactionHistory(filters: Partial<ITransactionFilterState> = {}): Promise<IPaginatedResult<IStockTransaction>> {
    const params = new URLSearchParams();

    if (filters.product_id) params.append('product_id', filters.product_id);
    if (filters.transaction_type && filters.transaction_type !== 'ALL') params.append('transaction_type', filters.transaction_type);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sort_order) params.append('sort_order', filters.sort_order);

    const queryString = params.toString();
    const endpoint = queryString ? `/inventory/transactions?${queryString}` : '/inventory/transactions';

    const response = await apiRequest<IPaginatedResult<IStockTransaction>>(endpoint, {
      method: 'GET',
    });
    return response.data!;
  },

  async getMetrics(): Promise<IInventoryMetrics> {
    const response = await apiRequest<IInventoryMetrics>('/inventory/metrics', {
      method: 'GET',
    });
    return response.data!;
  },
};
