import React, { useState, useEffect } from 'react';
import { ISupplier, ISupplierFormData } from '../types/supplier.types';
import { supplierService } from '../services/supplierService';
import { X, Building2, AlertCircle, Save, CheckCircle2 } from 'lucide-react';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplierToEdit?: ISupplier | null;
}

const INITIAL_FORM: ISupplierFormData = {
  supplier_name: '',
  company_name: '',
  email: '',
  phone: '',
  alternate_phone: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  postal_code: '',
  tax_number: '',
  contact_person: '',
  notes: '',
  status: 'ACTIVE',
};

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  supplierToEdit,
}) => {
  const isEditing = !!supplierToEdit;
  const [formData, setFormData] = useState<ISupplierFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setApiError(null);
      if (supplierToEdit) {
        setFormData({
          supplier_name: supplierToEdit.supplier_name,
          company_name: supplierToEdit.company_name,
          email: supplierToEdit.email,
          phone: supplierToEdit.phone,
          alternate_phone: supplierToEdit.alternate_phone || '',
          address: supplierToEdit.address,
          city: supplierToEdit.city,
          state: supplierToEdit.state,
          country: supplierToEdit.country,
          postal_code: supplierToEdit.postal_code,
          tax_number: supplierToEdit.tax_number || '',
          contact_person: supplierToEdit.contact_person,
          notes: supplierToEdit.notes || '',
          status: supplierToEdit.status,
        });
      } else {
        setFormData(INITIAL_FORM);
      }
    }
  }, [isOpen, supplierToEdit]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.supplier_name.trim()) {
      newErrors.supplier_name = 'Supplier display name is required.';
    }
    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company legal/registered name is required.';
    }
    if (!formData.contact_person.trim()) {
      newErrors.contact_person = 'Contact person name is required.';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address.';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Primary phone number is required.';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Street/premise address is required.';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required.';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required.';
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required.';
    }
    if (!formData.postal_code.trim()) {
      newErrors.postal_code = 'Postal code is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      if (isEditing && supplierToEdit) {
        await supplierService.updateSupplier(supplierToEdit.id, formData);
      } else {
        await supplierService.createSupplier(formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.errors) {
        setErrors(err.errors);
      }
      setApiError(err.message || 'An error occurred while saving supplier details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Supplier Details' : 'Register New Supplier'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? `Update vendor profile for ${supplierToEdit?.supplier_name}`
                  : 'Add a new authorized vendor / supplier to the system'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global API Error */}
        {apiError && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Basic Identification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Supplier Display Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                placeholder="e.g. Prime Tech Supplies"
                className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                  errors.supplier_name
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.supplier_name && (
                <p className="text-xs text-rose-600 mt-1">{errors.supplier_name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Company Legal Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="e.g. Prime Technologies Pvt Ltd"
                className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                  errors.company_name
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.company_name && (
                <p className="text-xs text-rose-600 mt-1">{errors.company_name}</p>
              )}
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Contact Person <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="e.g. Rajesh Sharma"
                className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                  errors.contact_person
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.contact_person && (
                <p className="text-xs text-rose-600 mt-1">{errors.contact_person}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. sales@primetech.local"
                className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                  errors.email ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Primary Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                  errors.phone ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.phone && <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Optional Alternate Phone & Tax Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Alternate Phone (Optional)
              </label>
              <input
                type="text"
                value={formData.alternate_phone || ''}
                onChange={(e) => setFormData({ ...formData, alternate_phone: e.target.value })}
                placeholder="e.g. +91 98765 43211"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tax / GST / VAT Number
              </label>
              <input
                type="text"
                value={formData.tax_number || ''}
                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                placeholder="e.g. 29ABCDE1234F1Z5"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">ACTIVE (Authorized for Purchases)</option>
                <option value="INACTIVE">INACTIVE (Deactivated)</option>
              </select>
            </div>
          </div>

          {/* Address Fields */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Street / Facility Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. 42 Industrial Park, Outer Ring Road"
              className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                errors.address ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-blue-500'
              }`}
            />
            {errors.address && <p className="text-xs text-rose-600 mt-1">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                City <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Bengaluru"
                className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                  errors.city ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.city && <p className="text-xs text-rose-600 mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                State <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Karnataka"
                className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                  errors.state ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.state && <p className="text-xs text-rose-600 mt-1">{errors.state}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Country <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g. India"
                className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                  errors.country ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.country && <p className="text-xs text-rose-600 mt-1">{errors.country}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Postal / ZIP Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="e.g. 560100"
                className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                  errors.postal_code
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.postal_code && (
                <p className="text-xs text-rose-600 mt-1">{errors.postal_code}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Procurement & Vendor Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Preferred delivery slots, credit terms (Net 30), minimum order quantities..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  {isEditing ? 'Update Supplier' : 'Save Supplier'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
