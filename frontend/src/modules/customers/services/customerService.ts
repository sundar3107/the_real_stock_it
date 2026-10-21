import { apiRequest } from '../../../services/apiClient';
import {
  ICustomer,
  ICustomerDetail,
  ICustomerFilterState,
  ICustomerFormData,
  ICustomerMetrics,
  CustomerStatus,
} from '../types/customer.types';
import { IPaginatedResult } from '../../products/types/product.types';

export const customerService = {
  async getCustomers(filters: Partial<ICustomerFilterState> = {}): Promise<IPaginatedResult<ICustomer>> {
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
    const endpoint = queryString ? `/customers?${queryString}` : '/customers';

    const response = await apiRequest<IPaginatedResult<ICustomer>>(endpoint, {
      method: 'GET',
    });
    return response.data!;
  },

  async getCustomerById(id: string): Promise<ICustomerDetail> {
    const response = await apiRequest<ICustomerDetail>(`/customers/${id}`, {
      method: 'GET',
    });
    return response.data!;
  },

  async createCustomer(data: ICustomerFormData): Promise<ICustomer> {
    const response = await apiRequest<ICustomer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  async updateCustomer(id: string, data: Partial<ICustomerFormData>): Promise<ICustomer> {
    const response = await apiRequest<ICustomer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  async updateStatus(id: string, status: CustomerStatus): Promise<ICustomer> {
    const response = await apiRequest<ICustomer>(`/customers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return response.data!;
  },

  async deleteCustomer(id: string): Promise<ICustomer> {
    const response = await apiRequest<ICustomer>(`/customers/${id}`, {
      method: 'DELETE',
    });
    return response.data!;
  },

  async getMetrics(): Promise<ICustomerMetrics> {
    const response = await apiRequest<ICustomerMetrics>('/customers/metrics', {
      method: 'GET',
    });
    return response.data!;
  },
};
