import {
  ISalesOrderFormData,
  SalesStatus,
} from '../types/sales.types';

export interface IValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

const VALID_STATUSES: SalesStatus[] = [
  'DRAFT',
  'CONFIRMED',
  'PROCESSING',
  'COMPLETED',
  'CANCELLED',
];

export function validateSalesOrder(
  data: Partial<ISalesOrderFormData>,
  isUpdate = false
): IValidationResult {
  const errors: Record<string, string> = {};

  if (!isUpdate || data.customer_id !== undefined) {
    if (!data.customer_id || typeof data.customer_id !== 'string' || !data.customer_id.trim()) {
      errors.customer_id = 'A valid customer must be selected.';
    }
  }

  if (!isUpdate || data.items !== undefined) {
    if (!Array.isArray(data.items) || data.items.length === 0) {
      errors.items = 'Sales order must contain at least one product line item.';
    } else {
      data.items.forEach((item, index) => {
        if (!item.product_id || typeof item.product_id !== 'string' || !item.product_id.trim()) {
          errors[`item_${index}_product`] = `Item #${index + 1}: Product is required.`;
        }
        if (item.quantity === undefined || item.quantity === null || Number(item.quantity) <= 0) {
          errors[`item_${index}_quantity`] = `Item #${index + 1}: Quantity must be greater than zero.`;
        }
        if (item.unit_price !== undefined && item.unit_price !== null && Number(item.unit_price) < 0) {
          errors[`item_${index}_price`] = `Item #${index + 1}: Unit price cannot be negative.`;
        }
        if (item.tax !== undefined && Number(item.tax) < 0) {
          errors[`item_${index}_tax`] = `Item #${index + 1}: Tax amount cannot be negative.`;
        }
        if (item.discount !== undefined && Number(item.discount) < 0) {
          errors[`item_${index}_discount`] = `Item #${index + 1}: Discount cannot be negative.`;
        }
      });
    }
  }

  if (data.status !== undefined) {
    if (!VALID_STATUSES.includes(data.status)) {
      errors.status = `Status must be one of: ${VALID_STATUSES.join(', ')}.`;
    }
  }

  if (data.tax !== undefined && Number(data.tax) < 0) {
    errors.tax = 'Order tax amount cannot be negative.';
  }

  if (data.discount !== undefined && Number(data.discount) < 0) {
    errors.discount = 'Order discount cannot be negative.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateStatusTransition(
  currentStatus: SalesStatus,
  newStatus: SalesStatus
): IValidationResult {
  const errors: Record<string, string> = {};

  if (!VALID_STATUSES.includes(newStatus)) {
    errors.status = `Invalid target status '${newStatus}'.`;
    return { isValid: false, errors };
  }

  if (currentStatus === newStatus) {
    return { isValid: true, errors: {} };
  }

  // Terminal state checks
  if (currentStatus === 'COMPLETED') {
    errors.status = 'Cannot change status of an already COMPLETED sales order (inventory has already been deducted).';
    return { isValid: false, errors };
  }

  if (currentStatus === 'CANCELLED') {
    errors.status = 'Cannot change status of a CANCELLED sales order.';
    return { isValid: false, errors };
  }

  // Allowed transitions map
  const allowedTransitions: Record<SalesStatus, SalesStatus[]> = {
    DRAFT: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'COMPLETED', 'CANCELLED'],
    PROCESSING: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  const allowed = allowedTransitions[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    errors.status = `Cannot transition sales order from '${currentStatus}' to '${newStatus}'. Permitted transitions: ${allowed.join(', ') || 'None'}.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
