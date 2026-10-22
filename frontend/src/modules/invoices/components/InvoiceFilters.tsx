import React, { useState, useEffect } from 'react';
import { IInvoiceFilterState, InvoiceStatus } from '../types/invoice.types';
import { customerService } from '../../customers/services/customerService';
import { ICustomer } from '../../customers/types/customer.types';
import { Search, RotateCcw, Calendar, Users, Filter } from 'lucide-react';

interface InvoiceFiltersProps {
  filters: IInvoiceFilterState;
  onChange: (updatedFilters: Partial<IInvoiceFilterState>) => void;
  onReset: () => void;
}

export const InvoiceFilters: React.FC<InvoiceFiltersProps> = ({
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
        console.error('Failed to load customers for invoice filters', err);
      }
    };
    fetchCustomers();
  }, []);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Invoice #, Customer, Sales Order #, or notes..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Customer Filter */}
        <div className="relative w-full md:w-56">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <select
            value={filters.customer_id}
            onChange={(e) => onChange({ customer_id: e.target.value, page: 1 })}
            className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
          >
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.customer_name} {c.company_name ? `(${c.company_name})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative w-full md:w-44">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <select
            value={filters.status}
            onChange={(e) =>
              onChange({ status: e.target.value as InvoiceStatus | 'ALL', page: 1 })
            }
            className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ISSUED">Issued</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Date Range & Reset Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 text-sm">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">Invoice Dates:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.from_date}
              onChange={(e) => onChange({ from_date: e.target.value, page: 1 })}
              className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={filters.to_date}
              onChange={(e) => onChange({ to_date: e.target.value, page: 1 })}
              className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  );
};
