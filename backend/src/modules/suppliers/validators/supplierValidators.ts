import { ISupplierFormData, SupplierStatus } from '../types/supplier.types';

export interface IValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,20}$/;

export function validateSupplierData(data: Partial<ISupplierFormData>, isUpdate = false): IValidationResult {
  const errors: Record<string, string> = {};

  if (!isUpdate || data.supplier_name !== undefined) {
    if (!data.supplier_name || typeof data.supplier_name !== 'string' || !data.supplier_name.trim()) {
      errors.supplier_name = 'Supplier display name is required.';
    } else if (data.supplier_name.trim().length < 2) {
      errors.supplier_name = 'Supplier name must be at least 2 characters long.';
    }
  }

  if (!isUpdate || data.company_name !== undefined) {
    if (!data.company_name || typeof data.company_name !== 'string' || !data.company_name.trim()) {
      errors.company_name = 'Company legal/registered name is required.';
    } else if (data.company_name.trim().length < 2) {
      errors.company_name = 'Company name must be at least 2 characters long.';
    }
  }

  if (!isUpdate || data.email !== undefined) {
    if (!data.email || typeof data.email !== 'string' || !data.email.trim()) {
      errors.email = 'Supplier email is required.';
    } else if (!EMAIL_REGEX.test(data.email.trim())) {
      errors.email = 'Please provide a valid email address (e.g. vendor@domain.com).';
    }
  }

  if (!isUpdate || data.phone !== undefined) {
    if (!data.phone || typeof data.phone !== 'string' || !data.phone.trim()) {
      errors.phone = 'Primary contact phone number is required.';
    } else if (!PHONE_REGEX.test(data.phone.trim())) {
      errors.phone = 'Please provide a valid phone number (e.g. +91 98765 43210).';
    }
  }

  if (data.alternate_phone && data.alternate_phone.trim()) {
    if (!PHONE_REGEX.test(data.alternate_phone.trim())) {
      errors.alternate_phone = 'Please provide a valid alternate phone number.';
    }
  }

  if (!isUpdate || data.contact_person !== undefined) {
    if (!data.contact_person || typeof data.contact_person !== 'string' || !data.contact_person.trim()) {
      errors.contact_person = 'Contact person name / designation is required.';
    } else if (data.contact_person.trim().length < 2) {
      errors.contact_person = 'Contact person must be at least 2 characters long.';
    }
  }

  if (!isUpdate || data.address !== undefined) {
    if (!data.address || typeof data.address !== 'string' || !data.address.trim()) {
      errors.address = 'Street/premise address is required.';
    }
  }

  if (!isUpdate || data.city !== undefined) {
    if (!data.city || typeof data.city !== 'string' || !data.city.trim()) {
      errors.city = 'City is required.';
    }
  }

  if (!isUpdate || data.state !== undefined) {
    if (!data.state || typeof data.state !== 'string' || !data.state.trim()) {
      errors.state = 'State / Province is required.';
    }
  }

  if (!isUpdate || data.country !== undefined) {
    if (!data.country || typeof data.country !== 'string' || !data.country.trim()) {
      errors.country = 'Country is required.';
    }
  }

  if (!isUpdate || data.postal_code !== undefined) {
    if (!data.postal_code || typeof data.postal_code !== 'string' || !data.postal_code.trim()) {
      errors.postal_code = 'Postal / ZIP code is required.';
    } else if (data.postal_code.trim().length < 3) {
      errors.postal_code = 'Postal code must be at least 3 characters long.';
    }
  }

  if (data.status !== undefined) {
    if (data.status !== 'ACTIVE' && data.status !== 'INACTIVE') {
      errors.status = "Status must be either 'ACTIVE' or 'INACTIVE'.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateStatusTransition(status: any): IValidationResult {
  const errors: Record<string, string> = {};
  if (!status || (status !== 'ACTIVE' && status !== 'INACTIVE')) {
    errors.status = "Status must be either 'ACTIVE' or 'INACTIVE'.";
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
