import React, { useState, useEffect } from 'react';
import {
  IInvoiceDetail,
  IInvoiceFormData,
  IInvoiceItemInput,
} from '../types/invoice.types';
import { invoiceService } from '../services/invoiceService';
import { salesService } from '../../sales/services/salesService';
import { customerService } from '../../customers/services/customerService';
import { productService } from '../../products/services/productService';
import { ISalesOrder } from '../../sales/types/sales.types';
import { ICustomer } from '../../customers/types/customer.types';
import { IProduct } from '../../products/types/product.types';
import {
  X,
  Plus,
  Trash2,
  Loader2,
  FileText,
  AlertCircle,
  Sparkles,
  Receipt,
} from 'lucide-react';

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (invoice: IInvoiceDetail) => void;
  invoiceToEdit?: IInvoiceDetail | null;
  initialSalesOrderId?: string;
}

export const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  invoiceToEdit,
  initialSalesOrderId,
}) => {
  const isEditing = Boolean(invoiceToEdit);

  const [loading, setLoading] = useState(false);
  const [fetchingSales, setFetchingSales] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [salesOrders, setSalesOrders] = useState<ISalesOrder[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);

  // Form State
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState<string>(
    initialSalesOrderId || ''
  );
  const [customerId, setCustomerId] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [orderTax, setOrderTax] = useState<number>(0);
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [items, setItems] = useState<IInvoiceItemInput[]>([
    { product_id: null, description: '', quantity: 1, unit_price: 0, tax: 0, discount: 0, line_total: 0 },
  ]);

  // Load masters on modal open
  useEffect(() => {
    if (!isOpen) return;

    const loadMasters = async () => {
      try {
        const [cRes, soRes, pRes] = await Promise.all([
          customerService.getCustomers({ limit: 100 }),
          salesService.getSales({ limit: 100 }),
          productService.getProducts({ limit: 100 }),
        ]);
        setCustomers(cRes.items);
        setSalesOrders(soRes.items);
        setProducts(pRes.items);
      } catch (err) {
        console.error('Failed to load masters in invoice form modal', err);
      }
    };
    loadMasters();
  }, [isOpen]);

  // Initialize or reset form values
  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    if (invoiceToEdit) {
      setCustomerId(invoiceToEdit.customer_id);
      setSelectedSalesOrderId(invoiceToEdit.sales_order_id || '');
      setInvoiceDate(invoiceToEdit.invoice_date);
      setDueDate(invoiceToEdit.due_date);
      setNotes(invoiceToEdit.notes || '');
      setOrderTax(invoiceToEdit.tax || 0);
      setOrderDiscount(invoiceToEdit.discount || 0);
      setItems(
        invoiceToEdit.items.map((i) => ({
          product_id: i.product_id || null,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          tax: i.tax || 0,
          discount: i.discount || 0,
          line_total: i.line_total,
        }))
      );
    } else if (initialSalesOrderId) {
      setSelectedSalesOrderId(initialSalesOrderId);
      loadFromSalesOrder(initialSalesOrderId);
    } else {
      resetForm();
    }
  }, [isOpen, invoiceToEdit, initialSalesOrderId]);

  const resetForm = () => {
    setSelectedSalesOrderId('');
    setCustomerId('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setNotes('');
    setOrderTax(0);
    setOrderDiscount(0);
    setItems([{ product_id: null, description: '', quantity: 1, unit_price: 0, tax: 0, discount: 0, line_total: 0 }]);
    setError(null);
  };

  const loadFromSalesOrder = async (soId: string) => {
    if (!soId) return;
    try {
      setFetchingSales(true);
      setError(null);
      const preview = await invoiceService.getPreviewFromSales(soId);

      if (preview.customer_id) setCustomerId(preview.customer_id);
      if (preview.due_date) setDueDate(preview.due_date);
      if (preview.notes) setNotes(preview.notes);
      if (preview.tax !== undefined) setOrderTax(preview.tax);
      if (preview.discount !== undefined) setOrderDiscount(preview.discount);

      if (preview.items && preview.items.length > 0) {
        setItems(
          preview.items.map((item: any) => ({
            product_id: item.product_id || null,
            description: item.description,
            quantity: Number(item.quantity) || 1,
            unit_price: Number(item.unit_price) || 0,
            tax: Number(item.tax) || 0,
            discount: Number(item.discount) || 0,
            line_total: Number(item.line_total) || 0,
          }))
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to auto-populate from sales order.');
    } finally {
      setFetchingSales(false);
    }
  };

  const handleItemChange = (index: number, field: keyof IInvoiceItemInput, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    // Auto-fill description & price when product is selected
    if (field === 'product_id' && value) {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        item.description = `${prod.name} (${prod.sku})`;
        if (!item.unit_price || item.unit_price === 0) {
          item.unit_price = prod.selling_price;
        }
      }
    }

    const qty = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Math.max(0, Number(item.unit_price) || 0);
    const itemTax = Math.max(0, Number(item.tax) || 0);
    const itemDisc = Math.max(0, Number(item.discount) || 0);
    item.line_total = Math.max(0, Math.round((qty * unitPrice + itemTax - itemDisc) * 100) / 100);

    updated[index] = item;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { product_id: null, description: '', quantity: 1, unit_price: 0, tax: 0, discount: 0, line_total: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Compute live subtotal & grand total
  const subtotal = Math.round(items.reduce((sum, item) => sum + (item.line_total || 0), 0) * 100) / 100;
  const grandTotal = Math.max(0, Math.round((subtotal + Number(orderTax) - Number(orderDiscount)) * 100) / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    if (items.length === 0) {
      setError('At least one line item is required.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].description || !items[i].description.trim()) {
        setError(`Please enter a description for item #${i + 1}.`);
        return;
      }
      if (!items[i].quantity || items[i].quantity <= 0) {
        setError(`Quantity for item #${i + 1} must be greater than zero.`);
        return;
      }
    }

    try {
      setLoading(true);
      const payload: IInvoiceFormData = {
        sales_order_id: selectedSalesOrderId || null,
        customer_id: customerId,
        invoice_date: invoiceDate,
        due_date: dueDate,
        status: isEditing ? (invoiceToEdit?.status || 'DRAFT') : 'ISSUED',
        tax: Number(orderTax) || 0,
        discount: Number(orderDiscount) || 0,
        notes: notes.trim() || null,
        items,
      };

      let result: IInvoiceDetail;
      if (isEditing && invoiceToEdit) {
        result = await invoiceService.updateInvoice(invoiceToEdit.id, payload);
      } else {
        result = await invoiceService.createInvoice(payload);
      }

      onSuccess(result);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save invoice.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {isEditing ? `Edit Draft Invoice #${invoiceToEdit?.invoice_number}` : 'Create Commercial Invoice'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing ? 'Modify line items and terms' : 'Generate invoice from sales order or create manually'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Generate from Sales Order (Only when creating) */}
          {!isEditing && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Auto-Populate From Sales Order (Completed / Confirmed)</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <select
                  value={selectedSalesOrderId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedSalesOrderId(id);
                    if (id) loadFromSalesOrder(id);
                  }}
                  className="w-full sm:flex-1 px-3 py-2 text-xs border border-blue-200 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Choose Sales Order to Auto-Fill --</option>
                  {salesOrders
                    .filter((so) => so.status !== 'CANCELLED')
                    .map((so) => (
                      <option key={so.id} value={so.id}>
                        SO #{so.order_number} &bull; {so.customer_name || 'Customer'} &bull; Status: {so.status} &bull; Total: ${so.total.toFixed(2)}
                      </option>
                    ))}
                </select>
                {fetchingSales && (
                  <span className="flex items-center gap-1.5 text-xs text-blue-700 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading items...
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Master Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customer_name} {c.company_name ? `(${c.company_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Invoice Line Items
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="px-3 py-2.5 w-44">Product (Optional)</th>
                      <th className="px-3 py-2.5 min-w-[200px]">Description *</th>
                      <th className="px-3 py-2.5 w-20 text-right">Qty *</th>
                      <th className="px-3 py-2.5 w-24 text-right">Unit Price</th>
                      <th className="px-3 py-2.5 w-20 text-right">Tax</th>
                      <th className="px-3 py-2.5 w-20 text-right">Disc</th>
                      <th className="px-3 py-2.5 w-24 text-right">Line Total</th>
                      <th className="px-3 py-2.5 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        {/* Product Picker */}
                        <td className="p-2">
                          <select
                            value={item.product_id || ''}
                            onChange={(e) => handleItemChange(index, 'product_id', e.target.value || null)}
                            className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="">Custom / None</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (${p.selling_price})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Description */}
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            placeholder="Description..."
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                        </td>

                        {/* Quantity */}
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                            className="w-full p-1.5 border border-slate-300 rounded text-xs text-right focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                        </td>

                        {/* Unit Price */}
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-full p-1.5 border border-slate-300 rounded text-xs text-right focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                        </td>

                        {/* Tax */}
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.tax}
                            onChange={(e) => handleItemChange(index, 'tax', parseFloat(e.target.value) || 0)}
                            className="w-full p-1.5 border border-slate-300 rounded text-xs text-right focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                        </td>

                        {/* Discount */}
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.discount}
                            onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                            className="w-full p-1.5 border border-slate-300 rounded text-xs text-right focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                        </td>

                        {/* Line Total */}
                        <td className="p-2 text-right font-semibold text-slate-800">
                          ${(item.line_total || 0).toFixed(2)}
                        </td>

                        {/* Remove Row */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            disabled={items.length <= 1}
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom Totals & Notes Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Notes & Terms
              </label>
              <textarea
                rows={3}
                placeholder="Payment terms, delivery reference, or special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Overall Tax ($):</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={orderTax}
                  onChange={(e) => setOrderTax(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-right text-xs border border-slate-300 rounded bg-white"
                />
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Overall Discount ($):</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={orderDiscount}
                  onChange={(e) => setOrderDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-right text-xs border border-slate-300 rounded bg-white"
                />
              </div>
              <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-sm text-slate-900">
                <span>Grand Total:</span>
                <span className="text-blue-700 font-mono">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? 'Save Changes' : 'Create Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
