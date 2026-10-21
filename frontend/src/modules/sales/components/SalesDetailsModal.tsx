import React, { useState, useEffect } from 'react';
import { ISalesOrderDetail, SalesStatus } from '../types/sales.types';
import { salesService } from '../services/salesService';
import { SalesStatusBadge } from './SalesStatusBadge';
import { RoleGuard } from '../../authentication/components/RoleGuard';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import {
  X,
  TrendingUp,
  User,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Package,
  DollarSign,
  Check,
  CheckCheck,
  Edit2,
  XCircle,
  Clock,
  Building2,
  PackageCheck,
} from 'lucide-react';

interface SalesDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesOrderId: string | null;
  onEdit: (order: ISalesOrderDetail) => void;
  onConfirmOrder: (orderId: string) => void;
  onCompleteOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
}

export const SalesDetailsModal: React.FC<SalesDetailsModalProps> = ({
  isOpen,
  onClose,
  salesOrderId,
  onEdit,
  onConfirmOrder,
  onCompleteOrder,
  onCancelOrder,
}) => {
  const [orderDetail, setOrderDetail] = useState<ISalesOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !salesOrderId) {
      setOrderDetail(null);
      setError(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await salesService.getSaleById(salesOrderId);
        setOrderDetail(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load sales order details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, salesOrderId]);

  if (!isOpen) return null;

  const canEdit = orderDetail?.status === 'DRAFT';
  const canConfirm = orderDetail?.status === 'DRAFT';
  const canComplete =
    orderDetail?.status === 'CONFIRMED' || orderDetail?.status === 'PROCESSING';
  const canCancel =
    orderDetail?.status === 'DRAFT' ||
    orderDetail?.status === 'CONFIRMED' ||
    orderDetail?.status === 'PROCESSING';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {orderDetail?.order_number || salesOrderId}
                </h2>
                {orderDetail && <SalesStatusBadge status={orderDetail.status} size="sm" />}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customer Sales Order & Inventory Fulfillment Details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <LoadingSpinner size="lg" className="text-primary-600 mb-2" />
              <p className="text-xs">Loading order details...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-xs">{error}</div>
          ) : orderDetail ? (
            <>
              {/* Top Grid: Customer & Order Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Information Card */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-primary-500" />
                    <span>Customer Information</span>
                  </h3>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {orderDetail.customer?.customer_name || orderDetail.customer_name || 'N/A'}
                    </div>
                    {(orderDetail.customer?.company_name || orderDetail.company_name) && (
                      <div className="text-xs text-slate-500">
                        {orderDetail.customer?.company_name || orderDetail.company_name}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                    {orderDetail.customer?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{orderDetail.customer.email}</span>
                      </div>
                    )}
                    {orderDetail.customer?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{orderDetail.customer.phone}</span>
                      </div>
                    )}
                    {orderDetail.customer?.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {orderDetail.customer.address}, {orderDetail.customer.city},{' '}
                          {orderDetail.customer.state}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Information Card */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary-500" />
                    <span>Order Metadata</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Order Date</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {orderDetail.order_date || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Status</span>
                      <span className="font-bold text-primary-600 dark:text-primary-400">
                        {orderDetail.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Created By</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {orderDetail.created_by_name || orderDetail.created_by}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Created At</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {orderDetail.created_at ? orderDetail.created_at.split('T')[0] : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Stock fulfillment indicator */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                    {orderDetail.status === 'COMPLETED' ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <PackageCheck className="w-4 h-4 shrink-0" />
                        <span>Inventory deducted & stock transaction recorded (Stock OUT).</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-500 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <Clock className="w-4 h-4 shrink-0 text-slate-400" />
                        <span>Inventory will be deducted when order is marked as Completed.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-primary-500" />
                  <span>Order Items ({orderDetail.items.length})</span>
                </h3>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5">Product</th>
                        <th className="px-3 py-2.5 text-center">Quantity</th>
                        <th className="px-3 py-2.5 text-right">Selling Price</th>
                        <th className="px-3 py-2.5 text-right">Tax</th>
                        <th className="px-3 py-2.5 text-right">Discount</th>
                        <th className="px-4 py-2.5 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {orderDetail.items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {item.product_name || item.product_id}
                            </div>
                            {item.product_sku && (
                              <div className="text-[11px] font-mono text-slate-400">
                                SKU: {item.product_sku}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-slate-800 dark:text-slate-200">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-600 dark:text-slate-300">
                            ${Number(item.unit_price).toFixed(2)}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-500">
                            ${Number(item.tax || 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-500">
                            ${Number(item.discount || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                            ${Number(item.line_total).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary & Notes Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Notes */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Order Notes & Instructions
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {orderDetail.notes || 'No special notes recorded for this sales order.'}
                  </p>
                </div>

                {/* Financial Summary */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      ${Number(orderDetail.subtotal).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Tax:</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      +${Number(orderDetail.tax).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Discount:</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      -${Number(orderDetail.discount).toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-bold text-slate-900 dark:text-slate-100">
                    <span>Grand Total:</span>
                    <span className="text-primary-600 dark:text-primary-400 text-base">
                      ${Number(orderDetail.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>

          {orderDetail && (
            <div className="flex items-center gap-2">
              {/* Cancel Button */}
              {canCancel && (
                <RoleGuard roles={['ADMIN', 'SALES_MANAGER']}>
                  <button
                    type="button"
                    onClick={() => {
                      onCancelOrder(orderDetail.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-xs font-medium transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Order</span>
                  </button>
                </RoleGuard>
              )}

              {/* Edit Button (Draft only) */}
              {canEdit && (
                <RoleGuard roles={['ADMIN', 'SALES_MANAGER']}>
                  <button
                    type="button"
                    onClick={() => {
                      onEdit(orderDetail);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-800 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs font-medium transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Order</span>
                  </button>
                </RoleGuard>
              )}

              {/* Confirm Order Button (Draft only) */}
              {canConfirm && (
                <RoleGuard roles={['ADMIN', 'SALES_MANAGER']}>
                  <button
                    type="button"
                    onClick={() => {
                      onConfirmOrder(orderDetail.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Order</span>
                  </button>
                </RoleGuard>
              )}

              {/* Complete Sale Button (Fulfill & Deduct Stock) */}
              {canComplete && (
                <RoleGuard roles={['ADMIN', 'SALES_MANAGER']}>
                  <button
                    type="button"
                    onClick={() => {
                      onCompleteOrder(orderDetail.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Complete Sale (Deduct Stock)</span>
                  </button>
                </RoleGuard>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
