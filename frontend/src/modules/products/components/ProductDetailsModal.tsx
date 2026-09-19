import React from 'react';
import { IProduct } from '../types/product.types';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Tag, Hash, DollarSign, Layers, Calendar, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: IProduct | null;
  onEdit?: (product: IProduct) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  isOpen,
  onClose,
  product,
  onEdit,
}) => {
  if (!product) return null;

  const profitMargin = product.selling_price - product.purchase_price;
  const marginPercentage = product.purchase_price > 0 ? ((profitMargin / product.purchase_price) * 100).toFixed(1) : '100';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Product Specification Details" maxWidth="xl">
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                {product.category_name || 'Uncategorized'}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  product.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                {product.status}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-2">{product.name}</h3>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mt-1">
              <span>SKU: {product.sku}</span>
              <span>&bull;</span>
              <span>ID: {product.id}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black text-slate-900">
              ₹{product.selling_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500">Unit: {product.unit}</div>
          </div>
        </div>

        {/* Detailed Spec Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {/* Inventory & Stock */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 font-semibold text-slate-800 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Inventory Baseline</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Current Stock:</span>
              <span className="font-bold text-slate-800">{product.current_stock} {product.unit}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Opening Stock:</span>
              <span className="text-slate-700">{product.opening_stock} {product.unit}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Reorder Alert Level:</span>
              <span className="text-slate-700">{product.reorder_level} {product.unit}</span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
              <span className="text-slate-500">Stock Condition:</span>
              <span className="font-semibold text-blue-700">{product.stock_status?.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Pricing & Margins */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 font-semibold text-slate-800 border-b border-slate-100 pb-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Financials & Margin</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Purchase Cost:</span>
              <span className="font-medium text-slate-700">₹{product.purchase_price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Selling Price:</span>
              <span className="font-bold text-slate-800">₹{product.selling_price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Gross Margin:</span>
              <span className={`font-semibold ${profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ₹{profitMargin.toFixed(2)} ({marginPercentage}%)
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <Info className="w-3.5 h-3.5" />
              <span>Description & Specifications</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>
        )}

        {/* Audit Timestamps */}
        <div className="flex justify-between text-xs text-slate-400 px-1">
          <span>Created: {new Date(product.created_at).toLocaleString()}</span>
          <span>Last Updated: {new Date(product.updated_at).toLocaleString()}</span>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onEdit && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onEdit(product);
              }}
            >
              Edit Product
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
