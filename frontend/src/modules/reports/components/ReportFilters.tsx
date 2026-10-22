import React from 'react';
import { Search, RotateCcw, Calendar, Filter } from 'lucide-react';
import { IReportFilterParams, ReportType } from '../types/report.types';

interface ReportFiltersProps {
  reportType: ReportType;
  filters: IReportFilterParams;
  onChange: (newFilters: IReportFilterParams) => void;
  onReset: () => void;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  reportType,
  filters,
  onChange,
  onReset,
}) => {
  const handleInputChange = (field: keyof IReportFilterParams, value: string) => {
    onChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Report Filters &amp; Parameters</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition py-1 px-2 rounded border border-slate-200 hover:bg-slate-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <label className="block text-xs font-medium text-slate-500 mb-1">Search Keywords</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={
                reportType === 'inventory'
                  ? 'Search by SKU or Name...'
                  : reportType === 'sales'
                  ? 'Order # or Customer...'
                  : reportType === 'purchases'
                  ? 'Supplier name...'
                  : 'Product, SKU, reason...'
              }
              value={filters.search || ''}
              onChange={(e) => handleInputChange('search', e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Date Range - Not used for inventory snapshot */}
        {reportType !== 'inventory' ? (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Stock Status</label>
            <select
              value={filters.stock_status || 'ALL'}
              onChange={(e) => handleInputChange('stock_status', e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="IN_STOCK">In Stock (Healthy)</option>
              <option value="LOW_STOCK">Low Stock (Alert)</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        )}

        {/* Dynamic Context Status */}
        {reportType === 'sales' && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Order Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="DRAFT">Draft</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        )}

        {reportType === 'purchases' && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Fulfillment Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="RECEIVED">Fully Received</option>
              <option value="PARTIALLY_RECEIVED">Partially Received</option>
              <option value="ORDERED">Ordered</option>
              <option value="DRAFT">Draft</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        )}

        {reportType === 'movement' && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Movement Type</label>
            <select
              value={filters.transaction_type || ''}
              onChange={(e) => handleInputChange('transaction_type', e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Movement Types</option>
              <option value="STOCK_IN">Stock In (+)</option>
              <option value="STOCK_OUT">Stock Out (-)</option>
              <option value="ADJUSTMENT">Stock Adjustment (&plusmn;)</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
