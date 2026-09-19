import React from 'react';
import { ISupplier } from '../types/supplier.types';
import { SupplierStatusBadge } from './SupplierStatusBadge';
import { RoleGuard } from '../../authentication/components/RoleGuard';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import {
  Eye,
  Edit2,
  Power,
  ChevronLeft,
  ChevronRight,
  Building2,
  Mail,
  Phone,
  Package,
} from 'lucide-react';

interface SupplierTableProps {
  suppliers: ISupplier[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onView: (supplier: ISupplier) => void;
  onEdit: (supplier: ISupplier) => void;
  onToggleStatus: (supplier: ISupplier) => void;
}

export const SupplierTable: React.FC<SupplierTableProps> = ({
  suppliers,
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
            <p className="text-sm font-medium">Loading supplier records...</p>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No suppliers found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No supplier records match your search criteria. Try modifying your filters or register a new vendor.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Supplier & Company</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Email & Phone</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-center">Catalog Items</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {suppliers.map((sup) => (
                <tr
                  key={sup.id}
                  className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                  onClick={() => onView(sup)}
                >
                  {/* Supplier & Company */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {sup.supplier_name}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{sup.company_name}</span>
                    </div>
                  </td>

                  {/* Contact Person */}
                  <td className="py-3 px-4 text-slate-800 font-medium">
                    {sup.contact_person}
                  </td>

                  {/* Contact Information */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{sup.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{sup.phone}</span>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3 px-4 text-slate-600 text-xs">
                    <div>{sup.city}, {sup.state}</div>
                    <div className="text-slate-400">{sup.country}</div>
                  </td>

                  {/* Products Supplied Count */}
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      <Package className="w-3 h-3 text-slate-500" />
                      {sup.product_count || 0}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4 text-center">
                    <SupplierStatusBadge status={sup.status} size="sm" />
                  </td>

                  {/* Actions */}
                  <td
                    className="py-3 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onView(sup)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <RoleGuard roles={['ADMIN', 'PURCHASE_MANAGER']}>
                        <button
                          onClick={() => onEdit(sup)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit Supplier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onToggleStatus(sup)}
                          className={`p-1.5 rounded-lg transition ${
                            sup.status === 'ACTIVE'
                              ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={sup.status === 'ACTIVE' ? 'Deactivate Supplier' : 'Activate Supplier'}
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
      {!isLoading && total > 0 && (
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold">{Math.min((page - 1) * limit + 1, total)}</span> to{' '}
            <span className="font-semibold">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-semibold">{total}</span> suppliers
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
