import { AppError } from '../../authentication/services/AuthService';
import { IInvoiceFormData, InvoiceStatus } from '../types/invoice.types';

export function validateInvoice(data: IInvoiceFormData, isGeneratingFromSales: boolean = false): void {
  if (!data.customer_id || typeof data.customer_id !== 'string' || !data.customer_id.trim()) {
    throw new AppError('Customer ID is required.', 400);
  }

  if (data.invoice_date && isNaN(Date.parse(data.invoice_date))) {
    throw new AppError('Invalid invoice date format. Expected YYYY-MM-DD.', 400);
  }

  if (data.due_date && isNaN(Date.parse(data.due_date))) {
    throw new AppError('Invalid due date format. Expected YYYY-MM-DD.', 400);
  }

  if (data.invoice_date && data.due_date) {
    const invDate = new Date(data.invoice_date).getTime();
    const dueDate = new Date(data.due_date).getTime();
    if (dueDate < invDate) {
      throw new AppError('Due date cannot be earlier than invoice date.', 400);
    }
  }

  if (!isGeneratingFromSales) {
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new AppError('Invoice must contain at least one line item.', 400);
    }

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item.description || !item.description.trim()) {
        throw new AppError(`Item #${i + 1} must include a valid description.`, 400);
      }
      if (item.quantity === undefined || Number(item.quantity) <= 0 || !Number.isInteger(Number(item.quantity))) {
        throw new AppError(`Item #${i + 1} must have a positive integer quantity greater than zero.`, 400);
      }
      if (item.unit_price !== undefined && Number(item.unit_price) < 0) {
        throw new AppError(`Item #${i + 1} cannot have a negative unit price.`, 400);
      }
      if (item.tax !== undefined && Number(item.tax) < 0) {
        throw new AppError(`Item #${i + 1} cannot have negative tax.`, 400);
      }
      if (item.discount !== undefined && Number(item.discount) < 0) {
        throw new AppError(`Item #${i + 1} cannot have negative discount.`, 400);
      }
    }
  }

  if (data.tax !== undefined && Number(data.tax) < 0) {
    throw new AppError('Order-level tax cannot be negative.', 400);
  }

  if (data.discount !== undefined && Number(data.discount) < 0) {
    throw new AppError('Order-level discount cannot be negative.', 400);
  }
}

export function validateStatusTransition(currentStatus: InvoiceStatus, newStatus: InvoiceStatus): void {
  if (currentStatus === newStatus) {
    return;
  }

  const validTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
    DRAFT: ['ISSUED', 'CANCELLED'],
    ISSUED: ['PAID', 'PARTIALLY_PAID', 'CANCELLED'],
    PARTIALLY_PAID: ['PAID', 'CANCELLED'],
    PAID: [],
    CANCELLED: [],
  };

  const allowed = validTransitions[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(
      `Invalid invoice status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${
        allowed.length > 0 ? allowed.join(', ') : 'None (Terminal status)'
      }`,
      400
    );
  }
}
