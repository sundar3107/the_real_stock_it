import { AppError } from '../../authentication/services/AuthService';
import { CustomerModel } from '../models/Customer';
import {
  ICustomer,
  ICustomerDetail,
  ICustomerFilterQuery,
  ICustomerFormData,
  ICustomerMetrics,
  CustomerStatus,
} from '../types/customer.types';
import { validateCustomerData, validateStatusTransition } from '../validators/customerValidators';

export class CustomerService {
  static getCustomers(query: ICustomerFilterQuery = {}) {
    return CustomerModel.findWithPagination(query);
  }

  static getCustomerById(id: string): ICustomerDetail {
    const customer = CustomerModel.findById(id);
    if (!customer) {
      throw new AppError(`Customer with ID '${id}' not found.`, 404);
    }

    return {
      ...customer,
      // Future integration placeholders for Sales Management and Billing (Module 7 & 8)
      sales_history: [],
      orders: [],
      invoices: [],
    };
  }

  static createCustomer(data: ICustomerFormData): ICustomer {
    // If only company name was provided, populate customer_name
    if ((!data.customer_name || !data.customer_name.trim()) && data.company_name && data.company_name.trim()) {
      data.customer_name = data.company_name.trim();
    }

    const validation = validateCustomerData(data, false);
    if (!validation.isValid) {
      throw new AppError('Validation failed for customer creation.', 400, validation.errors);
    }

    // Check duplicate email
    const existingEmail = CustomerModel.findByEmail(data.email);
    if (existingEmail) {
      throw new AppError(`A customer with email '${data.email}' already exists.`, 409, {
        email: 'Email address is already registered to another customer.',
      });
    }

    return CustomerModel.create(data);
  }

  static updateCustomer(id: string, data: Partial<ICustomerFormData>): ICustomer {
    const existing = CustomerModel.findById(id);
    if (!existing) {
      throw new AppError(`Customer with ID '${id}' not found.`, 404);
    }

    const validation = validateCustomerData(data, true);
    if (!validation.isValid) {
      throw new AppError('Validation failed for customer update.', 400, validation.errors);
    }

    // Check duplicate email if changing email
    if (data.email && data.email.trim().toLowerCase() !== existing.email.toLowerCase()) {
      const emailTaken = CustomerModel.findByEmail(data.email);
      if (emailTaken && emailTaken.id !== id) {
        throw new AppError(`Email '${data.email}' is already in use by another customer.`, 409, {
          email: 'Email address is already registered to another customer.',
        });
      }
    }

    const updated = CustomerModel.update(id, data);
    if (!updated) {
      throw new AppError(`Failed to update customer with ID '${id}'.`, 500);
    }

    return updated;
  }

  static updateStatus(id: string, status: CustomerStatus): ICustomer {
    const validation = validateStatusTransition(status);
    if (!validation.isValid) {
      throw new AppError('Invalid status value.', 400, validation.errors);
    }

    const existing = CustomerModel.findById(id);
    if (!existing) {
      throw new AppError(`Customer with ID '${id}' not found.`, 404);
    }

    const updated = CustomerModel.updateStatus(id, status);
    if (!updated) {
      throw new AppError(`Failed to update status for customer '${id}'.`, 500);
    }

    return updated;
  }

  static deleteCustomer(id: string): { message: string; customer: ICustomer } {
    const existing = CustomerModel.findById(id);
    if (!existing) {
      throw new AppError(`Customer with ID '${id}' not found.`, 404);
    }

    // Soft-deactivation avoids breaking future sales orders, invoices, and transaction ledger
    const deactivated = CustomerModel.updateStatus(id, 'INACTIVE');
    return {
      message: `Customer '${existing.customer_name}' has been deactivated.`,
      customer: deactivated!,
    };
  }

  static getMetrics(): ICustomerMetrics {
    return CustomerModel.getMetrics();
  }
}
