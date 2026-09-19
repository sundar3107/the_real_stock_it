import React from 'react';
import { ITransactionFilterState, TransactionType } from '../types/inventory.types';
import { Select } from '../../../components/common/Select';
import { Button } from '../../../components/common/Button';
import { RotateCcw, Filter, Calendar } from 'lucide-react';

interface StockHistoryFiltersProps {
  filters: ITransactionFilterState;
  onFilterChange: (newFilters: Partial<ITransactionFilterState>) => void;
  onReset: () => void;
}

export const StockHistoryFilters: React.FC<StockHistoryFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const typeOptions = [
    { value: 'ALL', label: 'All Movement Types' },
    { value: 'STOCK_IN', label: 'Stock IN (Receipts)' },
    { value: 'STOCK_OUT', label: 'Stock OUT (Issues)' },
    { value: 'ADJUSTMENT', label: 'Adjustments (Reconciliation)' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filter Transaction Audit Trail</span>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Transaction Type */}
        <div>
          <Select
            label="Transaction Type"
            options={typeOptions}
            value={filters.transaction_type}
            onChange={(e) => onFilterChange({ transaction_type: e.target.value as any, page: 1 })}
          />
        </div>

        {/* Date From */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Date From</label>
          <div className="relative">
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => onFilterChange({ date_from: e.target.value, page: 1 })}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-700"
            />
          </div>
        </div>

        {/* Date To */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Date To</label>
          <div className="relative">
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => onFilterChange({ date_to: e.target.value, page: 1 })}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
