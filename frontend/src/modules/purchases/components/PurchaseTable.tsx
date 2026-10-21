import React from 'react';
import { IPurchaseOrder } from '../types/purchase.types';
import { PurchaseStatusBadge } from './PurchaseStatusBadge';
import { RoleGuard } from '../../authentication/components/RoleGuard';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import {
  Eye,
  Edit2,
  PackageCheck,
  Send,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Building2,
  Calendar,
  DollarSign,
  User,
} from 'lucide-react';

interface PurchaseTableProps {
  purchases: IPurchaseOrder[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onView: (po: IPurchaseOrder) => void;
  onEdit: (po: IPurchaseOrder) => void;
  onReceive: (po: IPurchaseOrder) => void;
  onSubmitOrder: (po: IPurchaseOrder) => void;
  onCancelOrder: (po: IPurchaseOrder) => void;
}

export const PurchaseTable: React.FC<PurchaseTableProps> = ({
  purchases,
  isLoading,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onView,
  onEdit,
  onReceive,
  onSubmitOrder,
  onCancelOrder,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto min-h-[300px]">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <LoadingSpinner size="lg" className="text-primary-600 mb-3" />
            <p className="text-sm font-medium">Loading purchase orders...</p>
          </div>
        ) : purchases.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              No purchase orders found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              No orders match your filter criteria. Try adjusting your search query or create a new purchase order.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-5 py-3">PO ID</th>
                <th scope="col" className="px-5 py-3">Supplier</th>
                <th scope="col" className="px-5 py-3">Order Date</th>
                <th scope="col" className="px-5 py-3">Expected Date</th>
                <th scope="col" className="px-5 py-3">Total Amount</th>
                <th scope="col" className="px-5 py-3">Status</th>
                <th scope="col" className="px-5 py-3">Created By</th>
                <th scope="col" className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
              {purchases.map((po) => {
                const canReceive =
                  po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED';
                const canEdit = po.status === 'DRAFT';
                const canSubmit = po.status === 'DRAFT';
                const canCancel =
                  po.status === 'DRAFT' || po.status === 'ORDERED';

                return (
                  <tr
                    key={po.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    {/* PO ID */}
                    <td className="px-5 py-3.5 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                      <button
                        onClick={() => onView(po)}
                        className="text-primary-600 dark:text-primary-400 hover:underline font-mono text-xs"
                      >
                        {po.id}
                      </button>
                    </td>

                    {/* Supplier */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100 text-xs">
                            {po.supplier_name || 'Unknown Supplier'}
                          </div>
                          {po.supplier_company && (
                            <div className="text-[11px] text-slate-400">
                              {po.supplier_company}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Order Date */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{po.order_date || '—'}</span>
                      </div>
                    </td>

                    {/* Expected Date */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                      <span>{po.expected_delivery_date || '—'}</span>
                    </td>

                    {/* Total Amount */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                        ${Number(po.total).toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {po.item_count !== undefined ? `${po.item_count} items` : ''}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <PurchaseStatusBadge status={po.status} />
                    </td>

                    {/* Created By */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{po.created_by_name || po.created_by}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details */}
                        <button
                          onClick={() => onView(po)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit (Draft only) */}
                        {canEdit && (
                          <RoleGuard roles={['ADMIN', 'PURCHASE_MANAGER']}>
                            <button
                              onClick={() => onEdit(po)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="Edit Purchase Order"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </RoleGuard>
                        )}

                        {/* Submit / Order (Draft only) */}
                        {canSubmit && (
                          <RoleGuard roles={['ADMIN', 'PURCHASE_MANAGER']}>
                            <button
                              onClick={() => onSubmitOrder(po)}
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                              title="Submit / Order Purchase"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </RoleGuard>
                        )}

                        {/* Receive Products (Ordered or Partially Received) */}
                        {canReceive && (
                          <RoleGuard roles={['ADMIN', 'PURCHASE_MANAGER', 'INVENTORY_MANAGER']}>
                            <button
                              onClick={() => onReceive(po)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                              title="Receive Products into Inventory"
                            >
                              <PackageCheck className="w-4 h-4" />
                            </button>
                          </RoleGuard>
                        )}

                        {/* Cancel Order */}
                        {canCancel && (
                          <RoleGuard roles={['ADMIN', 'PURCHASE_MANAGER']}>
                            <button
                              onClick={() => onCancelOrder(po)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                              title="Cancel Purchase Order"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </RoleGuard>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!isLoading && purchases.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {Math.min(page * limit, total)}
            </span>{' '}
            of <span className="font-semibold text-slate-700 dark:text-slate-200">{total}</span> purchase orders
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-700 dark:text-slate-200">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
