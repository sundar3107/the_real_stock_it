import { IStockInDto, IStockOutDto, IStockAdjustmentDto } from '../types/inventory.types';
import { ValidationResult } from '../../products/validators/productValidators';

export class InventoryValidator {
  /**
   * Validate Stock IN payload
   */
  static validateStockIn(data: IStockInDto): ValidationResult {
    const errors: Record<string, string> = {};

    if (!data.product_id || typeof data.product_id !== 'string' || data.product_id.trim() === '') {
      errors.product_id = 'Product is required';
    }

    if (data.quantity === undefined || data.quantity === null || isNaN(Number(data.quantity))) {
      errors.quantity = 'Quantity must be a valid number';
    } else if (Number(data.quantity) <= 0) {
      errors.quantity = 'Received quantity must be greater than zero';
    } else if (!Number.isInteger(Number(data.quantity))) {
      errors.quantity = 'Quantity must be a whole integer';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate Stock OUT payload
   */
  static validateStockOut(data: IStockOutDto): ValidationResult {
    const errors: Record<string, string> = {};

    if (!data.product_id || typeof data.product_id !== 'string' || data.product_id.trim() === '') {
      errors.product_id = 'Product is required';
    }

    if (data.quantity === undefined || data.quantity === null || isNaN(Number(data.quantity))) {
      errors.quantity = 'Quantity must be a valid number';
    } else if (Number(data.quantity) <= 0) {
      errors.quantity = 'Issued quantity must be greater than zero';
    } else if (!Number.isInteger(Number(data.quantity))) {
      errors.quantity = 'Quantity must be a whole integer';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate Stock Adjustment payload
   */
  static validateAdjustment(data: IStockAdjustmentDto): ValidationResult {
    const errors: Record<string, string> = {};

    if (!data.product_id || typeof data.product_id !== 'string' || data.product_id.trim() === '') {
      errors.product_id = 'Product is required';
    }

    const validTypes = ['INCREASE', 'DECREASE', 'SET_QUANTITY'];
    if (!data.adjustment_type || !validTypes.includes(data.adjustment_type)) {
      errors.adjustment_type = 'Invalid adjustment type. Allowed: INCREASE, DECREASE, SET_QUANTITY';
    }

    if (data.quantity === undefined || data.quantity === null || isNaN(Number(data.quantity))) {
      errors.quantity = 'Quantity must be a valid number';
    } else if (Number(data.quantity) < 0) {
      errors.quantity = 'Quantity cannot be negative';
    } else if (data.adjustment_type !== 'SET_QUANTITY' && Number(data.quantity) === 0) {
      errors.quantity = 'Adjustment quantity must be greater than zero';
    } else if (!Number.isInteger(Number(data.quantity))) {
      errors.quantity = 'Quantity must be a whole integer';
    }

    if (!data.reason || typeof data.reason !== 'string' || data.reason.trim() === '') {
      errors.reason = 'A reason for stock adjustment is required for audit records';
    } else if (data.reason.trim().length < 3) {
      errors.reason = 'Reason must be at least 3 characters';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}
