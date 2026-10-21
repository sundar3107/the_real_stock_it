import {
  IPurchaseOrderFormData,
  IReceivePurchaseDto,
  PurchaseStatus,
} from '../types/purchase.types';

export interface IValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

const VALID_STATUSES: PurchaseStatus[] = [
  'DRAFT',
  'ORDERED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED',
];

export function validatePurchaseOrder(
  data: Partial<IPurchaseOrderFormData>,
  isUpdate = false
): IValidationResult {
  const errors: Record<string, string> = {};

  if (!isUpdate || data.supplier_id !== undefined) {
    if (!data.supplier_id || typeof data.supplier_id !== 'string' || !data.supplier_id.trim()) {
      errors.supplier_id = 'A valid supplier must be selected.';
    }
  }

  if (!isUpdate || data.items !== undefined) {
    if (!Array.isArray(data.items) || data.items.length === 0) {
      errors.items = 'Purchase order must contain at least one line item.';
    } else {
      data.items.forEach((item, index) => {
        if (!item.product_id || typeof item.product_id !== 'string' || !item.product_id.trim()) {
          errors[`item_${index}_product`] = `Item #${index + 1}: Product is required.`;
        }
        if (item.quantity === undefined || item.quantity === null || Number(item.quantity) <= 0) {
          errors[`item_${index}_quantity`] = `Item #${index + 1}: Quantity must be greater than zero.`;
        }
        if (item.unit_price === undefined || item.unit_price === null || Number(item.unit_price) < 0) {
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
  currentStatus: PurchaseStatus,
  newStatus: PurchaseStatus,
  hasReceivedItems = false
): IValidationResult {
  const errors: Record<string, string> = {};

  if (!VALID_STATUSES.includes(newStatus)) {
    errors.status = `Invalid target status '${newStatus}'.`;
    return { isValid: false, errors };
  }

  if (currentStatus === newStatus) {
    return { isValid: true, errors: {} };
  }

  if (currentStatus === 'CANCELLED') {
    errors.status = 'Cannot change status of a CANCELLED purchase order.';
  } else if (currentStatus === 'RECEIVED') {
    errors.status = 'Cannot change status of a completed (RECEIVED) purchase order.';
  } else if (newStatus === 'CANCELLED' && hasReceivedItems) {
    errors.status = 'Cannot cancel a purchase order that has already received physical stock.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateReceiveItems(dto: IReceivePurchaseDto): IValidationResult {
  const errors: Record<string, string> = {};

  if (!dto || !Array.isArray(dto.items) || dto.items.length === 0) {
    errors.items = 'Please specify at least one item to receive.';
  } else {
    dto.items.forEach((item, index) => {
      if (!item.item_id || typeof item.item_id !== 'string') {
        errors[`item_${index}_id`] = `Item #${index + 1}: Item identifier is required.`;
      }
      if (item.receive_quantity === undefined || Number(item.receive_quantity) <= 0) {
        errors[`item_${index}_qty`] = `Item #${index + 1}: Receive quantity must be greater than zero.`;
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
