import React, { useState, useEffect } from 'react';
import { IPurchaseOrderDetail, IReceivePurchaseDto } from '../types/purchase.types';
import { purchaseService } from '../services/purchaseService';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import {
  X,
  PackageCheck,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface PurchaseReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrderId: string | null;
  onSuccess: (message: string) => void;
}

export const PurchaseReceiveModal: React.FC<PurchaseReceiveModalProps> = ({
  isOpen,
  onClose,
  purchaseOrderId,
  onSuccess,
}) => {
  const [poDetail, setPoDetail] = useState<IPurchaseOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map of item_id -> receive_quantity
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !purchaseOrderId) {
      setPoDetail(null);
      setReceiveQuantities({});
      setNotes('');
      setError(null);
      return;
    }

    const fetchPO = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await purchaseService.getPurchaseById(purchaseOrderId);
        setPoDetail(data);

        // Pre-fill default receive quantities with remaining quantities
        const initialMap: Record<string, number> = {};
        data.items.forEach((item) => {
          const remaining = Math.max(0, item.quantity - item.received_quantity);
          initialMap[item.id] = remaining; // Default to full remaining
        });
        setReceiveQuantities(initialMap);
      } catch (err: any) {
        setError(err.message || 'Failed to load purchase order details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPO();
  }, [isOpen, purchaseOrderId]);

  if (!isOpen) return null;

  const handleQtyChange = (itemId: string, maxQty: number, val: number) => {
    const clamped = Math.max(0, Math.min(maxQty, Math.floor(val) || 0));
    setReceiveQuantities((prev) => ({
      ...prev,
      [itemId]: clamped,
    }));
  };

  const handleFillAllRemaining = () => {
    if (!poDetail) return;
    const filled: Record<string, number> = {};
    poDetail.items.forEach((item) => {
      filled[item.id] = Math.max(0, item.quantity - item.received_quantity);
    });
    setReceiveQuantities(filled);
  };

  const handleClearAll = () => {
    if (!poDetail) return;
    const cleared: Record<string, number> = {};
    poDetail.items.forEach((item) => {
      cleared[item.id] = 0;
    });
    setReceiveQuantities(cleared);
  };

  const totalUnitsReceiving = Object.values(receiveQuantities).reduce(
    (acc, q) => acc + (q || 0),
    0
  );

  const handleSubmit = async () => {
    if (!poDetail) return;

    if (totalUnitsReceiving <= 0) {
      setError('Please specify at least 1 unit to receive.');
      return;
    }

    // Filter only items with receive_quantity > 0
    const itemsToReceive = Object.entries(receiveQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => ({
        item_id: itemId,
        receive_quantity: qty,
      }));

    try {
      setIsSubmitting(true);
      setError(null);
      const dto: IReceivePurchaseDto = {
        items: itemsToReceive,
        notes: notes.trim() ? notes.trim() : undefined,
      };

      const result = await purchaseService.receivePurchase(poDetail.id, dto);
      onSuccess(
        `Successfully received ${result.received_count} unit(s) into inventory for PO #${poDetail.id}. Stock balances updated!`
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process receipt into inventory.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Receive Products into Inventory
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Order <span className="font-mono font-medium">{purchaseOrderId}</span> •
                Authoritative Stock IN with audit trail
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-500">
              <LoadingSpinner size="lg" className="text-emerald-600 mb-2" />
              <p className="text-xs">Loading order items...</p>
            </div>
          ) : poDetail ? (
            <>
              {/* Supplier & Order Quick Info */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Supplier</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {poDetail.supplier_name || 'N/A'}{' '}
                    {poDetail.supplier_company ? `(${poDetail.supplier_company})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Order Date</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {poDetail.order_date || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Current Status</span>
                  <span className="font-semibold text-primary-600 dark:text-primary-400">
                    {poDetail.status}
                  </span>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Inbound Delivery Items
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleFillAllRemaining}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Receive All Remaining
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-3.5 py-2.5">Product</th>
                        <th className="px-3 py-2.5 text-center">Ordered</th>
                        <th className="px-3 py-2.5 text-center">Received</th>
                        <th className="px-3 py-2.5 text-center">Remaining</th>
                        <th className="px-4 py-2.5 text-right w-36">Receive Now</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {poDetail.items.map((item) => {
                        const remaining = Math.max(0, item.quantity - item.received_quantity);
                        const isFullyReceived = remaining === 0;
                        const receiveVal = receiveQuantities[item.id] || 0;

                        return (
                          <tr
                            key={item.id}
                            className={
                              isFullyReceived
                                ? 'bg-slate-50/50 dark:bg-slate-800/30 opacity-60'
                                : 'hover:bg-slate-50/70 dark:hover:bg-slate-700/30'
                            }
                          >
                            <td className="px-3.5 py-3">
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {item.product_name || item.product_id}
                              </div>
                              {item.product_sku && (
                                <div className="text-[11px] font-mono text-slate-400">
                                  SKU: {item.product_sku}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center font-medium">{item.quantity}</td>
                            <td className="px-3 py-3 text-center text-emerald-600 font-medium">
                              {item.received_quantity}
                            </td>
                            <td className="px-3 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                              {remaining}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {isFullyReceived ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Complete
                                </span>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    max={remaining}
                                    value={receiveVal}
                                    onChange={(e) =>
                                      handleQtyChange(item.id, remaining, parseInt(e.target.value))
                                    }
                                    className="w-20 px-2 py-1 text-right text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-semibold focus:ring-1 focus:ring-emerald-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleQtyChange(item.id, remaining, remaining)}
                                    title="Fill max remaining"
                                    className="px-1.5 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                                  >
                                    All
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Receiving Notes / Delivery Reference */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Inbound Delivery Notes / Tracking Details
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Carrier invoice #TRK-8819, delivered intact at Bay 3..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Inventory Integration Notice */}
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                <PackageCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <p>
                  Confirming this receipt will automatically invoke the{' '}
                  <span className="font-semibold">Inventory Service</span>, updating physical stock
                  levels and recording an immutable audit transaction referencing{' '}
                  <span className="font-mono font-medium">PO #{poDetail.id}</span>.
                </p>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading || totalUnitsReceiving <= 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="text-white" />
                <span>Updating Inventory...</span>
              </>
            ) : (
              <>
                <PackageCheck className="w-4 h-4" />
                <span>Confirm Receipt ({totalUnitsReceiving} units)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
