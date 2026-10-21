import React, { useState, useEffect } from 'react';
import {
  ISalesOrder,
  ISalesOrderDetail,
  ISalesOrderFormData,
  ISalesOrderItemInput,
  SalesStatus,
} from '../types/sales.types';
import { salesService } from '../services/salesService';
import { customerService } from '../../customers/services/customerService';
import { productService } from '../../products/services/productService';
import { ICustomer } from '../../customers/types/customer.types';
import { IProduct } from '../../products/types/product.types';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import {
  X,
  Plus,
  Trash2,
  TrendingUp,
  User,
  Package,
  Calendar,
  AlertCircle,
  FileText,
  DollarSign,
  Send,
  Save,
  Check,
} from 'lucide-react';

interface SalesFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  orderToEdit?: ISalesOrder | null;
}

interface ItemRowState extends ISalesOrderItemInput {
  tempId: string;
}

export const SalesFormModal: React.FC<SalesFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  orderToEdit,
}) => {
  const isEditing = Boolean(orderToEdit);

  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [orderTax, setOrderTax] = useState<number>(0);
  const [orderDiscount, setOrderDiscount] = useState<number>(0);

  const [items, setItems] = useState<ItemRowState[]>([
    {
      tempId: 'row-1',
      product_id: '',
      quantity: 1,
      unit_price: 0,
      tax: 0,
      discount: 0,
      line_total: 0,
    },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    const loadResources = async () => {
      try {
        setIsLoadingDropdowns(true);
        const [customerRes, productRes] = await Promise.all([
          customerService.getCustomers({ status: 'ACTIVE', limit: 100 }),
          productService.getProducts({ status: 'ACTIVE', limit: 100 }),
        ]);
        setCustomers(customerRes.items);
        setProducts(productRes.items);

        if (orderToEdit) {
          const detail = await salesService.getSaleById(orderToEdit.id);
          setCustomerId(detail.customer_id);
          setOrderDate(detail.order_date ? detail.order_date.split('T')[0] : '');
          setNotes(detail.notes || '');
          setOrderTax(detail.tax || 0);
          setOrderDiscount(detail.discount || 0);

          if (detail.items && detail.items.length > 0) {
            setItems(
              detail.items.map((i, idx) => ({
                tempId: `row-${idx}`,
                product_id: i.product_id,
                quantity: i.quantity,
                unit_price: i.unit_price,
                tax: i.tax || 0,
                discount: i.discount || 0,
                line_total: i.line_total,
              }))
            );
          }
        } else {
          setCustomerId('');
          setOrderDate(new Date().toISOString().split('T')[0]);
          setNotes('');
          setOrderTax(0);
          setOrderDiscount(0);
          setItems([
            {
              tempId: 'row-1',
              product_id: '',
              quantity: 1,
              unit_price: 0,
              tax: 0,
              discount: 0,
              line_total: 0,
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to load sales form resources', err);
      } finally {
        setIsLoadingDropdowns(false);
      }
    };

    loadResources();
    setErrors({});
  }, [isOpen, orderToEdit]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        tempId: `row-${Date.now()}-${Math.random()}`,
        product_id: '',
        quantity: 1,
        unit_price: 0,
        tax: 0,
        discount: 0,
        line_total: 0,
      },
    ]);
  };

  const handleRemoveItem = (tempId: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
  };

  const handleItemProductChange = (tempId: string, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setItems((prev) =>
      prev.map((i) => {
        if (i.tempId === tempId) {
          const unitPrice = prod ? Number(prod.selling_price || 0) : 0;
          const lineTotal = Math.max(0, i.quantity * unitPrice + (i.tax || 0) - (i.discount || 0));
          return {
            ...i,
            product_id: productId,
            unit_price: unitPrice,
            line_total: Math.round(lineTotal * 100) / 100,
          };
        }
        return i;
      })
    );
  };

  const handleItemFieldChange = (
    tempId: string,
    field: 'quantity' | 'unit_price' | 'tax' | 'discount',
    val: number
  ) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.tempId === tempId) {
          const updated = { ...i, [field]: val };
          const qty = field === 'quantity' ? val : i.quantity;
          const price = field === 'unit_price' ? val : (i.unit_price || 0);
          const itemTax = field === 'tax' ? val : (i.tax || 0);
          const itemDiscount = field === 'discount' ? val : (i.discount || 0);
          const lineTotal = Math.max(0, qty * price + itemTax - itemDiscount);
          return {
            ...updated,
            line_total: Math.round(lineTotal * 100) / 100,
          };
        }
        return i;
      })
    );
  };

  // Compute live totals
  const subtotal = items.reduce((acc, curr) => acc + (curr.quantity * (curr.unit_price || 0)), 0);
  const itemsTax = items.reduce((acc, curr) => acc + (Number(curr.tax) || 0), 0);
  const itemsDiscount = items.reduce((acc, curr) => acc + (Number(curr.discount) || 0), 0);
  const totalTax = itemsTax + (Number(orderTax) || 0);
  const totalDiscount = itemsDiscount + (Number(orderDiscount) || 0);
  const grandTotal = Math.max(0, Math.round((subtotal + totalTax - totalDiscount) * 100) / 100);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerId.trim()) {
      newErrors.customer_id = 'Please select an active customer.';
    }

    if (!orderDate.trim()) {
      newErrors.order_date = 'Order date is required.';
    }

    if (items.length === 0) {
      newErrors.items = 'At least one product line item is required.';
    }

    items.forEach((item, idx) => {
      if (!item.product_id) {
        newErrors[`item_${idx}_product`] = 'Product selection is required.';
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        newErrors[`item_${idx}_qty`] = 'Quantity must be greater than 0.';
      }
      if (item.unit_price !== undefined && item.unit_price < 0) {
        newErrors[`item_${idx}_price`] = 'Unit price cannot be negative.';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (targetStatus: SalesStatus) => {
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const payload: ISalesOrderFormData = {
        customer_id: customerId,
        order_date: orderDate,
        notes: notes.trim() ? notes.trim() : null,
        status: targetStatus,
        tax: Number(orderTax) || 0,
        discount: Number(orderDiscount) || 0,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price || 0),
          tax: Number(i.tax) || 0,
          discount: Number(i.discount) || 0,
          line_total: i.line_total,
        })),
      };

      if (isEditing && orderToEdit) {
        await salesService.updateSale(orderToEdit.id, payload);
        onSuccess(`Sales order #${orderToEdit.order_number} updated successfully.`);
      } else {
        const created = await salesService.createSale(payload);
        onSuccess(`Sales order #${created.order_number} created successfully.`);
      }
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save sales order.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isEditing ? `Edit Sales Order (${orderToEdit?.order_number})` : 'New Sales Order'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing
                  ? 'Update line items, pricing, or customer details for this draft order'
                  : 'Create a customer sales order with automatic pricing and inventory validation'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errors.form && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {isLoadingDropdowns ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500">
              <LoadingSpinner size="md" className="text-primary-600 mb-2" />
              <p className="text-xs">Loading active customers and products...</p>
            </div>
          ) : (
            <>
              {/* Order Metadata Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.customer_id
                        ? 'border-rose-500'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    <option value="">Select Active Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.customer_name} {c.company_name ? `(${c.company_name})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.customer_id && (
                    <p className="text-[11px] text-rose-500 mt-0.5">{errors.customer_id}</p>
                  )}
                </div>

                {/* Order Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Order Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {errors.order_date && (
                    <p className="text-[11px] text-rose-500 mt-0.5">{errors.order_date}</p>
                  )}
                </div>
              </div>

              {/* Line Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-primary-500" />
                    <span>Sales Order Items</span>
                    <span className="text-xs font-normal text-slate-400">({items.length} lines)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors border border-primary-200 dark:border-primary-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {errors.items && (
                  <p className="text-xs text-rose-500">{errors.items}</p>
                )}

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2.5 w-[35%]">Product</th>
                        <th className="px-3 py-2.5 w-[15%]">Quantity</th>
                        <th className="px-3 py-2.5 w-[15%]">Selling Price ($)</th>
                        <th className="px-3 py-2.5 w-[12%]">Tax ($)</th>
                        <th className="px-3 py-2.5 w-[12%]">Discount ($)</th>
                        <th className="px-3 py-2.5 w-[15%] text-right">Total ($)</th>
                        <th className="px-2 py-2.5 w-[5%] text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {items.map((item, idx) => {
                        const selectedProduct = products.find((p) => p.id === item.product_id);
                        const availableStock = selectedProduct ? selectedProduct.current_stock : null;
                        const isStockLow = availableStock !== null && item.quantity > availableStock;

                        return (
                          <tr key={item.tempId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            {/* Product */}
                            <td className="p-2.5">
                              <select
                                value={item.product_id}
                                onChange={(e) => handleItemProductChange(item.tempId, e.target.value)}
                                className={`w-full px-2 py-1.5 rounded border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${
                                  errors[`item_${idx}_product`]
                                    ? 'border-rose-500'
                                    : 'border-slate-300 dark:border-slate-600'
                                }`}
                              >
                                <option value="">Select Active Product</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.sku}) — Stock: {p.current_stock} {p.unit}
                                  </option>
                                ))}
                              </select>
                              {selectedProduct && (
                                <div className="flex items-center gap-2 mt-1 text-[11px]">
                                  <span className={isStockLow ? 'text-rose-500 font-semibold' : 'text-slate-400'}>
                                    Avail: {availableStock} {selectedProduct.unit}
                                  </span>
                                  {isStockLow && (
                                    <span className="text-rose-500 font-medium">
                                      ⚠️ Exceeds stock
                                    </span>
                                  )}
                                </div>
                              )}
                              {errors[`item_${idx}_product`] && (
                                <p className="text-[10px] text-rose-500 mt-0.5">
                                  {errors[`item_${idx}_product`]}
                                </p>
                              )}
                            </td>

                            {/* Quantity */}
                            <td className="p-2.5">
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    item.tempId,
                                    'quantity',
                                    Math.max(1, parseInt(e.target.value) || 0)
                                  )
                                }
                                className={`w-full px-2 py-1.5 rounded border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${
                                  errors[`item_${idx}_qty`] || isStockLow
                                    ? 'border-rose-500'
                                    : 'border-slate-300 dark:border-slate-600'
                                }`}
                              />
                              {errors[`item_${idx}_qty`] && (
                                <p className="text-[10px] text-rose-500 mt-0.5">
                                  {errors[`item_${idx}_qty`]}
                                </p>
                              )}
                            </td>

                            {/* Unit Price */}
                            <td className="p-2.5">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    item.tempId,
                                    'unit_price',
                                    Math.max(0, parseFloat(e.target.value) || 0)
                                  )
                                }
                                className={`w-full px-2 py-1.5 rounded border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${
                                  errors[`item_${idx}_price`]
                                    ? 'border-rose-500'
                                    : 'border-slate-300 dark:border-slate-600'
                                }`}
                              />
                            </td>

                            {/* Tax */}
                            <td className="p-2.5">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.tax || 0}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    item.tempId,
                                    'tax',
                                    Math.max(0, parseFloat(e.target.value) || 0)
                                  )
                                }
                                className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                              />
                            </td>

                            {/* Discount */}
                            <td className="p-2.5">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.discount || 0}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    item.tempId,
                                    'discount',
                                    Math.max(0, parseFloat(e.target.value) || 0)
                                  )
                                }
                                className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                              />
                            </td>

                            {/* Line Total */}
                            <td className="p-2.5 text-right font-semibold text-slate-800 dark:text-slate-200">
                              ${Number(item.line_total || 0).toFixed(2)}
                            </td>

                            {/* Delete row */}
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.tempId)}
                                disabled={items.length <= 1}
                                className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Notes & Summary Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sales Notes / Shipping Instructions
                  </label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter customer delivery notes, carrier instructions, or payment terms..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>

                {/* Calculation breakdown */}
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Additional Order Tax ($):</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={orderTax}
                      onChange={(e) => setOrderTax(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-24 px-2 py-1 text-right rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Order Discount ($):</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={orderDiscount}
                      onChange={(e) => setOrderDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-24 px-2 py-1 text-right rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm font-bold text-slate-900 dark:text-slate-100">
                    <span>Grand Total:</span>
                    <span className="text-primary-600 dark:text-primary-400 text-base">
                      ${grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {/* Save as Draft */}
            <button
              type="button"
              onClick={() => handleSubmit('DRAFT')}
              disabled={isSubmitting || isLoadingDropdowns}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>{isEditing ? 'Save Changes' : 'Save as Draft'}</span>
            </button>

            {/* Confirm Sales Order */}
            <button
              type="button"
              onClick={() => handleSubmit('CONFIRMED')}
              disabled={isSubmitting || isLoadingDropdowns}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="text-white" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
