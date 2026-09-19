import React, { useState, useEffect } from 'react';
import { X, RefreshCw, AlertCircle, Wrench, ShieldAlert } from 'lucide-react';
import { IInventoryItem, AdjustmentType } from '../types/inventory.types';
import { inventoryService } from '../services/inventoryService';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  inventoryItems: IInventoryItem[];
  preselectedProduct?: IInventoryItem | null;
}

const COMMON_REASONS = [
  'Physical Count Reconciliation / Audit Discrepancy',
  'Damaged / Defective Stock Written Off',
  'Expired / Shelf-life Expired Inventory',
  'Data Entry Correction / Past Error Fix',
  'Theft / Unaccounted Stock Loss',
  'Internal Samples / Testing Consumption',
  'Supplier Return / Replacement',
  'Other Reason',
];

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  inventoryItems,
  preselectedProduct,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('INCREASE');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reasonCategory, setReasonCategory] = useState<string>(COMMON_REASONS[0]);
  const [detailedReason, setDetailedReason] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setQuantity('');
      setAdjustmentType('INCREASE');
      setReasonCategory(COMMON_REASONS[0]);
      setDetailedReason('');
      setReferenceNumber('');
      if (preselectedProduct) {
        setSelectedProductId(preselectedProduct.product_id);
      } else if (inventoryItems.length > 0) {
        setSelectedProductId(inventoryItems[0].product_id);
      } else {
        setSelectedProductId('');
      }
    }
  }, [isOpen, preselectedProduct, inventoryItems]);

  if (!isOpen) return null;

  const currentItem = inventoryItems.find((item) => item.product_id === selectedProductId);
  const currentStock = currentItem ? currentItem.current_quantity : 0;
  const unit = currentItem?.unit || 'pcs';
  const qtyNumber = typeof quantity === 'number' ? quantity : 0;

  let calculatedNewStock = currentStock;
  let isInvalid = false;

  if (adjustmentType === 'INCREASE') {
    calculatedNewStock = currentStock + qtyNumber;
  } else if (adjustmentType === 'DECREASE') {
    calculatedNewStock = currentStock - qtyNumber;
    if (calculatedNewStock < 0) {
      isInvalid = true;
    }
  } else if (adjustmentType === 'SET_QUANTITY') {
    calculatedNewStock = qtyNumber;
    if (calculatedNewStock < 0) {
      isInvalid = true;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setError('Please select a product.');
      return;
    }
    if (quantity === '' || (adjustmentType !== 'SET_QUANTITY' && quantity <= 0) || (adjustmentType === 'SET_QUANTITY' && quantity < 0)) {
      setError('Please enter a valid adjustment quantity.');
      return;
    }
    if (isInvalid) {
      setError('Adjustment would result in negative stock balance.');
      return;
    }

    const fullReason = detailedReason.trim()
      ? `${reasonCategory}: ${detailedReason.trim()}`
      : reasonCategory;

    if (!fullReason.trim()) {
      setError('Adjustment reason is strictly mandatory for auditing.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await inventoryService.adjustStock({
        product_id: selectedProductId,
        adjustment_type: adjustmentType,
        quantity: Number(quantity),
        reason: fullReason,
        reference: referenceNumber.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record stock adjustment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 transform transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Manual Stock Adjustment</h3>
              <p className="text-xs text-gray-500">Correct inventory counts with mandatory audit reason</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Select Product <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              disabled={!!preselectedProduct || loading}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
            >
              {inventoryItems.map((item) => (
                <option key={item.product_id} value={item.product_id}>
                  {item.product_name} ({item.sku}) - Current: {item.current_quantity} {item.unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Adjustment Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('INCREASE')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  adjustmentType === 'INCREASE'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                + Increase Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('DECREASE')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  adjustmentType === 'DECREASE'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                - Decrease Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('SET_QUANTITY')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  adjustmentType === 'SET_QUANTITY'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                = Set Exact Count
              </button>
            </div>
          </div>

          {/* Current vs Expected Calculation Card */}
          {currentItem && (
            <div className={`rounded-lg p-3.5 border grid grid-cols-3 gap-2 text-center text-xs ${
              isInvalid ? 'bg-rose-50 border-rose-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div>
                <span className="text-gray-500 block mb-1">Current Stock</span>
                <span className="text-sm font-bold text-gray-800">
                  {currentStock} {unit}
                </span>
              </div>
              <div className="border-x border-gray-200">
                <span className="text-gray-500 block mb-1">
                  {adjustmentType === 'INCREASE' && 'Delta (+)'}
                  {adjustmentType === 'DECREASE' && 'Delta (-)'}
                  {adjustmentType === 'SET_QUANTITY' && 'Target'}
                </span>
                <span className="text-sm font-bold text-amber-600">
                  {adjustmentType === 'INCREASE' && `+${qtyNumber}`}
                  {adjustmentType === 'DECREASE' && `-${qtyNumber}`}
                  {adjustmentType === 'SET_QUANTITY' && `=${qtyNumber}`} {unit}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Resulting Stock</span>
                <span className={`text-sm font-bold ${isInvalid ? 'text-rose-600' : 'text-indigo-600'}`}>
                  {calculatedNewStock} {unit}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              {adjustmentType === 'SET_QUANTITY' ? 'New Exact Stock Level' : 'Adjustment Quantity'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={adjustmentType === 'SET_QUANTITY' ? '0' : '1'}
              step="any"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={adjustmentType === 'SET_QUANTITY' ? 'e.g. 100' : 'e.g. 5'}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Primary Reason Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {COMMON_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Audit Justification / Specific Remarks <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={detailedReason}
              onChange={(e) => setDetailedReason(e.target.value)}
              placeholder="State clear operational reason for audit trail (e.g. Physical recount showed 12 units damaged by water leak)"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Reference / Inspection Doc #
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. AUDIT-2026-Q3 or INSP-490"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start space-x-2 text-amber-800 text-xs">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Stock adjustments create permanent, immutable ledger records attributed to your user account for SCM compliance.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isInvalid || !detailedReason.trim()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span>Recording...</span>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  Save Stock Adjustment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
