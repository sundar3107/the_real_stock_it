import React from 'react';
import { ICustomerFilterState, CustomerStatus } from '../types/customer.types';
import { Select } from '../../../components/common/Select';
import { Button } from '../../../components/common/Button';
import { Search, RotateCcw, Filter, MapPin } from 'lucide-react';

interface CustomerFiltersProps {
  filters: ICustomerFilterState;
  onFilterChange: (newFilters: Partial<ICustomerFilterState>) => void;
  onReset: () => void;
}

export const CustomerFilters: React.FC<CustomerFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active Customers' },
    { value: 'INACTIVE', label: 'Inactive Customers' },
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Date Added (Newest)' },
    { value: 'customer_name', label: 'Customer Name (A-Z)' },
    { value: 'company_name', label: 'Company Name (A-Z)' },
    { value: 'city', label: 'City (A-Z)' },
    { value: 'state', label: 'State (A-Z)' },
    { value: 'updated_at', label: 'Recently Updated' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Search & Filter Customers</span>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search input */}
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Name, company, email, phone, ID..."
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
            onChange={(e) => onFilterChange({ status: e.target.value as CustomerStatus | 'ALL', page: 1 })}
            options={statusOptions}
          />
        </div>

        {/* City filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
            City
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

        {/* State filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
            State
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by state (e.g. Maharashtra)..."
              value={filters.state}
              onChange={(e) => onFilterChange({ state: e.target.value, page: 1 })}
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
