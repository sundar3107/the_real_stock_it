import React from 'react';
import { ICustomer } from '../types/customer.types';
import { CustomerStatusBadge } from './CustomerStatusBadge';
import { RoleGuard } from '../../authentication/components/RoleGuard';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import {
  Eye,
  Edit2,
  Power,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react';

interface CustomerTableProps {
  customers: ICustomer[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onView: (customer: ICustomer) => void;
  onEdit: (customer: ICustomer) => void;
  onToggleStatus: (customer: ICustomer) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  isLoading,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onView,
  onEdit,
  onToggleStatus,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto min-h-[300px]">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <LoadingSpinner size="lg" className="text-blue-600 mb-3" />
            <p className="text-sm font-medium">Loading customer records...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No customers found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No customer records match your filter criteria. Try adjusting your search query or add a new customer.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Customer & Company</th>
                <th className="py-3 px-4">Email & Phone</th>
                <th className="py-3 px-4">City / State</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {customers.map((cust) => (
                <tr
                  key={cust.id}
                  className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                  onClick={() => onView(cust)}
                >
                  {/* Customer ID */}
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">
                    {cust.id.replace('cust_', '').substring(0, 8)}...
                  </td>

                  {/* Customer & Company */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {cust.customer_name}
                    </div>
                    {cust.company_name ? (
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{cust.company_name}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">Individual Client</div>
                    )}
                  </td>

                  {/* Email & Phone */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700">
                      <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span>{cust.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span>{cust.phone}</span>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3 px-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1 font-medium text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cust.city}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 pl-4">{cust.state}</div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 text-center">
                    <CustomerStatusBadge status={cust.status} size="sm" />
                  </td>

                  {/* Created Date */}
                  <td className="py-3 px-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{new Date(cust.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td
                    className="py-3 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {/* View Button */}
                      <button
                        type="button"
                        onClick={() => onView(cust)}
                        title="View Customer Profile"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit Button */}
                      <RoleGuard action="customer:manage">
                        <button
                          type="button"
                          onClick={() => onEdit(cust)}
                          title="Edit Customer"
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </RoleGuard>

                      {/* Activate / Deactivate Toggle Button */}
                      <RoleGuard action="customer:manage">
                        <button
                          type="button"
                          onClick={() => onToggleStatus(cust)}
                          title={
                            cust.status === 'ACTIVE'
                              ? 'Deactivate Customer (Soft delete)'
                              : 'Reactivate Customer'
                          }
                          className={`p-1.5 rounded-lg transition ${
                            cust.status === 'ACTIVE'
                              ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </RoleGuard>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!isLoading && customers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-800">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(page * limit, total)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{total}</span> customers
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="px-2 py-1 font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
