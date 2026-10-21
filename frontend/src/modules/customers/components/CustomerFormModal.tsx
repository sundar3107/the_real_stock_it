import React, { useState, useEffect } from 'react';
import { ICustomer, ICustomerFormData } from '../types/customer.types';
import { customerService } from '../services/customerService';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { ErrorMessage } from '../../../components/common/ErrorMessage';
import { User, Building2, Mail, Phone, MapPin, FileText, CheckCircle2 } from 'lucide-react';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  customerToEdit?: ICustomer | null;
}

const INITIAL_FORM: ICustomerFormData = {
  customer_name: '',
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
  notes: '',
  status: 'ACTIVE',
};

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customerToEdit,
}) => {
  const isEditing = !!customerToEdit;
  const [formData, setFormData] = useState<ICustomerFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setApiError(null);
      if (customerToEdit) {
        setFormData({
          customer_name: customerToEdit.customer_name,
          company_name: customerToEdit.company_name || '',
          email: customerToEdit.email,
          phone: customerToEdit.phone,
          alternate_phone: customerToEdit.alternate_phone || '',
          address: customerToEdit.address,
          city: customerToEdit.city,
          state: customerToEdit.state,
          country: customerToEdit.country,
          postal_code: customerToEdit.postal_code,
          tax_number: customerToEdit.tax_number || '',
          notes: customerToEdit.notes || '',
          status: customerToEdit.status,
        });
      } else {
        setFormData(INITIAL_FORM);
      }
    }
  }, [isOpen, customerToEdit]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const hasName = formData.customer_name.trim().length > 0;
    const hasCompany = (formData.company_name || '').trim().length > 0;

    if (!hasName && !hasCompany) {
      newErrors.customer_name = 'Customer name or company name is required.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Primary phone number is required.';
    } else if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,20}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please provide a valid phone number format.';
    }

    if (formData.alternate_phone && formData.alternate_phone.trim()) {
      if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,20}$/.test(formData.alternate_phone.trim())) {
        newErrors.alternate_phone = 'Please provide a valid alternate phone number format.';
      }
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Street/delivery address is required.';
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
      newErrors.postal_code = 'Postal / ZIP code is required.';
    } else if (formData.postal_code.trim().length < 3) {
      newErrors.postal_code = 'Postal code must be at least 3 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      setApiError(null);

      // If customer_name is empty but company is filled, autofill customer_name
      const submissionData = { ...formData };
      if (!submissionData.customer_name.trim() && submissionData.company_name?.trim()) {
        submissionData.customer_name = submissionData.company_name.trim();
      }

      if (isEditing && customerToEdit) {
        await customerService.updateCustomer(customerToEdit.id, submissionData);
        onSuccess(`Customer '${submissionData.customer_name}' updated successfully.`);
      } else {
        await customerService.createCustomer(submissionData);
        onSuccess(`Customer '${submissionData.customer_name}' registered successfully.`);
      }

      onClose();
    } catch (err: any) {
      if (err.errors) {
        setErrors(err.errors);
      }
      setApiError(err.message || 'An error occurred while saving the customer record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Customer Details' : 'Register New Customer'}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && <ErrorMessage message={apiError} />}

        {/* Identity & Company */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="e.g. Priya Sharma"
                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.customer_name ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.customer_name && (
              <p className="text-xs text-red-500 mt-1">{errors.customer_name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Company Name (Optional)
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.company_name || ''}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="e.g. Apex Retail Solutions"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Contact info: Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. priya.sharma@apexretail.local"
                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Primary Phone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +91 98450 12345"
                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>
        </div>

        {/* Alternate Phone & Tax/GST */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alternate Phone (Optional)
            </label>
            <input
              type="text"
              value={formData.alternate_phone || ''}
              onChange={(e) => setFormData({ ...formData, alternate_phone: e.target.value })}
              placeholder="e.g. +91 98450 12346"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.alternate_phone ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
              }`}
            />
            {errors.alternate_phone && (
              <p className="text-xs text-red-500 mt-1">{errors.alternate_phone}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tax / GST Number (Optional)
            </label>
            <input
              type="text"
              value={formData.tax_number || ''}
              onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
              placeholder="e.g. 29AAAAA0000A1Z5"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Street Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Street Address / Delivery Premise <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Building, street, landmark, area..."
              className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.address ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
              }`}
            />
          </div>
          {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
        </div>

        {/* City, State, Country, Postal Code */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Bengaluru"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.city ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
              }`}
            />
            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              State <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="Karnataka"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.state ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
              }`}
            />
            {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="India"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.country ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
              }`}
            />
            {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Postal Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              placeholder="560025"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.postal_code ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
              }`}
            />
            {errors.postal_code && (
              <p className="text-xs text-red-500 mt-1">{errors.postal_code}</p>
            )}
          </div>
        </div>

        {/* Status & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Status
            </label>
            <Select
              value={formData.status || 'ACTIVE'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              options={[
                { value: 'ACTIVE', label: 'ACTIVE' },
                { value: 'INACTIVE', label: 'INACTIVE' },
              ]}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Notes / Terms (Optional)
            </label>
            <input
              type="text"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Payment terms, shipping preferences, credit limits..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Register Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
