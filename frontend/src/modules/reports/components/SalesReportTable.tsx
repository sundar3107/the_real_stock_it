import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Award,
  CheckCircle,
  Clock,
  Ban,
} from 'lucide-react';
import { ISalesReport } from '../types/report.types';

interface SalesReportTableProps {
  data: ISalesReport;
}

export const SalesReportTable: React.FC<SalesReportTableProps> = ({ data }) => {
  const { summary, orders, top_products } = data;

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Sales Orders
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {summary.total_orders}{' '}
              <span className="text-xs text-slate-400 font-normal">orders</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Completed Revenue
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-0.5">
              ${summary.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Average Order Value
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              ${summary.average_order_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Tax &amp; Discounts
            </div>
            <div className="text-sm font-semibold text-slate-800 mt-1">
              Tax: <span className="text-indigo-600">${summary.total_tax.toFixed(2)}</span>
            </div>
            <div className="text-xs text-slate-500">
              Discounts: ${summary.total_discount.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
        <span className="font-semibold text-slate-600">Fulfillment Pipeline:</span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          Completed: {summary.completed_orders}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          In Progress / Pending: {summary.pending_orders}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
          <Ban className="w-3.5 h-3.5 text-slate-400" />
          Cancelled: {summary.cancelled_orders}
        </span>
      </div>

      {/* Top Selling Products Preview */}
      {top_products.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            Top Selling Products by Revenue
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {top_products.map((prod) => (
              <div key={prod.product_id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                <div className="font-semibold text-slate-800 truncate" title={prod.name}>
                  {prod.name}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">{prod.sku}</div>
                <div className="mt-2 flex justify-between items-center text-slate-600">
                  <span>{prod.units_sold} units</span>
                  <span className="font-bold text-emerald-600">${prod.total_revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-800">
            Sales Orders Breakdown ({orders.length} orders)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">Order Number</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Items Qty</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Tax</th>
                <th className="py-3 px-4 text-right">Discount</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No sales orders matched the filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.sales_order_id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-medium text-blue-600">{o.order_number}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{o.customer_name}</div>
                      <div className="text-[11px] text-slate-400">{o.customer_email}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{o.order_date}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          o.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : o.status === 'CONFIRMED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : o.status === 'PROCESSING'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : o.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-800">
                      {o.total_quantity}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">${o.subtotal.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-slate-600">${o.tax.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-slate-600">${o.discount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ${o.total.toFixed(2)}
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
