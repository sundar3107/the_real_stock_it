import React from 'react';
import { IInventoryItem } from '../types/inventory.types';
import { StockStatusBadge } from './StockStatusBadge';
import { RoleGuard } from '../../authentication/components/RoleGuard';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { PlusCircle, MinusCircle, SlidersHorizontal, ChevronLeft, ChevronRight, PackageX } from 'lucide-react';

interface InventoryOverviewTableProps {
  items: IInventoryItem[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onStockIn: (item: IInventoryItem) => void;
  onStockOut: (item: IInventoryItem) => void;
  onAdjust: (item: IInventoryItem) => void;
}

export const InventoryOverviewTable: React.FC<InventoryOverviewTableProps> = ({
  items,
  isLoading,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onStockIn,
  onStockOut,
  onAdjust,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto min-h-[300px]">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <LoadingSpinner size="lg" className="text-blue-600 mb-3" />
            <p className="text-sm font-medium">Loading inventory balances...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <PackageX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-700">No inventory records found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No products matched your filters. Check your search query or add products to the catalog.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Product / SKU</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Available Stock</th>
                <th className="px-6 py-3.5">Reorder Level</th>
                <th className="px-6 py-3.5">Stock Condition</th>
                <th className="px-6 py-3.5">Last Movement</th>
                <th className="px-6 py-3.5 text-right">Stock Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{item.product_name}</div>
                    <div className="font-mono text-xs text-slate-400">{item.sku}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200 font-medium">
                      {item.category_name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-base font-bold text-slate-900">
                      {item.current_quantity}{' '}
                      <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">
                    {item.reorder_level} {item.unit}
                  </td>
                  <td className="px-6 py-4">
                    <StockStatusBadge
                      status={item.stock_status}
                      quantity={item.current_quantity}
                      unit={item.unit}
                      showQuantity={false}
                    />
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(item.updated_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <RoleGuard action="inventory:manage">
                        <button
                          type="button"
                          onClick={() => onStockIn(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                          title="Stock IN (Receive units)"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Stock IN</span>
                        </button>

                        <button
                          type="button"
                          disabled={item.current_quantity <= 0}
                          onClick={() => onStockOut(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Stock OUT (Issue units)"
                        >
                          <MinusCircle className="w-3.5 h-3.5" />
                          <span>Stock OUT</span>
                        </button>
                      </RoleGuard>

                      <RoleGuard action="inventory:adjust">
                        <button
                          type="button"
                          onClick={() => onAdjust(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition"
                          title="Stock Adjustment (Reconciliation)"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Adjust</span>
                        </button>
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
            <span className="font-semibold text-slate-800">{total}</span> items
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
