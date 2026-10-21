import React from 'react';
import { ISalesOrder } from '../types/sales.types';
import { SalesStatusBadge } from './SalesStatusBadge';
import { RoleGuard } from '../../authentication/components/RoleGuard';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import {
  Eye,
  Edit2,
  Check,
  CheckCheck,
  XCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  User,
  Calendar,
  Building2,
} from 'lucide-react';

interface SalesTableProps {
  sales: ISalesOrder[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onView: (order: ISalesOrder) => void;
  onEdit: (order: ISalesOrder) => void;
  onConfirmOrder: (order: ISalesOrder) => void;
  onCompleteOrder: (order: ISalesOrder) => void;
  onCancelOrder: (order: ISalesOrder) => void;
}

export const SalesTable: React.FC<SalesTableProps> = ({
  sales,
  isLoading,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onView,
  onEdit,
  onConfirmOrder,
  onCompleteOrder,
  onCancelOrder,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto min-h-[300px]">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <LoadingSpinner size="lg" className="text-primary-600 mb-3" />
            <p className="text-sm font-medium">Loading sales orders...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              No sales orders found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              No orders match your filter criteria. Try adjusting your search query or create a new sales order.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-5 py-3">Order #</th>
                <th scope="col" className="px-5 py-3">Customer</th>
                <th scope="col" className="px-5 py-3">Date</th>
                <th scope="col" className="px-5 py-3">Total Amount</th>
                <th scope="col" className="px-5 py-3">Status</th>
                <th scope="col" className="px-5 py-3">Created By</th>
                <th scope="col" className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
              {sales.map((order) => {
                const canEdit = order.status === 'DRAFT';
                const canConfirm = order.status === 'DRAFT';
                const canComplete =
                  order.status === 'CONFIRMED' || order.status === 'PROCESSING';
                const canCancel =
                  order.status === 'DRAFT' ||
                  order.status === 'CONFIRMED' ||
                  order.status === 'PROCESSING';

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    {/* Order # */}
                    <td className="px-5 py-3.5 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                      <button
                        onClick={() => onView(order)}
                        className="text-primary-600 dark:text-primary-400 hover:underline font-mono text-xs font-bold"
                      >
                        {order.order_number}
                      </button>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100 text-xs">
                            {order.customer_name || 'Customer'}
                          </div>
                          {order.company_name && (
                            <div className="text-[11px] text-slate-400">
                              {order.company_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Order Date */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.order_date || '—'}</span>
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                        ${Number(order.total).toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {order.item_count !== undefined ? `${order.item_count} items` : ''}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <SalesStatusBadge status={order.status} />
                    </td>

                    {/* Created By */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      <span>{order.created_by_name || order.created_by}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details */}
                        <button
                          onClick={() => onView(order)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit (Draft only) */}
                        {canEdit && (
                          <RoleGuard roles={['ADMIN', 'SALES_MANAGER']}>
                            <button
                              onClick={() => onEdit(order)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="Edit Sales Order"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </RoleGuard>
                        )}

                        {/* Confirm Order (Draft only) */}
                        {canConfirm && (
                          <RoleGuard roles={['ADMIN', 'SALES_MANAGER']}>
                            <button
                              onClick={() => onConfirmOrder(order)}
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                              title="Confirm Sales Order"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </RoleGuard>
                        )}

                        {/* Complete Sale & Stock Out */}
                        {canComplete && (
                          <RoleGuard roles={['ADMIN', 'SALES_MANAGER']}>
                            <button
                              onClick={() => onCompleteOrder(order)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                              title="Complete Sale & Deduct Inventory"
                            >
                              <CheckCheck className="w-4 h-4" />
                            </button>
                          </RoleGuard>
                        )}

                        {/* Cancel Order */}
                        {canCancel && (
                          <RoleGuard roles={['ADMIN', 'SALES_MANAGER']}>
                            <button
                              onClick={() => onCancelOrder(order)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                              title="Cancel Sales Order"
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
      {!isLoading && sales.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {Math.min(page * limit, total)}
            </span>{' '}
            of <span className="font-semibold text-slate-700 dark:text-slate-200">{total}</span> sales orders
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
