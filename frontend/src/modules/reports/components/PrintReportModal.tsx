import React from 'react';
import { Printer, X } from 'lucide-react';
import {
  IInventoryValuationReport,
  IPurchaseReport,
  ISalesReport,
  IStockMovementReport,
  ReportType,
} from '../types/report.types';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType;
  inventoryData?: IInventoryValuationReport | null;
  salesData?: ISalesReport | null;
  purchasesData?: IPurchaseReport | null;
  movementData?: IStockMovementReport | null;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  reportType,
  inventoryData,
  salesData,
  purchasesData,
  movementData,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const reportTitles: Record<ReportType, string> = {
    inventory: 'Inventory Valuation & Asset Report',
    sales: 'Sales Performance & Revenue Report',
    purchases: 'Procurement & Supplier Fulfillment Report',
    movement: 'Stock Movement & Transaction Audit Trail',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header / Actions */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Print Preview: {reportTitles[reportType]}</h2>
            <p className="text-xs text-slate-500">
              Formatted document ready for physical printing or PDF archival.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto flex-1 text-slate-800 text-xs space-y-6">
          <div className="flex justify-between items-start border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Stock Management System (SCM)</h1>
              <p className="text-xs text-slate-500 mt-0.5">Automated Enterprise Analytical Report</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div><strong>Generated:</strong> {new Date().toLocaleString()}</div>
              <div><strong>Module:</strong> Module 10 (Reports &amp; Analytics)</div>
            </div>
          </div>

          {/* Report Content based on active tab */}
          {reportType === 'inventory' && inventoryData && (
            <div>
              <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6">
                <div>
                  <div className="text-slate-400">Total Items</div>
                  <div className="text-base font-bold text-slate-900">{inventoryData.summary.total_products}</div>
                </div>
                <div>
                  <div className="text-slate-400">Units in Stock</div>
                  <div className="text-base font-bold text-slate-900">{inventoryData.summary.total_units}</div>
                </div>
                <div>
                  <div className="text-slate-400">Cost Valuation</div>
                  <div className="text-base font-bold text-slate-900">${inventoryData.summary.total_cost_valuation.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-slate-400">Retail Potential</div>
                  <div className="text-base font-bold text-emerald-600">${inventoryData.summary.total_retail_valuation.toFixed(2)}</div>
                </div>
              </div>

              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="p-2">SKU</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Category</th>
                    <th className="p-2 text-center">Stock</th>
                    <th className="p-2 text-right">Cost</th>
                    <th className="p-2 text-right">Retail</th>
                    <th className="p-2 text-right">Cost Val</th>
                    <th className="p-2 text-right">Retail Val</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventoryData.items.map((i) => (
                    <tr key={i.product_id}>
                      <td className="p-2 font-mono">{i.sku}</td>
                      <td className="p-2 font-medium">{i.name}</td>
                      <td className="p-2">{i.category_name}</td>
                      <td className="p-2 text-center">{i.current_quantity}</td>
                      <td className="p-2 text-right">${i.purchase_price.toFixed(2)}</td>
                      <td className="p-2 text-right">${i.selling_price.toFixed(2)}</td>
                      <td className="p-2 text-right font-medium">${i.total_cost_valuation.toFixed(2)}</td>
                      <td className="p-2 text-right font-medium text-emerald-600">${i.total_retail_valuation.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'sales' && salesData && (
            <div>
              <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6">
                <div>
                  <div className="text-slate-400">Total Orders</div>
                  <div className="text-base font-bold text-slate-900">{salesData.summary.total_orders}</div>
                </div>
                <div>
                  <div className="text-slate-400">Completed Orders</div>
                  <div className="text-base font-bold text-slate-900">{salesData.summary.completed_orders}</div>
                </div>
                <div>
                  <div className="text-slate-400">Revenue</div>
                  <div className="text-base font-bold text-emerald-600">${salesData.summary.total_revenue.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-slate-400">Avg Order Value</div>
                  <div className="text-base font-bold text-slate-900">${salesData.summary.average_order_value.toFixed(2)}</div>
                </div>
              </div>

              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="p-2">Order #</th>
                    <th className="p-2">Customer</th>
                    <th className="p-2">Date</th>
                    <th className="p-2 text-center">Status</th>
                    <th className="p-2 text-center">Items</th>
                    <th className="p-2 text-right">Total ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesData.orders.map((o) => (
                    <tr key={o.sales_order_id}>
                      <td className="p-2 font-mono">{o.order_number}</td>
                      <td className="p-2">{o.customer_name}</td>
                      <td className="p-2">{o.order_date}</td>
                      <td className="p-2 text-center font-semibold">{o.status}</td>
                      <td className="p-2 text-center">{o.total_quantity}</td>
                      <td className="p-2 text-right font-bold">${o.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'purchases' && purchasesData && (
            <div>
              <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6">
                <div>
                  <div className="text-slate-400">Total POs</div>
                  <div className="text-base font-bold text-slate-900">{purchasesData.summary.total_orders}</div>
                </div>
                <div>
                  <div className="text-slate-400">Received</div>
                  <div className="text-base font-bold text-slate-900">{purchasesData.summary.received_orders}</div>
                </div>
                <div>
                  <div className="text-slate-400">Spend</div>
                  <div className="text-base font-bold text-amber-600">${purchasesData.summary.total_spend.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-slate-400">Fulfillment</div>
                  <div className="text-base font-bold text-slate-900">{purchasesData.summary.overall_fulfillment_rate}%</div>
                </div>
              </div>

              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="p-2">PO ID</th>
                    <th className="p-2">Supplier</th>
                    <th className="p-2">Order Date</th>
                    <th className="p-2 text-center">Status</th>
                    <th className="p-2 text-center">Ordered</th>
                    <th className="p-2 text-center">Received</th>
                    <th className="p-2 text-right">Total ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchasesData.orders.map((po) => (
                    <tr key={po.purchase_order_id}>
                      <td className="p-2 font-mono">{po.purchase_order_id.slice(0, 8)}</td>
                      <td className="p-2">{po.supplier_name}</td>
                      <td className="p-2">{po.order_date}</td>
                      <td className="p-2 text-center font-semibold">{po.status}</td>
                      <td className="p-2 text-center">{po.total_ordered}</td>
                      <td className="p-2 text-center">{po.total_received}</td>
                      <td className="p-2 text-right font-bold">${po.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'movement' && movementData && (
            <div>
              <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6">
                <div>
                  <div className="text-slate-400">Movements</div>
                  <div className="text-base font-bold text-slate-900">{movementData.summary.total_movements}</div>
                </div>
                <div>
                  <div className="text-slate-400">Inflow Units</div>
                  <div className="text-base font-bold text-emerald-600">+{movementData.summary.stock_in_quantity}</div>
                </div>
                <div>
                  <div className="text-slate-400">Outflow Units</div>
                  <div className="text-base font-bold text-rose-600">-{movementData.summary.stock_out_quantity}</div>
                </div>
                <div>
                  <div className="text-slate-400">Net Shift</div>
                  <div className="text-base font-bold text-slate-900">{movementData.summary.net_quantity_change}</div>
                </div>
              </div>

              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="p-2">Date</th>
                    <th className="p-2">Item</th>
                    <th className="p-2 text-center">Type</th>
                    <th className="p-2 text-center">Delta</th>
                    <th className="p-2 text-center">Transition</th>
                    <th className="p-2">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movementData.movements.map((m) => (
                    <tr key={m.transaction_id}>
                      <td className="p-2 whitespace-nowrap">{new Date(m.created_at).toLocaleDateString()}</td>
                      <td className="p-2 font-medium">{m.product_name} ({m.product_sku})</td>
                      <td className="p-2 text-center font-semibold">{m.transaction_type}</td>
                      <td className="p-2 text-center">{m.quantity}</td>
                      <td className="p-2 text-center font-mono">{m.previous_quantity} &rarr; {m.new_quantity}</td>
                      <td className="p-2">{m.reason}</td>
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
