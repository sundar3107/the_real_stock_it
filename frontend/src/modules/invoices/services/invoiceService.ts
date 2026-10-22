import { apiRequest } from '../../../services/apiClient';
import {
  IInvoice,
  IInvoiceDetail,
  IInvoiceFilterState,
  IInvoiceFormData,
  IInvoiceMetrics,
  InvoiceStatus,
} from '../types/invoice.types';
import { IPaginatedResult } from '../../products/types/product.types';

export const invoiceService = {
  async getInvoices(filters: Partial<IInvoiceFilterState> = {}): Promise<IPaginatedResult<IInvoice>> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.customer_id) params.append('customer_id', filters.customer_id);
    if (filters.sales_order_id) params.append('sales_order_id', filters.sales_order_id);
    if (filters.from_date) params.append('from_date', filters.from_date);
    if (filters.to_date) params.append('to_date', filters.to_date);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);

    const queryString = params.toString();
    const endpoint = queryString ? `/invoices?${queryString}` : '/invoices';

    const response = await apiRequest<IPaginatedResult<IInvoice>>(endpoint, {
      method: 'GET',
    });
    return response.data!;
  },

  async getInvoiceById(id: string): Promise<IInvoiceDetail> {
    const response = await apiRequest<IInvoiceDetail>(`/invoices/${id}`, {
      method: 'GET',
    });
    return response.data!;
  },

  async getPreviewFromSales(salesOrderId: string): Promise<Partial<IInvoiceFormData> & { items: any[]; sales_order_number: string }> {
    const response = await apiRequest<any>(`/invoices/preview-sales/${salesOrderId}`, {
      method: 'GET',
    });
    return response.data!;
  },

  async createInvoice(data: IInvoiceFormData): Promise<IInvoiceDetail> {
    const response = await apiRequest<IInvoiceDetail>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  async updateInvoice(id: string, data: Partial<IInvoiceFormData>): Promise<IInvoiceDetail> {
    const response = await apiRequest<IInvoiceDetail>(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  async updateStatus(id: string, status: InvoiceStatus): Promise<IInvoiceDetail> {
    const response = await apiRequest<IInvoiceDetail>(`/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return response.data!;
  },

  async getMetrics(): Promise<IInvoiceMetrics> {
    const response = await apiRequest<IInvoiceMetrics>('/invoices/metrics', {
      method: 'GET',
    });
    return response.data!;
  },
};
