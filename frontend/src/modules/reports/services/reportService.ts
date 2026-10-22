import { apiRequest } from '../../../services/apiClient';
import { API_CONFIG } from '../../../config/apiConfig';
import { tokenStorage } from '../../authentication/utils/tokenStorage';
import {
  IInventoryValuationReport,
  IPurchaseReport,
  IReportFilterParams,
  ISalesReport,
  IStockMovementReport,
  ReportType,
} from '../types/report.types';

function buildQueryString(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  const str = query.toString();
  return str ? `?${str}` : '';
}

export const reportService = {
  async getInventoryValuation(params: IReportFilterParams = {}): Promise<IInventoryValuationReport> {
    const qs = buildQueryString({
      category_id: params.category_id,
      stock_status: params.stock_status,
      search: params.search,
    });
    const res = await apiRequest<IInventoryValuationReport>(`/reports/inventory-valuation${qs}`);
    return res.data!;
  },

  async getSalesReport(params: IReportFilterParams = {}): Promise<ISalesReport> {
    const qs = buildQueryString({
      start_date: params.start_date,
      end_date: params.end_date,
      customer_id: params.customer_id,
      status: params.status,
      search: params.search,
    });
    const res = await apiRequest<ISalesReport>(`/reports/sales${qs}`);
    return res.data!;
  },

  async getPurchasesReport(params: IReportFilterParams = {}): Promise<IPurchaseReport> {
    const qs = buildQueryString({
      start_date: params.start_date,
      end_date: params.end_date,
      supplier_id: params.supplier_id,
      status: params.status,
      search: params.search,
    });
    const res = await apiRequest<IPurchaseReport>(`/reports/purchases${qs}`);
    return res.data!;
  },

  async getStockMovementReport(params: IReportFilterParams = {}): Promise<IStockMovementReport> {
    const qs = buildQueryString({
      start_date: params.start_date,
      end_date: params.end_date,
      product_id: params.category_id, // can be used for product
      transaction_type: params.transaction_type,
      search: params.search,
    });
    const res = await apiRequest<IStockMovementReport>(`/reports/stock-movement${qs}`);
    return res.data!;
  },

  async downloadCsv(reportType: ReportType, params: IReportFilterParams = {}): Promise<void> {
    const qs = buildQueryString({
      report_type: reportType,
      format: 'csv',
      ...params,
    });
    const url = `${API_CONFIG.BASE_URL}/reports/export${qs}`;
    const token = tokenStorage.getToken();

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download report: HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;

    const disposition = response.headers.get('content-disposition');
    let filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};
