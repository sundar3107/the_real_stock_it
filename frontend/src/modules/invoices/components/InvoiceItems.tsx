import React from 'react';
import { IInvoiceItem } from '../types/invoice.types';

interface InvoiceItemsProps {
  items: IInvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

export const InvoiceItems: React.FC<InvoiceItemsProps> = ({
  items,
  subtotal,
  tax,
  discount,
  total,
}) => {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3 text-center w-12">#</th>
              <th scope="col" className="px-4 py-3">Description & Product</th>
              <th scope="col" className="px-4 py-3 text-right">Qty</th>
              <th scope="col" className="px-4 py-3 text-right">Unit Price</th>
              <th scope="col" className="px-4 py-3 text-right">Tax</th>
              <th scope="col" className="px-4 py-3 text-right">Discount</th>
              <th scope="col" className="px-4 py-3 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {items.map((item, index) => (
              <tr key={item.id || index} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 text-center text-xs text-slate-400 font-mono">
                  {index + 1}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{item.description}</div>
                  {item.product_name && (
                    <div className="text-xs text-slate-500">
                      Product: {item.product_name} {item.product_sku ? `(${item.product_sku})` : ''}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  ${Number(item.unit_price).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  ${Number(item.tax).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  ${Number(item.discount).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                  ${Number(item.line_total).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial Summary */}
      <div className="flex justify-end">
        <div className="w-full sm:w-72 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Items Subtotal:</span>
            <span className="font-medium text-slate-900">${subtotal.toFixed(2)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Tax:</span>
              <span className="font-medium text-slate-900">+${tax.toFixed(2)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount:</span>
              <span className="font-medium">-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-base text-slate-900">
            <span>Grand Total:</span>
            <span className="text-blue-700">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
