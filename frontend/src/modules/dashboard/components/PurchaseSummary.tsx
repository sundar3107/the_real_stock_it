import React from 'react';
import { Link } from 'react-router-dom';
import { IPurchaseSummary } from '../types/dashboard.types';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface PurchaseSummaryProps {
  summary: IPurchaseSummary;
}

export const PurchaseSummary: React.FC<PurchaseSummaryProps> = ({ summary }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Purchase Procurement</h2>
              <p className="text-xs text-slate-500">
                ${summary.metrics.total_spend.toFixed(2)} total procurement volume
              </p>
            </div>
          </div>

          <Link
            to="/purchases"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50/70 border-b border-slate-200 text-center py-2.5">
          <div>
            <div className="text-xs text-slate-500">Total POs</div>
            <div className="font-bold text-slate-800 text-sm mt-0.5">{summary.metrics.total_orders}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Received</div>
            <div className="font-bold text-emerald-700 text-sm mt-0.5">{summary.metrics.received_orders}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Pending Receipt</div>
            <div className="font-bold text-purple-600 text-sm mt-0.5">
              {summary.metrics.draft_orders + summary.metrics.ordered_orders + summary.metrics.partially_received_orders}
            </div>
          </div>
        </div>

        {/* Pending & Recent POs Table */}
        <div className="p-5">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Pending / Recent Purchase Orders
          </div>

          {summary.pending_orders.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
              No pending purchase orders awaiting supplier delivery.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-3.5 py-2">PO #</th>
                    <th className="px-3.5 py-2">Supplier</th>
                    <th className="px-3.5 py-2">Order Date</th>
                    <th className="px-3.5 py-2 text-right">Total</th>
                    <th className="px-3.5 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {summary.pending_orders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/50">
                      <td className="px-3.5 py-2.5 font-mono font-semibold text-purple-700">
                        {po.po_number}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-800 font-medium">{po.supplier_name}</td>
                      <td className="px-3.5 py-2.5 text-slate-500">{po.order_date}</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-slate-900 font-mono">
                        ${po.total.toFixed(2)}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          po.status === 'RECEIVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : po.status === 'PARTIALLY_RECEIVED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {po.status}
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
