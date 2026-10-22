import { apiRequest } from '../../../services/apiClient';
import {
  IChartData,
  IDashboardSummary,
  IInventorySummary,
  IPurchaseSummary,
  IRecentActivityItem,
  ISalesSummary,
} from '../types/dashboard.types';

export const dashboardService = {
  async getSummary(): Promise<IDashboardSummary> {
    const response = await apiRequest<IDashboardSummary>('/dashboard/summary', {
      method: 'GET',
    });
    return response.data!;
  },

  async getInventory(): Promise<IInventorySummary> {
    const response = await apiRequest<IInventorySummary>('/dashboard/inventory', {
      method: 'GET',
    });
    return response.data!;
  },

  async getSales(): Promise<ISalesSummary> {
    const response = await apiRequest<ISalesSummary>('/dashboard/sales', {
      method: 'GET',
    });
    return response.data!;
  },

  async getPurchases(): Promise<IPurchaseSummary> {
    const response = await apiRequest<IPurchaseSummary>('/dashboard/purchases', {
      method: 'GET',
    });
    return response.data!;
  },

  async getRecent(limit = 10): Promise<IRecentActivityItem[]> {
    const response = await apiRequest<IRecentActivityItem[]>(`/dashboard/recent?limit=${limit}`, {
      method: 'GET',
    });
    return response.data!;
  },

  async getCharts(): Promise<IChartData> {
    const response = await apiRequest<IChartData>('/dashboard/charts', {
      method: 'GET',
    });
    return response.data!;
  },
};
