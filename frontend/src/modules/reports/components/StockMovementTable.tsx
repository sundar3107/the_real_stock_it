import React from 'react';
import {
  History,
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
  Scale,
} from 'lucide-react';
import { IStockMovementReport } from '../types/report.types';

interface StockMovementTableProps {
  data: IStockMovementReport;
}

export const StockMovementTable: React.FC<StockMovementTableProps> = ({ data }) => {
  const { summary, movements } = data;

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Audit Movements
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {summary.total_movements}{' '}
              <span className="text-xs text-slate-400 font-normal">records</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Stock Inflow (Received)
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-0.5">
              +{summary.stock_in_quantity.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">
                ({summary.stock_in_count} batches)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Stock Outflow (Sales/Dispatched)
            </div>
            <div className="text-2xl font-bold text-rose-600 mt-0.5">
              -{summary.stock_out_quantity.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">
                ({summary.stock_out_count} batches)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Net Inventory Shift
            </div>
            <div
              className={`text-2xl font-bold mt-0.5 ${
                summary.net_quantity_change >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {summary.net_quantity_change > 0 ? `+${summary.net_quantity_change}` : summary.net_quantity_change}{' '}
              <span className="text-xs text-slate-400 font-normal">
                ({summary.adjustment_count} adjustments)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stock Transactions Audit Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-800">
            Immutable Audit Trail &amp; Transaction Ledger ({movements.length} events)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">Date &amp; Time</th>
                <th className="py-3 px-4">Item (SKU / Name)</th>
                <th className="py-3 px-4 text-center">Movement Type</th>
                <th className="py-3 px-4 text-center">Quantity Delta</th>
                <th className="py-3 px-4 text-center">Stock Transition</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No stock transaction records match the specified filters.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.transaction_id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{m.product_name}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {m.product_sku} &bull; {m.category_name}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {m.transaction_type === 'STOCK_IN' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ArrowDownRight className="w-3 h-3 text-emerald-600" />
                          Stock IN
                        </span>
                      )}
                      {m.transaction_type === 'STOCK_OUT' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <ArrowUpRight className="w-3 h-3 text-rose-600" />
                          Stock OUT
                        </span>
                      )}
                      {m.transaction_type === 'ADJUSTMENT' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <SlidersHorizontal className="w-3 h-3 text-blue-600" />
                          Adjustment
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span
                        className={
                          m.new_quantity > m.previous_quantity
                            ? 'text-emerald-600'
                            : m.new_quantity < m.previous_quantity
                            ? 'text-rose-600'
                            : 'text-slate-600'
                        }
                      >
                        {m.new_quantity > m.previous_quantity
                          ? `+${m.quantity}`
                          : m.new_quantity < m.previous_quantity
                          ? `-${m.quantity}`
                          : `${m.quantity}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600">
                      <span className="text-slate-400">{m.previous_quantity}</span>
                      <span className="mx-1 text-slate-300">&rarr;</span>
                      <span className="font-bold text-slate-900">{m.new_quantity}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={m.reason}>
                      {m.reason}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {m.reference ? (
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">
                          {m.reference}
                        </span>
                      ) : (
                        <span className="text-slate-300">&mdash;</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{m.performed_by_name}</div>
                      <div className="text-[10px] text-slate-400">{m.performed_by_email}</div>
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
