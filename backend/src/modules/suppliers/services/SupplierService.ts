import { AppError } from '../../authentication/services/AuthService';
import { SupplierModel } from '../models/Supplier';
import { SupplierProductModel } from '../models/SupplierProduct';
import { ProductModel } from '../../products/models/Product';
import {
  ISupplier,
  ISupplierFilterQuery,
  ISupplierFormData,
  ISupplierMetrics,
  ISupplierProduct,
  SupplierStatus,
} from '../types/supplier.types';
import { validateSupplierData, validateStatusTransition } from '../validators/supplierValidators';

export class SupplierService {
  static getSuppliers(query: ISupplierFilterQuery = {}) {
    return SupplierModel.findWithPagination(query);
  }

  static getSupplierById(id: string): ISupplier & { products: ISupplierProduct[]; purchase_history: any[] } {
    const supplier = SupplierModel.findById(id);
    if (!supplier) {
      throw new AppError(`Supplier with ID '${id}' not found.`, 404);
    }

    const products = SupplierProductModel.getProductsBySupplierId(id);

    return {
      ...supplier,
      products,
      // Future integration placeholder for Purchase Management
      purchase_history: [],
    };
  }

  static createSupplier(data: ISupplierFormData): ISupplier {
    const validation = validateSupplierData(data, false);
    if (!validation.isValid) {
      throw new AppError('Validation failed for supplier creation.', 400, validation.errors);
    }

    // Check duplicate email
    const existingEmail = SupplierModel.findByEmail(data.email);
    if (existingEmail) {
      throw new AppError(`A supplier with email '${data.email}' already exists.`, 409, {
        email: 'Email address is already registered to another supplier.',
      });
    }

    return SupplierModel.create(data);
  }

  static updateSupplier(id: string, data: Partial<ISupplierFormData>): ISupplier {
    const existing = SupplierModel.findById(id);
    if (!existing) {
      throw new AppError(`Supplier with ID '${id}' not found.`, 404);
    }

    const validation = validateSupplierData(data, true);
    if (!validation.isValid) {
      throw new AppError('Validation failed for supplier update.', 400, validation.errors);
    }

    // Check duplicate email if changing email
    if (data.email && data.email.trim().toLowerCase() !== existing.email.toLowerCase()) {
      const emailTaken = SupplierModel.findByEmail(data.email);
      if (emailTaken && emailTaken.id !== id) {
        throw new AppError(`Email '${data.email}' is already in use by another supplier.`, 409, {
          email: 'Email address is already registered to another supplier.',
        });
      }
    }

    const updated = SupplierModel.update(id, data);
    if (!updated) {
      throw new AppError(`Failed to update supplier with ID '${id}'.`, 500);
    }

    return updated;
  }

  static updateStatus(id: string, status: SupplierStatus): ISupplier {
    const validation = validateStatusTransition(status);
    if (!validation.isValid) {
      throw new AppError('Invalid status value.', 400, validation.errors);
    }

    const existing = SupplierModel.findById(id);
    if (!existing) {
      throw new AppError(`Supplier with ID '${id}' not found.`, 404);
    }

    const updated = SupplierModel.updateStatus(id, status);
    if (!updated) {
      throw new AppError(`Failed to update status for supplier '${id}'.`, 500);
    }

    return updated;
  }

  static deleteSupplier(id: string): { message: string; supplier: ISupplier } {
    const existing = SupplierModel.findById(id);
    if (!existing) {
      throw new AppError(`Supplier with ID '${id}' not found.`, 404);
    }

    // Prefer soft-deactivation to preserve SCM auditability and future purchase history
    const deactivated = SupplierModel.updateStatus(id, 'INACTIVE');
    return {
      message: `Supplier '${existing.supplier_name}' has been deactivated.`,
      supplier: deactivated!,
    };
  }

  static getSupplierProducts(supplierId: string): ISupplierProduct[] {
    const existing = SupplierModel.findById(supplierId);
    if (!existing) {
      throw new AppError(`Supplier with ID '${supplierId}' not found.`, 404);
    }

    return SupplierProductModel.getProductsBySupplierId(supplierId);
  }

  static associateProducts(supplierId: string, productIds: string[]): ISupplierProduct[] {
    const supplier = SupplierModel.findById(supplierId);
    if (!supplier) {
      throw new AppError(`Supplier with ID '${supplierId}' not found.`, 404);
    }

    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new AppError('Please provide an array of product IDs to associate.', 400);
    }

    for (const prodId of productIds) {
      const prod = ProductModel.findById(prodId);
      if (!prod) {
        throw new AppError(`Product with ID '${prodId}' not found.`, 404);
      }
      SupplierProductModel.associateProduct(supplierId, prodId);
    }

    return SupplierProductModel.getProductsBySupplierId(supplierId);
  }

  static disassociateProduct(supplierId: string, productId: string): { success: boolean; message: string } {
    const supplier = SupplierModel.findById(supplierId);
    if (!supplier) {
      throw new AppError(`Supplier with ID '${supplierId}' not found.`, 404);
    }

    const removed = SupplierProductModel.disassociateProduct(supplierId, productId);
    if (!removed) {
      throw new AppError(`Product association not found for product '${productId}'.`, 404);
    }

    return {
      success: true,
      message: 'Product disassociated from supplier successfully.',
    };
  }

  static getMetrics(): ISupplierMetrics {
    return SupplierModel.getMetrics();
  }
}
