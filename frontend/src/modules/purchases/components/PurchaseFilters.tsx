import React, { useState, useEffect } from 'react';
import { IPurchaseFilterState, PurchaseStatus } from '../types/purchase.types';
import { supplierService } from '../../suppliers/services/supplierService';
import { ISupplier } from '../../suppliers/types/supplier.types';
import { Search, Filter, RotateCcw, Calendar, Building2 } from 'lucide-react';

interface PurchaseFiltersProps {
  filters: IPurchaseFilterState;
  onChange: (updatedFilters: Partial<IPurchaseFilterState>) => void;
  onReset: () => void;
}

export const PurchaseFilters: React.FC<PurchaseFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await supplierService.getSuppliers({ limit: 100 });
        setSuppliers(res.items);
      } catch (err) {
        console.error('Failed to load suppliers for filters', err);
      }
    };
    fetchSuppliers();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by PO ID, Supplier name, notes..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            value={filters.status}
            onChange={(e) =>
              onChange({
                status: e.target.value as PurchaseStatus | 'ALL',
                page: 1,
              })
            }
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ORDERED">Ordered</option>
            <option value="PARTIALLY_RECEIVED">Partially Received</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Supplier Filter */}
        <div className="w-full md:w-56">
          <div className="relative">
            <select
              value={filters.supplier_id}
              onChange={(e) => onChange({ supplier_id: e.target.value, page: 1 })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.supplier_name} {s.company_name ? `(${s.company_name})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors"
          title="Reset filters"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>
      </div>

      {/* Date Filters Row */}
      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>From Date:</span>
          <input
            type="date"
            value={filters.from_date}
            onChange={(e) => onChange({ from_date: e.target.value, page: 1 })}
            className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span>To Date:</span>
          <input
            type="date"
            value={filters.to_date}
            onChange={(e) => onChange({ to_date: e.target.value, page: 1 })}
            className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {(filters.search ||
          filters.status !== 'ALL' ||
          filters.supplier_id ||
          filters.from_date ||
          filters.to_date) && (
          <span className="ml-auto text-primary-600 dark:text-primary-400 font-medium">
            Active filters applied
          </span>
        )}
      </div>
    </div>
  );
};
