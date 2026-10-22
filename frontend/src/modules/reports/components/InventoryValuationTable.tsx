import React from 'react';
import {
  Boxes,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { IInventoryValuationReport } from '../types/report.types';

interface InventoryValuationTableProps {
  data: IInventoryValuationReport;
}

export const InventoryValuationTable: React.FC<InventoryValuationTableProps> = ({ data }) => {
  const { summary, items } = data;

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Stock Units
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {summary.total_units.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">
                ({summary.total_products} items)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Cost Valuation
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              ${summary.total_cost_valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Retail Potential
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              ${summary.total_retail_valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Projected Gross Margin
            </div>
            <div className="text-2xl font-bold text-purple-600 mt-0.5">
              ${summary.total_potential_margin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Stock Health Badges */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
        <span className="font-semibold text-slate-600">Stock Inventory Health:</span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Healthy: {summary.total_products - summary.low_stock_count - summary.out_of_stock_count}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Low Stock Alerts: {summary.low_stock_count}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-medium border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Out of Stock: {summary.out_of_stock_count}
        </span>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-800">
            Valuation Breakdown by Item ({items.length} records)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Stock Level</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Cost Valuation</th>
                <th className="py-3 px-4 text-right">Retail Potential</th>
                <th className="py-3 px-4 text-right">Margin (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No products matched the given criteria.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.product_id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">{item.sku}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{item.name}</td>
                    <td className="py-3 px-4 text-slate-600">{item.category_name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-slate-800">
                        {item.current_quantity.toLocaleString()}
                      </span>{' '}
                      <span className="text-slate-400">{item.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.stock_status === 'IN_STOCK' && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          In Stock
                        </span>
                      )}
                      {item.stock_status === 'LOW_STOCK' && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Low Stock
                        </span>
                      )}
                      {item.stock_status === 'OUT_OF_STOCK' && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      ${item.purchase_price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      ${item.selling_price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      ${item.total_cost_valuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                      ${item.total_retail_valuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-semibold ${
                          item.margin_percentage > 25
                            ? 'text-emerald-600'
                            : item.margin_percentage > 0
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {item.margin_percentage}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
