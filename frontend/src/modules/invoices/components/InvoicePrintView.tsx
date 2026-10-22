import React from 'react';
import { IInvoiceDetail } from '../types/invoice.types';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { Building2, Mail, Phone, MapPin, Receipt, Calendar } from 'lucide-react';

interface InvoicePrintViewProps {
  invoice: IInvoiceDetail;
}

export const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({ invoice }) => {
  return (
    <div className="bg-white p-8 max-w-4xl mx-auto text-slate-800 print:p-0 print:max-w-none print:shadow-none" id="printable-invoice">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-slate-200 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              STOCK MANAGEMENT SYSTEM
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            Commercial Invoicing &bull; Sales Logistics Division
          </p>
          <div className="mt-3 text-xs text-slate-600 space-y-0.5">
            <p>100 Logistics Way, Suite 400</p>
            <p>Tech Industrial Park, CA 94016</p>
            <p>billing@stockmanagement.internal &bull; (555) 019-2834</p>
          </div>
        </div>

        <div className="sm:text-right">
          <div className="inline-block">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block">
              Commercial Invoice
            </span>
            <div className="text-2xl font-mono font-bold text-blue-700">
              #{invoice.invoice_number}
            </div>
          </div>
          <div className="mt-3 space-y-1 text-xs">
            <div className="flex sm:justify-end gap-2 text-slate-600">
              <span className="text-slate-400">Invoice Date:</span>
              <span className="font-semibold text-slate-800">{invoice.invoice_date}</span>
            </div>
            <div className="flex sm:justify-end gap-2 text-slate-600">
              <span className="text-slate-400">Payment Due:</span>
              <span className="font-semibold text-slate-800">{invoice.due_date}</span>
            </div>
            {invoice.sales_order_number && (
              <div className="flex sm:justify-end gap-2 text-slate-600">
                <span className="text-slate-400">Sales Order:</span>
                <span className="font-semibold text-blue-600 font-mono">
                  #{invoice.sales_order_number}
                </span>
              </div>
            )}
            <div className="pt-1 flex sm:justify-end">
              <InvoiceStatusBadge status={invoice.status} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Bill-To Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-sm">
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Bill To (Customer):
          </span>
          <div className="text-base font-bold text-slate-900">
            {invoice.customer?.customer_name || invoice.customer_name || 'Customer'}
          </div>
          {invoice.customer?.company_name && (
            <div className="text-slate-600 font-medium">
              {invoice.customer.company_name}
            </div>
          )}
          {invoice.customer?.address && (
            <div className="text-xs text-slate-600 flex items-start gap-1.5 pt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <span>
                {invoice.customer.address}, {invoice.customer.city}, {invoice.customer.state} {invoice.customer.postal_code}
              </span>
            </div>
          )}
          {invoice.customer?.email && (
            <div className="text-xs text-slate-600 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>{invoice.customer.email}</span>
            </div>
          )}
          {invoice.customer?.phone && (
            <div className="text-xs text-slate-600 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>{invoice.customer.phone}</span>
            </div>
          )}
          {invoice.customer?.tax_number && (
            <div className="text-xs text-slate-500 font-mono pt-1">
              Tax ID / GST: {invoice.customer.tax_number}
            </div>
          )}
        </div>

        <div className="space-y-1.5 md:text-right">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Invoice Summary:
          </span>
          <div className="text-xs text-slate-600 space-y-1">
            <p>
              Status: <span className="font-semibold text-slate-800">{invoice.status}</span>
            </p>
            <p>
              Created By: <span className="font-medium text-slate-700">{invoice.created_by_name || invoice.created_by}</span>
            </p>
            <p>
              Line Items: <span className="font-medium text-slate-700">{invoice.items.length} items</span>
            </p>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="py-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-slate-300 text-xs font-semibold text-slate-600 uppercase">
              <th className="py-2.5 text-center w-12">#</th>
              <th className="py-2.5">Item & Description</th>
              <th className="py-2.5 text-right w-20">Qty</th>
              <th className="py-2.5 text-right w-24">Unit Price</th>
              <th className="py-2.5 text-right w-24">Tax</th>
              <th className="py-2.5 text-right w-24">Discount</th>
              <th className="py-2.5 text-right w-28">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="py-3 text-center text-xs text-slate-400 font-mono">{idx + 1}</td>
                <td className="py-3">
                  <div className="font-semibold text-slate-900">{item.description}</div>
                  {item.product_name && (
                    <div className="text-xs text-slate-500">
                      Product: {item.product_name} {item.product_sku ? `(${item.product_sku})` : ''}
                    </div>
                  )}
                </td>
                <td className="py-3 text-right font-medium text-slate-900">{item.quantity}</td>
                <td className="py-3 text-right text-slate-700">${Number(item.unit_price).toFixed(2)}</td>
                <td className="py-3 text-right text-slate-600">${Number(item.tax).toFixed(2)}</td>
                <td className="py-3 text-right text-slate-600">${Number(item.discount).toFixed(2)}</td>
                <td className="py-3 text-right font-bold text-slate-900">${Number(item.line_total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Financial Breakdown */}
        <div className="flex justify-end pt-4">
          <div className="w-72 space-y-2 text-sm border-t border-slate-200 pt-3">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">${invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.tax > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax:</span>
                <span className="font-semibold text-slate-900">+${invoice.tax.toFixed(2)}</span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span className="font-semibold">-${invoice.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t-2 border-slate-900 pt-2 flex justify-between font-bold text-base text-slate-900">
              <span>Total Due:</span>
              <span className="text-blue-700 font-mono">${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes & Payment Terms */}
      <div className="pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-500">
        <div>
          <span className="font-bold uppercase tracking-wider text-slate-600 block mb-1">
            Notes & Remarks:
          </span>
          <p className="italic">{invoice.notes || 'Standard customer sales order fulfillment. No special terms.'}</p>
        </div>
        <div className="md:text-right">
          <span className="font-bold uppercase tracking-wider text-slate-600 block mb-1">
            Terms & Conditions:
          </span>
          <p>Payment is due within {invoice.due_date ? `the stated due date (${invoice.due_date})` : '30 days of issue'}.</p>
          <p>Thank you for choosing Stock Management System!</p>
        </div>
      </div>
    </div>
  );
};
