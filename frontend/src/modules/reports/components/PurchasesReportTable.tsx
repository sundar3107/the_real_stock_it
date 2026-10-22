import React from 'react';
import {
  Truck,
  DollarSign,
  PackageCheck,
  Percent,
  CheckCircle,
  Clock,
  Ban,
} from 'lucide-react';
import { IPurchaseReport } from '../types/report.types';

interface PurchasesReportTableProps {
  data: IPurchaseReport;
}

export const PurchasesReportTable: React.FC<PurchasesReportTableProps> = ({ data }) => {
  const { summary, orders, supplier_spend } = data;

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Purchase Orders
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {summary.total_orders}{' '}
              <span className="text-xs text-slate-400 font-normal">POs</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Procurement Spend
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-0.5">
              ${summary.total_spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Received Orders
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-0.5">
              {summary.received_orders}{' '}
              <span className="text-xs text-slate-400 font-normal">
                ({summary.pending_orders} pending)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Overall Fulfillment Rate
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {summary.overall_fulfillment_rate}%
            </div>
          </div>
        </div>
      </div>

      {/* PO Status Breakdown */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
        <span className="font-semibold text-slate-600">Procurement Status:</span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          Received: {summary.received_orders}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          Pending / In-Transit: {summary.pending_orders}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
          <Ban className="w-3.5 h-3.5 text-slate-400" />
          Cancelled: {summary.cancelled_orders}
        </span>
      </div>

      {/* Top Supplier Spend Breakdown */}
      {supplier_spend.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-blue-500" />
            Spend Breakdown by Supplier
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {supplier_spend.map((s) => (
              <div key={s.supplier_id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                <div className="font-semibold text-slate-800 truncate" title={s.supplier_name}>
                  {s.supplier_name}
                </div>
                <div className="mt-2 flex justify-between items-center text-slate-600">
                  <span>{s.orders_count} orders</span>
                  <span className="font-bold text-amber-600">${s.total_spend.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed POs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-800">
            Purchase Orders Breakdown ({orders.length} orders)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">PO Reference</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Expected Delivery</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ordered</th>
                <th className="py-3 px-4 text-center">Received</th>
                <th className="py-3 px-4 text-center">Fulfillment</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No purchase orders matched the filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((po) => (
                  <tr key={po.purchase_order_id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-medium text-blue-600">
                      {po.purchase_order_id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{po.supplier_name}</div>
                      <div className="text-[11px] text-slate-400">{po.supplier_company}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{po.order_date}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {po.expected_delivery_date || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          po.status === 'RECEIVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : po.status === 'PARTIALLY_RECEIVED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : po.status === 'ORDERED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : po.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-800">
                      {po.total_ordered}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-emerald-600">
                      {po.total_received}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(po.fulfillment_percentage, 100)}%` }}
                          />
                        </div>
                        <span className="font-medium text-[11px] text-slate-600">
                          {po.fulfillment_percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ${po.total.toFixed(2)}
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
