import React from 'react';
import { Link } from 'react-router-dom';
import { ISalesSummary } from '../types/dashboard.types';
import { TrendingUp, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

interface SalesSummaryProps {
  summary: ISalesSummary;
}

export const SalesSummary: React.FC<SalesSummaryProps> = ({ summary }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Sales Operations</h2>
              <p className="text-xs text-slate-500">
                ${summary.metrics.total_revenue.toFixed(2)} total fulfilled revenue
              </p>
            </div>
          </div>

          <Link
            to="/sales"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50/70 border-b border-slate-200 text-center py-2.5">
          <div>
            <div className="text-xs text-slate-500">Total Orders</div>
            <div className="font-bold text-slate-800 text-sm mt-0.5">{summary.metrics.total_orders}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Fulfilled</div>
            <div className="font-bold text-emerald-700 text-sm mt-0.5">{summary.metrics.completed_orders}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Pending</div>
            <div className="font-bold text-amber-600 text-sm mt-0.5">
              {summary.metrics.draft_orders + summary.metrics.confirmed_orders + summary.metrics.processing_orders}
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="p-5">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Recent Sales Orders
          </div>

          {summary.recent_orders.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
              No sales orders created yet.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-3.5 py-2">Order #</th>
                    <th className="px-3.5 py-2">Customer</th>
                    <th className="px-3.5 py-2">Date</th>
                    <th className="px-3.5 py-2 text-right">Total</th>
                    <th className="px-3.5 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {summary.recent_orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50">
                      <td className="px-3.5 py-2.5 font-mono font-semibold text-blue-700">
                        {order.order_number}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-800 font-medium">
                        {order.customer_name}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-500">{order.order_date}</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-slate-900 font-mono">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          order.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {order.status}
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
