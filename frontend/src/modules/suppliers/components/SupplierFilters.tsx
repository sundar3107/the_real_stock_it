import React from 'react';
import { ISupplierFilterState, SupplierStatus } from '../types/supplier.types';
import { Select } from '../../../components/common/Select';
import { Button } from '../../../components/common/Button';
import { Search, RotateCcw, Filter, MapPin } from 'lucide-react';

interface SupplierFiltersProps {
  filters: ISupplierFilterState;
  onFilterChange: (newFilters: Partial<ISupplierFilterState>) => void;
  onReset: () => void;
}

export const SupplierFilters: React.FC<SupplierFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active Suppliers' },
    { value: 'INACTIVE', label: 'Inactive Suppliers' },
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Date Added (Newest)' },
    { value: 'supplier_name', label: 'Supplier Name (A-Z)' },
    { value: 'company_name', label: 'Company Name (A-Z)' },
    { value: 'city', label: 'City' },
    { value: 'updated_at', label: 'Recently Updated' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Search & Filter Suppliers</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search input */}
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Name, company, email, phone, contact..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50 hover:bg-white transition"
            />
          </div>
        </div>

        {/* Status filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
            Status
          </label>
          <Select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value as SupplierStatus | 'ALL', page: 1 })}
            options={statusOptions}
          />
        </div>

        {/* City filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
            City Location
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by city (e.g. Mumbai)..."
              value={filters.city}
              onChange={(e) => onFilterChange({ city: e.target.value, page: 1 })}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50 hover:bg-white transition"
            />
          </div>
        </div>

        {/* Sort option */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
            Sort Order
          </label>
          <Select
            value={filters.sort_by}
            onChange={(e) => onFilterChange({ sort_by: e.target.value as any, page: 1 })}
            options={sortOptions}
          />
        </div>
      </div>
    </div>
  );
};
