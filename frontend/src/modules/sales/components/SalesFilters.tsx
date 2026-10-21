import React, { useState, useEffect } from 'react';
import { ISalesFilterState, SalesStatus } from '../types/sales.types';
import { customerService } from '../../customers/services/customerService';
import { ICustomer } from '../../customers/types/customer.types';
import { Search, RotateCcw, Calendar, Users } from 'lucide-react';

interface SalesFiltersProps {
  filters: ISalesFilterState;
  onChange: (updatedFilters: Partial<ISalesFilterState>) => void;
  onReset: () => void;
}

export const SalesFilters: React.FC<SalesFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const [customers, setCustomers] = useState<ICustomer[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await customerService.getCustomers({ limit: 100 });
        setCustomers(res.items);
      } catch (err) {
        console.error('Failed to load customers for sales filters', err);
      }
    };
    fetchCustomers();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by SO #, Customer name, notes..."
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
                status: e.target.value as SalesStatus | 'ALL',
                page: 1,
              })
            }
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Customer Filter */}
        <div className="w-full md:w-56">
          <select
            value={filters.customer_id}
            onChange={(e) => onChange({ customer_id: e.target.value, page: 1 })}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.customer_name} {c.company_name ? `(${c.company_name})` : ''}
              </option>
            ))}
          </select>
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
          filters.customer_id ||
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
