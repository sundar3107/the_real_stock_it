import React, { useState, useEffect } from 'react';
import { IProduct } from '../../products/types/product.types';
import { ISupplierDetail } from '../types/supplier.types';
import { productService } from '../../products/services/productService';
import { supplierService } from '../services/supplierService';
import { X, Plus, PackageCheck, AlertCircle } from 'lucide-react';

interface AssociateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplier: ISupplierDetail | null;
}

export const AssociateProductModal: React.FC<AssociateProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  supplier,
}) => {
  const [availableProducts, setAvailableProducts] = useState<IProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && supplier) {
      setError(null);
      setSelectedProductId('');
      fetchAvailableProducts();
    }
  }, [isOpen, supplier]);

  const fetchAvailableProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.getProducts({ limit: 100 });
      // Exclude products already associated with this supplier
      const associatedIds = new Set(supplier?.products.map((p) => p.product_id) || []);
      const unassociated = res.items.filter((p) => !associatedIds.has(p.id));
      setAvailableProducts(unassociated);
      if (unassociated.length > 0) {
        setSelectedProductId(unassociated[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load catalog products');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !supplier) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setError('Please select a product to associate.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await supplierService.associateProducts(supplier.id, [selectedProductId]);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to associate product with supplier.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Associate Catalog Product</h3>
              <p className="text-xs text-slate-500">Link item to {supplier.supplier_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Product <span className="text-rose-500">*</span>
            </label>
            {loading ? (
              <div className="text-xs text-slate-400 py-2">Loading products...</div>
            ) : availableProducts.length === 0 ? (
              <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded-lg border border-slate-200">
                All catalog products are already associated with this vendor, or no active products exist.
              </div>
            ) : (
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — ?{p.purchase_price}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || availableProducts.length === 0 || !selectedProductId}
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <PackageCheck className="w-3.5 h-3.5 mr-1" />
              {submitting ? 'Linking...' : 'Link Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
