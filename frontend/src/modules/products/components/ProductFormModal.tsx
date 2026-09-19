import React, { useState, useEffect, FormEvent } from 'react';
import { ICategory, IProduct, IProductFormData } from '../types/product.types';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Button } from '../../../components/common/Button';
import { ErrorMessage } from '../../../components/common/ErrorMessage';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IProductFormData) => Promise<void>;
  product?: IProduct | null;
  categories: ICategory[];
  isLoading: boolean;
  onOpenCategoryManager?: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  product,
  categories,
  isLoading,
  onOpenCategoryManager,
}) => {
  const isEditing = !!product;

  const [formData, setFormData] = useState<IProductFormData>({
    name: '',
    sku: '',
    category_id: '',
    description: '',
    unit: 'pcs',
    purchase_price: '',
    selling_price: '',
    opening_stock: '',
    reorder_level: '10',
    status: 'ACTIVE',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        category_id: product.category_id,
        description: product.description || '',
        unit: product.unit,
        purchase_price: product.purchase_price,
        selling_price: product.selling_price,
        opening_stock: product.opening_stock,
        reorder_level: product.reorder_level,
        status: product.status,
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        category_id: categories.length > 0 ? categories[0].id : '',
        description: '',
        unit: 'pcs',
        purchase_price: '',
        selling_price: '',
        opening_stock: '0',
        reorder_level: '10',
        status: 'ACTIVE',
      });
    }
    setFormErrors({});
    setGeneralError(null);
  }, [product, categories, isOpen]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Product name must be at least 2 characters';
    }

    if (!formData.sku.trim()) {
      errors.sku = 'SKU is required';
    } else if (formData.sku.trim().length < 2) {
      errors.sku = 'SKU must be at least 2 characters';
    }

    if (!formData.category_id) {
      errors.category_id = 'Please select a category';
    }

    if (formData.purchase_price === '' || isNaN(Number(formData.purchase_price)) || Number(formData.purchase_price) < 0) {
      errors.purchase_price = 'Enter a valid purchase price (>= 0)';
    }

    if (formData.selling_price === '' || isNaN(Number(formData.selling_price)) || Number(formData.selling_price) < 0) {
      errors.selling_price = 'Enter a valid selling price (>= 0)';
    }

    if (formData.reorder_level !== undefined && (isNaN(Number(formData.reorder_level)) || Number(formData.reorder_level) < 0)) {
      errors.reorder_level = 'Reorder level cannot be negative';
    }

    if (!isEditing && formData.opening_stock !== undefined && (isNaN(Number(formData.opening_stock)) || Number(formData.opening_stock) < 0)) {
      errors.opening_stock = 'Opening stock cannot be negative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) return;

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to save product');
      if (err.errors) {
        setFormErrors((prev) => ({ ...prev, ...err.errors }));
      }
    }
  };

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  const unitOptions = [
    { value: 'pcs', label: 'Pieces (pcs)' },
    { value: 'box', label: 'Box' },
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'm', label: 'Meters (m)' },
    { value: 'ltr', label: 'Liters (ltr)' },
    { value: 'set', label: 'Set' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Product: ${product?.name}` : 'Add New Product'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <ErrorMessage message={generalError} onDismiss={() => setGeneralError(null)} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Product Name *"
            placeholder="e.g., Wireless Ergonomic Keyboard"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            disabled={isLoading}
            required
          />

          <Input
            label="SKU (Stock Keeping Unit) *"
            placeholder="e.g., KB-ERG-001"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            error={formErrors.sku}
            disabled={isLoading}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Category *</label>
              {onOpenCategoryManager && (
                <button
                  type="button"
                  onClick={onOpenCategoryManager}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Manage Categories
                </button>
              )}
            </div>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg transition shadow-sm focus:outline-none focus:ring-2 ${
                formErrors.category_id
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-200 text-red-900'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100 text-slate-900'
              }`}
              disabled={isLoading}
            >
              <option value="">-- Select Category --</option>
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {formErrors.category_id && (
              <p className="mt-1 text-xs text-red-600">{formErrors.category_id}</p>
            )}
          </div>

          <Select
            label="Measurement Unit"
            options={unitOptions}
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Purchase Price (Cost ₹) *"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.purchase_price}
            onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
            error={formErrors.purchase_price}
            disabled={isLoading}
            required
          />

          <Input
            label="Selling Price (MSRP ₹) *"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.selling_price}
            onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
            error={formErrors.selling_price}
            disabled={isLoading}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!isEditing ? (
            <Input
              label="Opening Stock"
              type="number"
              min="0"
              placeholder="Initial units"
              value={formData.opening_stock}
              onChange={(e) => setFormData({ ...formData, opening_stock: e.target.value })}
              error={formErrors.opening_stock}
              disabled={isLoading}
              helperText="Initial stock baseline before transactions"
            />
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
              <span className="font-semibold text-slate-700 block mb-0.5">Current Stock Balance</span>
              <span>{product?.current_stock} {product?.unit} (Managed via Inventory Module)</span>
            </div>
          )}

          <Input
            label="Reorder Level (Alert Threshold)"
            type="number"
            min="0"
            placeholder="10"
            value={formData.reorder_level}
            onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
            error={formErrors.reorder_level}
            disabled={isLoading}
            helperText="Triggers low stock alert when inventory reaches this level"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            rows={2}
            placeholder="Product specifications, notes, supplier reference..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Catalog Status"
            options={[
              { value: 'ACTIVE', label: 'Active (Available for transactions)' },
              { value: 'INACTIVE', label: 'Inactive (Archived / Deactivated)' },
            ]}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
