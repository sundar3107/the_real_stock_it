import { ICreateCategoryDto, ICreateProductDto, IUpdateCategoryDto, IUpdateProductDto } from '../types/product.types';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export class ProductValidator {
  /**
   * Validate new product creation payload
   */
  static validateCreate(data: ICreateProductDto): ValidationResult {
    const errors: Record<string, string> = {};

    // Product Name
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.name = 'Product name cannot be empty';
    } else if (data.name.trim().length < 2) {
      errors.name = 'Product name must be at least 2 characters';
    }

    // SKU
    if (!data.sku || typeof data.sku !== 'string' || data.sku.trim() === '') {
      errors.sku = 'SKU cannot be empty';
    } else if (data.sku.trim().length < 2) {
      errors.sku = 'SKU must be at least 2 characters';
    }

    // Category
    if (!data.category_id || typeof data.category_id !== 'string' || data.category_id.trim() === '') {
      errors.category_id = 'A product category must be selected';
    }

    // Purchase Price
    if (data.purchase_price === undefined || data.purchase_price === null || isNaN(Number(data.purchase_price))) {
      errors.purchase_price = 'Purchase price must be a valid number';
    } else if (Number(data.purchase_price) < 0) {
      errors.purchase_price = 'Purchase price cannot be negative';
    }

    // Selling Price
    if (data.selling_price === undefined || data.selling_price === null || isNaN(Number(data.selling_price))) {
      errors.selling_price = 'Selling price must be a valid number';
    } else if (Number(data.selling_price) < 0) {
      errors.selling_price = 'Selling price cannot be negative';
    }

    // Opening Stock
    if (data.opening_stock !== undefined && data.opening_stock !== null) {
      if (isNaN(Number(data.opening_stock)) || Number(data.opening_stock) < 0) {
        errors.opening_stock = 'Opening stock quantity cannot be negative';
      }
    }

    // Reorder Level
    if (data.reorder_level !== undefined && data.reorder_level !== null) {
      if (isNaN(Number(data.reorder_level)) || Number(data.reorder_level) < 0) {
        errors.reorder_level = 'Reorder level cannot be negative';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate product update payload
   */
  static validateUpdate(data: IUpdateProductDto): ValidationResult {
    const errors: Record<string, string> = {};

    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim() === '') {
        errors.name = 'Product name cannot be empty';
      } else if (data.name.trim().length < 2) {
        errors.name = 'Product name must be at least 2 characters';
      }
    }

    if (data.sku !== undefined) {
      if (typeof data.sku !== 'string' || data.sku.trim() === '') {
        errors.sku = 'SKU cannot be empty';
      } else if (data.sku.trim().length < 2) {
        errors.sku = 'SKU must be at least 2 characters';
      }
    }

    if (data.category_id !== undefined) {
      if (typeof data.category_id !== 'string' || data.category_id.trim() === '') {
        errors.category_id = 'Category ID cannot be empty';
      }
    }

    if (data.purchase_price !== undefined) {
      if (isNaN(Number(data.purchase_price)) || Number(data.purchase_price) < 0) {
        errors.purchase_price = 'Purchase price must be a non-negative number';
      }
    }

    if (data.selling_price !== undefined) {
      if (isNaN(Number(data.selling_price)) || Number(data.selling_price) < 0) {
        errors.selling_price = 'Selling price must be a non-negative number';
      }
    }

    if (data.reorder_level !== undefined) {
      if (isNaN(Number(data.reorder_level)) || Number(data.reorder_level) < 0) {
        errors.reorder_level = 'Reorder level cannot be negative';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate category creation payload
   */
  static validateCategoryCreate(data: ICreateCategoryDto): ValidationResult {
    const errors: Record<string, string> = {};

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.name = 'Category name cannot be empty';
    } else if (data.name.trim().length < 2) {
      errors.name = 'Category name must be at least 2 characters';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate category update payload
   */
  static validateCategoryUpdate(data: IUpdateCategoryDto): ValidationResult {
    const errors: Record<string, string> = {};

    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim() === '') {
        errors.name = 'Category name cannot be empty';
      } else if (data.name.trim().length < 2) {
        errors.name = 'Category name must be at least 2 characters';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}
