import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, AlertCircle, PackageCheck } from 'lucide-react';
import { IInventoryItem } from '../types/inventory.types';
import { inventoryService } from '../services/inventoryService';

interface StockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  inventoryItems: IInventoryItem[];
  preselectedProduct?: IInventoryItem | null;
}

export const StockInModal: React.FC<StockInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  inventoryItems,
  preselectedProduct,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setQuantity('');
      setReferenceNumber('');
      setNotes('');
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
  const calculatedNewStock = currentStock + qtyNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setError('Please select a product.');
      return;
    }
    if (!quantity || quantity <= 0) {
      setError('Please enter a valid stock receiving quantity greater than 0.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await inventoryService.stockIn({
        product_id: selectedProductId,
        quantity: Number(quantity),
        reference: referenceNumber.trim() || undefined,
        reason: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record stock in transaction.');
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
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Stock IN (Receive Items)</h3>
              <p className="text-xs text-gray-500">Record incoming stock into inventory</p>
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
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
            >
              {inventoryItems.map((item) => (
                <option key={item.product_id} value={item.product_id}>
                  {item.product_name} ({item.sku}) - Current: {item.current_quantity} {item.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Current vs Expected Calculation Card */}
          {currentItem && (
            <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-200 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-gray-500 block mb-1">Current Stock</span>
                <span className="text-sm font-bold text-gray-800">
                  {currentStock} {unit}
                </span>
              </div>
              <div className="border-x border-gray-200">
                <span className="text-gray-500 block mb-1">Receiving (+)</span>
                <span className="text-sm font-bold text-emerald-600">
                  +{qtyNumber} {unit}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">New Balance</span>
                <span className="text-sm font-bold text-indigo-600">
                  {calculatedNewStock} {unit}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Quantity to Receive <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="any"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 50"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Reference / Document Number
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. PO-2026-001 or GRN-884"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Notes / Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes regarding supplier shipment, batch details, etc."
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
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
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <PackageCheck className="w-4 h-4 mr-1.5" />
                  Confirm Stock IN
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
