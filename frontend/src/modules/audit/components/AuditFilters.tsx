import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { IAuditFilterQuery } from '../types/audit.types';

interface AuditFiltersProps {
  filters: IAuditFilterQuery;
  onChange: (updated: Partial<IAuditFilterQuery>) => void;
  onReset: () => void;
}

const MODULE_OPTIONS = [
  { value: '', label: 'All Modules' },
  { value: 'AUTH', label: 'Authentication' },
  { value: 'PRODUCT', label: 'Products' },
  { value: 'INVENTORY', label: 'Inventory' },
  { value: 'SUPPLIER', label: 'Suppliers' },
  { value: 'CUSTOMER', label: 'Customers' },
  { value: 'PURCHASE', label: 'Purchases' },
  { value: 'SALES', label: 'Sales' },
  { value: 'INVOICE', label: 'Invoices' },
  { value: 'SYSTEM', label: 'System' },
];

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'LOGIN', label: 'LOGIN' },
  { value: 'REGISTER', label: 'REGISTER' },
  { value: 'CREATE', label: 'CREATE' },
  { value: 'UPDATE', label: 'UPDATE' },
  { value: 'DEACTIVATE', label: 'DEACTIVATE' },
  { value: 'STOCK_IN', label: 'STOCK_IN' },
  { value: 'STOCK_OUT', label: 'STOCK_OUT' },
  { value: 'STOCK_ADJUSTMENT', label: 'STOCK_ADJUSTMENT' },
  { value: 'STATUS_CHANGE', label: 'STATUS_CHANGE' },
  { value: 'RECEIVE', label: 'RECEIVE' },
];

export const AuditFilters: React.FC<AuditFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filter Audit Trail</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition px-2 py-1 rounded hover:bg-slate-100"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative">
          <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search description, entity..."
              value={filters.search || ''}
              onChange={(e) => onChange({ search: e.target.value, page: 1 })}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Module */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Module</label>
          <select
            value={filters.module || ''}
            onChange={(e) => onChange({ module: e.target.value, page: 1 })}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MODULE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Action</label>
          <select
            value={filters.action || ''}
            onChange={(e) => onChange({ action: e.target.value, page: 1 })}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
          <input
            type="date"
            value={filters.start_date || ''}
            onChange={(e) => onChange({ start_date: e.target.value, page: 1 })}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
          <input
            type="date"
            value={filters.end_date || ''}
            onChange={(e) => onChange({ end_date: e.target.value, page: 1 })}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
