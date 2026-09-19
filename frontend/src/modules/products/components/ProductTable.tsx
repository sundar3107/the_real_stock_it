import React from 'react';
import { IProduct, StockStatus } from '../types/product.types';
import { RoleGuard } from '../../authentication/components/RoleGuard';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { Eye, Edit2, Trash2, AlertCircle, ChevronLeft, ChevronRight, PackageX } from 'lucide-react';

interface ProductTableProps {
  products: IProduct[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onView: (product: IProduct) => void;
  onEdit: (product: IProduct) => void;
  onDeactivate: (product: IProduct) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  isLoading,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onView,
  onEdit,
  onDeactivate,
}) => {
  const getStockBadge = (status?: StockStatus, stock = 0, unit = 'pcs') => {
    switch (status) {
      case 'OUT_OF_STOCK':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            0 {unit} (Out of Stock)
          </span>
        );
      case 'LOW_STOCK':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {stock} {unit} (Low Stock)
          </span>
        );
      case 'IN_STOCK':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {stock} {unit}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Table Content */}
      <div className="overflow-x-auto min-h-[300px]">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <LoadingSpinner size="lg" className="text-blue-600 mb-3" />
            <p className="text-sm font-medium">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <PackageX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-700">No products found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No product matched your search query or filters. Try adjusting filters or create a new product.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Product / SKU</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Selling Price</th>
                <th className="px-6 py-3.5">Current Stock</th>
                <th className="px-6 py-3.5">Reorder Level</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{product.name}</div>
                    <div className="font-mono text-xs text-slate-400">{product.sku}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200 font-medium">
                      {product.category_name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">
                      ₹{product.selling_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Cost: ₹{product.purchase_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStockBadge(product.stock_status, product.current_stock, product.unit)}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">
                    {product.reorder_level} {product.unit}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        product.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onView(product)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <RoleGuard action="product:update">
                        <button
                          type="button"
                          onClick={() => onEdit(product)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </RoleGuard>

                      <RoleGuard action="product:delete">
                        {product.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => onDeactivate(product)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Deactivate Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
        <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-slate-800">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-semibold text-slate-800">{total}</span> products
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="p-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="p-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
