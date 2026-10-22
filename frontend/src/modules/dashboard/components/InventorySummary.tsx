import React from 'react';
import { Link } from 'react-router-dom';
import { IInventorySummary } from '../types/dashboard.types';
import { Boxes, AlertTriangle, XCircle, ArrowRight, Layers } from 'lucide-react';

interface InventorySummaryProps {
  summary: IInventorySummary;
}

export const InventorySummary: React.FC<InventorySummaryProps> = ({ summary }) => {
  const hasAlerts = summary.low_stock_products.length > 0 || summary.out_of_stock_products.length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Inventory Status & Alerts</h2>
            <p className="text-xs text-slate-500">
              {summary.metrics.total_stock_units} physical units across {summary.metrics.total_items} items
            </p>
          </div>
        </div>

        <Link
          to="/inventory"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
        >
          <span>Open Inventory</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Body Content */}
      <div className="p-5 space-y-6">
        {/* Out of Stock Alert Banner */}
        {summary.out_of_stock_products.length > 0 && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5">
            <XCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-rose-800">
                {summary.out_of_stock_products.length} products completely OUT OF STOCK!
              </span>
              <p className="text-rose-700 mt-0.5">
                {summary.out_of_stock_products.map((p) => p.product_name).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Low Stock Items Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Low Stock Items Needing Reorder ({summary.low_stock_products.length})</span>
            </span>
          </div>

          {summary.low_stock_products.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No products currently at or below their reorder threshold. Stock balances are healthy.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Product</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5 text-right">In Stock</th>
                    <th className="px-4 py-2.5 text-right">Reorder Level</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {summary.low_stock_products.map((item) => (
                    <tr key={item.product_id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {item.product_name}
                        <span className="block font-mono text-[10px] text-slate-400">{item.sku}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.category_name || '-'}</td>
                      <td className="px-4 py-3 text-right font-bold text-amber-700">
                        {item.current_quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {item.reorder_level} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          Low Stock
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
