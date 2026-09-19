import React from 'react';
import { ICategory, IProductFilterState } from '../types/product.types';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Button } from '../../../components/common/Button';
import { Search, RotateCcw, Filter } from 'lucide-react';

interface ProductFiltersProps {
  filters: IProductFilterState;
  categories: ICategory[];
  onFilterChange: (newFilters: Partial<IProductFilterState>) => void;
  onReset: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  categories,
  onFilterChange,
  onReset,
}) => {
  const categoryOptions = [
    { value: 'ALL', label: 'All Categories' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active Only' },
    { value: 'INACTIVE', label: 'Inactive Only' },
  ];

  const stockStatusOptions = [
    { value: 'ALL', label: 'All Stock Levels' },
    { value: 'IN_STOCK', label: 'In Stock (> Reorder Level)' },
    { value: 'LOW_STOCK', label: 'Low Stock (<= Reorder Level)' },
    { value: 'OUT_OF_STOCK', label: 'Out of Stock (0 units)' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Search & Filter Catalog</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          className="text-xs text-slate-600 hover:text-slate-900"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Reset Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search by Name, SKU, ID */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Search Products</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Name, SKU, ID..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <Select
            label="Category"
            options={categoryOptions}
            value={filters.category_id}
            onChange={(e) => onFilterChange({ category_id: e.target.value, page: 1 })}
          />
        </div>

        {/* Stock Status Filter */}
        <div>
          <Select
            label="Stock Level"
            options={stockStatusOptions}
            value={filters.stock_status}
            onChange={(e) => onFilterChange({ stock_status: e.target.value as any, page: 1 })}
          />
        </div>

        {/* Active/Inactive Status */}
        <div>
          <Select
            label="Catalog Status"
            options={statusOptions}
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value as any, page: 1 })}
          />
        </div>
      </div>
    </div>
  );
};
