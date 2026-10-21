import React, { useState, useEffect } from 'react';
import { IPurchaseOrderDetail, PurchaseStatus } from '../types/purchase.types';
import { purchaseService } from '../services/purchaseService';
import { PurchaseStatusBadge } from './PurchaseStatusBadge';
import { RoleGuard } from '../../authentication/components/RoleGuard';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import {
  X,
  FileText,
  Building2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Package,
  DollarSign,
  PackageCheck,
  Send,
  Edit2,
  XCircle,
  Clock,
  User,
} from 'lucide-react';

interface PurchaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrderId: string | null;
  onEdit: (po: IPurchaseOrderDetail) => void;
  onReceive: (poId: string) => void;
  onSubmitOrder: (poId: string) => void;
  onCancelOrder: (poId: string) => void;
}

export const PurchaseDetailsModal: React.FC<PurchaseDetailsModalProps> = ({
  isOpen,
  onClose,
  purchaseOrderId,
  onEdit,
  onReceive,
  onSubmitOrder,
  onCancelOrder,
}) => {
  const [poDetail, setPoDetail] = useState<IPurchaseOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !purchaseOrderId) {
      setPoDetail(null);
      setError(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await purchaseService.getPurchaseById(purchaseOrderId);
        setPoDetail(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load purchase order details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, purchaseOrderId]);

  if (!isOpen) return null;

  const totalOrderedQty = poDetail?.items.reduce((acc, i) => acc + i.quantity, 0) || 0;
  const totalReceivedQty =
    poDetail?.items.reduce((acc, i) => acc + i.received_quantity, 0) || 0;
  const overallProgress =
    totalOrderedQty > 0 ? Math.round((totalReceivedQty / totalOrderedQty) * 100) : 0;

  const canEdit = poDetail?.status === 'DRAFT';
  const canSubmit = poDetail?.status === 'DRAFT';
  const canReceive =
    poDetail?.status === 'ORDERED' || poDetail?.status === 'PARTIALLY_RECEIVED';
  const canCancel =
    (poDetail?.status === 'DRAFT' || poDetail?.status === 'ORDERED') &&
    totalReceivedQty === 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {purchaseOrderId}
                </h2>
                {poDetail && <PurchaseStatusBadge status={poDetail.status} size="sm" />}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Purchase Order Details & Receipt Status
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
          ) : poDetail ? (
            <>
              {/* Top Grid: Supplier & Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supplier Information Card */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-primary-500" />
                    <span>Supplier Information</span>
                  </h3>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {poDetail.supplier?.supplier_name || poDetail.supplier_name || 'N/A'}
                    </div>
                    {(poDetail.supplier?.company_name || poDetail.supplier_company) && (
                      <div className="text-xs text-slate-500">
                        {poDetail.supplier?.company_name || poDetail.supplier_company}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                    {poDetail.supplier?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{poDetail.supplier.email}</span>
                      </div>
                    )}
                    {poDetail.supplier?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{poDetail.supplier.phone}</span>
                      </div>
                    )}
                    {poDetail.supplier?.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {poDetail.supplier.address}, {poDetail.supplier.city},{' '}
                          {poDetail.supplier.state}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Information Card */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary-500" />
                    <span>Order Details</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Order Date</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {poDetail.order_date || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Expected Delivery</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {poDetail.expected_delivery_date || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Created By</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {poDetail.created_by_name || poDetail.created_by}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Created On</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {poDetail.created_at ? poDetail.created_at.split('T')[0] : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-500">Inbound Delivery Progress:</span>
                      <span className="font-semibold text-emerald-600">
                        {totalReceivedQty} / {totalOrderedQty} units ({overallProgress}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, overallProgress)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-primary-500" />
                  <span>Purchased Items ({poDetail.items.length})</span>
                </h3>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5">Product</th>
                        <th className="px-3 py-2.5 text-center">Ordered</th>
                        <th className="px-3 py-2.5 text-center">Received</th>
                        <th className="px-3 py-2.5 text-center">Remaining</th>
                        <th className="px-3 py-2.5 text-right">Unit Price</th>
                        <th className="px-3 py-2.5 text-right">Tax</th>
                        <th className="px-3 py-2.5 text-right">Discount</th>
                        <th className="px-4 py-2.5 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {poDetail.items.map((item) => {
                        const remaining = Math.max(0, item.quantity - item.received_quantity);
                        return (
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
                            <td className="px-3 py-3 text-center font-medium">{item.quantity}</td>
                            <td className="px-3 py-3 text-center text-emerald-600 font-semibold">
                              {item.received_quantity}
                            </td>
                            <td className="px-3 py-3 text-center font-medium text-slate-700 dark:text-slate-300">
                              {remaining}
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
                        );
                      })}
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
                    {poDetail.notes || 'No special notes recorded for this purchase order.'}
                  </p>
                </div>

                {/* Financial Summary */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      ${Number(poDetail.subtotal).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Tax:</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      +${Number(poDetail.tax).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Discount:</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      -${Number(poDetail.discount).toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-bold text-slate-900 dark:text-slate-100">
                    <span>Total Purchase Value:</span>
                    <span className="text-primary-600 dark:text-primary-400 text-base">
                      ${Number(poDetail.total).toFixed(2)}
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

          {poDetail && (
            <div className="flex items-center gap-2">
              {/* Cancel Button */}
              {canCancel && (
                <RoleGuard roles={['ADMIN', 'PURCHASE_MANAGER']}>
                  <button
                    type="button"
                    onClick={() => {
                      onCancelOrder(poDetail.id);
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
                <RoleGuard roles={['ADMIN', 'PURCHASE_MANAGER']}>
                  <button
                    type="button"
                    onClick={() => {
                      onEdit(poDetail);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-800 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs font-medium transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Order</span>
                  </button>
                </RoleGuard>
              )}

              {/* Submit Order Button (Draft only) */}
              {canSubmit && (
                <RoleGuard roles={['ADMIN', 'PURCHASE_MANAGER']}>
                  <button
                    type="button"
                    onClick={() => {
                      onSubmitOrder(poDetail.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit / Order PO</span>
                  </button>
                </RoleGuard>
              )}

              {/* Receive Products Button */}
              {canReceive && (
                <RoleGuard roles={['ADMIN', 'PURCHASE_MANAGER', 'INVENTORY_MANAGER']}>
                  <button
                    type="button"
                    onClick={() => {
                      onReceive(poDetail.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Receive Products</span>
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
