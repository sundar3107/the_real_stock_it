import React from 'react';
import { IInvoice, InvoiceStatus } from '../types/invoice.types';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { Eye, Edit3, CheckCircle2, Send, XCircle, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

interface InvoiceTableProps {
  invoices: IInvoice[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (newPage: number) => void;
  onView: (invoice: IInvoice) => void;
  onEdit: (invoice: IInvoice) => void;
  onStatusChange: (id: string, newStatus: InvoiceStatus) => void;
  canManage?: boolean;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  loading,
  page,
  totalPages,
  totalItems,
  onPageChange,
  onView,
  onEdit,
  onStatusChange,
  canManage = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3" />
        <p className="text-sm font-medium">Loading invoices...</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">No invoices found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No invoices match your current filter criteria or none have been generated yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-5 py-3.5">Invoice #</th>
              <th scope="col" className="px-5 py-3.5">Customer</th>
              <th scope="col" className="px-5 py-3.5">Sales Order #</th>
              <th scope="col" className="px-5 py-3.5">Invoice Date</th>
              <th scope="col" className="px-5 py-3.5">Due Date</th>
              <th scope="col" className="px-5 py-3.5 text-right">Total</th>
              <th scope="col" className="px-5 py-3.5 text-center">Status</th>
              <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                {/* Invoice # */}
                <td className="px-5 py-4">
                  <div className="font-mono font-bold text-blue-700 text-sm">
                    {inv.invoice_number}
                  </div>
                  <div className="text-xs text-slate-400">
                    {inv.item_count ? `${inv.item_count} items` : ''}
                  </div>
                </td>

                {/* Customer */}
                <td className="px-5 py-4">
                  <div className="font-medium text-slate-900">
                    {inv.customer_name || 'Customer'}
                  </div>
                  {inv.company_name && (
                    <div className="text-xs text-slate-500">{inv.company_name}</div>
                  )}
                </td>

                {/* Sales Order # */}
                <td className="px-5 py-4">
                  {inv.sales_order_number ? (
                    <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      #{inv.sales_order_number}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Direct Invoice</span>
                  )}
                </td>

                {/* Invoice Date */}
                <td className="px-5 py-4 text-xs text-slate-600">
                  {inv.invoice_date}
                </td>

                {/* Due Date */}
                <td className="px-5 py-4 text-xs text-slate-600">
                  {inv.due_date}
                </td>

                {/* Total */}
                <td className="px-5 py-4 text-right font-bold text-slate-900 font-mono">
                  ${inv.total.toFixed(2)}
                </td>

                {/* Status */}
                <td className="px-5 py-4 text-center">
                  <InvoiceStatusBadge status={inv.status} size="sm" />
                </td>

                {/* Actions */}
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* View Details / Print */}
                    <button
                      onClick={() => onView(inv)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="View & Print Invoice"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit Draft */}
                    {canManage && inv.status === 'DRAFT' && (
                      <button
                        onClick={() => onEdit(inv)}
                        className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title="Edit Draft"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Quick Issue */}
                    {canManage && inv.status === 'DRAFT' && (
                      <button
                        onClick={() => onStatusChange(inv.id, 'ISSUED')}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Issue Invoice"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}

                    {/* Quick Mark Paid */}
                    {canManage && (inv.status === 'ISSUED' || inv.status === 'PARTIALLY_PAID') && (
                      <button
                        onClick={() => onStatusChange(inv.id, 'PAID')}
                        className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="Mark as Paid"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Cancel Invoice */}
                    {canManage && ['DRAFT', 'ISSUED', 'PARTIALLY_PAID'].includes(inv.status) && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Cancel invoice #${inv.invoice_number}?`)) {
                            onStatusChange(inv.id, 'CANCELLED');
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Cancel Invoice"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing page <span className="font-semibold text-slate-800">{page}</span> of{' '}
          <span className="font-semibold text-slate-800">{totalPages}</span> ({totalItems} total invoices)
        </div>

        <div className="flex items-center gap-1">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="p-1.5 border border-slate-300 rounded-md hover:bg-white disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="p-1.5 border border-slate-300 rounded-md hover:bg-white disabled:opacity-40 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
