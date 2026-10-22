import { AppError } from '../../authentication/services/AuthService';
import { AuditService } from '../../audit/services/AuditService';
import { InvoiceModel } from '../models/Invoice';
import { InvoiceItemModel } from '../models/InvoiceItem';
import { CustomerModel } from '../../customers/models/Customer';
import { SalesOrderModel } from '../../sales/models/SalesOrder';
import { SalesOrderItemModel } from '../../sales/models/SalesOrderItem';
import { ProductModel } from '../../products/models/Product';
import {
  IInvoiceDetail,
  IInvoiceFilterQuery,
  IInvoiceFormData,
  IInvoiceItem,
  IInvoiceMetrics,
  InvoiceStatus,
} from '../types/invoice.types';
import { validateInvoice, validateStatusTransition } from '../validators/invoiceValidators';

export class InvoiceService {
  /**
   * Retrieve paginated invoices list with optional search and filters.
   */
  static getInvoices(query: IInvoiceFilterQuery = {}) {
    return InvoiceModel.findWithPagination(query);
  }

  /**
   * Retrieve complete invoice details by ID, including items, customer, and sales order info.
   */
  static getInvoiceById(id: string): IInvoiceDetail {
    const invoice = InvoiceModel.findById(id);
    if (!invoice) {
      throw new AppError(`Invoice with ID '${id}' not found.`, 404);
    }

    const items = InvoiceItemModel.findByInvoiceId(invoice.id);
    const customer = CustomerModel.findById(invoice.customer_id);

    let salesOrder: { id: string; order_number: string; order_date: string; status: string; total: number } | null = null;
    if (invoice.sales_order_id) {
      const so = SalesOrderModel.findById(invoice.sales_order_id);
      if (so) {
        salesOrder = {
          id: so.id,
          order_number: so.order_number,
          order_date: so.order_date,
          status: so.status,
          total: so.total,
        };
      }
    }

    return {
      ...invoice,
      items,
      customer: customer
        ? {
            id: customer.id,
            customer_name: customer.customer_name,
            company_name: customer.company_name,
            email: customer.email,
            phone: customer.phone,
            alternate_phone: customer.alternate_phone,
            address: customer.address,
            city: customer.city,
            state: customer.state,
            country: customer.country,
            postal_code: customer.postal_code,
            tax_number: customer.tax_number,
          }
        : null,
      sales_order: salesOrder,
    };
  }

  /**
   * Preview draft invoice data generated from a Sales Order (useful for UI pre-fill).
   */
  static getSalesOrderInvoicePreview(salesOrderId: string) {
    const so = SalesOrderModel.findById(salesOrderId);
    if (!so) {
      throw new AppError(`Sales order with ID '${salesOrderId}' not found.`, 404);
    }

    if (so.status === 'CANCELLED') {
      throw new AppError(`Cannot generate invoice for cancelled sales order #${so.order_number}.`, 400);
    }

    const soItems = SalesOrderItemModel.findBySalesOrderId(salesOrderId);
    const customer = CustomerModel.findById(so.customer_id);

    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const previewItems = soItems.map((item) => ({
      product_id: item.product_id,
      description: item.product_name ? `${item.product_name} (${item.product_sku || item.product_id})` : `Product ${item.product_id}`,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax: item.tax,
      discount: item.discount,
      line_total: item.line_total,
    }));

    return {
      invoice_number: InvoiceModel.generateInvoiceNumber(),
      sales_order_id: so.id,
      sales_order_number: so.order_number,
      customer_id: so.customer_id,
      customer_name: customer?.customer_name,
      company_name: customer?.company_name,
      invoice_date: today,
      due_date: dueDate,
      status: 'ISSUED' as InvoiceStatus,
      items: previewItems,
      subtotal: so.subtotal,
      tax: so.tax,
      discount: so.discount,
      total: so.total,
      notes: so.notes ? `Generated from Sales Order #${so.order_number}. ${so.notes}` : `Generated from Sales Order #${so.order_number}.`,
    };
  }

  /**
   * Create a new commercial invoice.
   * Can be generated directly from a Sales Order, or created with custom line items.
   * CRITICAL SCM RULE: This function NEVER touches or depletes inventory balances.
   */
  static createInvoice(dto: IInvoiceFormData, userId: string): IInvoiceDetail {
    const isFromSales = Boolean(dto.sales_order_id && (!dto.items || dto.items.length === 0));

    // If generating from sales order without explicit items, pull from sales order
    let workingDto = { ...dto };
    if (workingDto.sales_order_id) {
      const so = SalesOrderModel.findById(workingDto.sales_order_id);
      if (!so) {
        throw new AppError(`Referenced sales order '${workingDto.sales_order_id}' does not exist.`, 404);
      }
      if (so.status === 'CANCELLED') {
        throw new AppError(`Cannot generate an invoice for a CANCELLED sales order (#${so.order_number}).`, 400);
      }

      if (!workingDto.customer_id) {
        workingDto.customer_id = so.customer_id;
      }

      if (!workingDto.items || workingDto.items.length === 0) {
        const soItems = SalesOrderItemModel.findBySalesOrderId(so.id);
        if (soItems.length === 0) {
          throw new AppError(`Sales order #${so.order_number} has no line items to invoice.`, 400);
        }

        workingDto.items = soItems.map((item) => ({
          product_id: item.product_id,
          description: item.product_name ? `${item.product_name} (${item.product_sku || item.product_id})` : `Product ${item.product_id}`,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax: item.tax,
          discount: item.discount,
          line_total: item.line_total,
        }));

        if (workingDto.tax === undefined) workingDto.tax = so.tax;
        if (workingDto.discount === undefined) workingDto.discount = so.discount;
        if (!workingDto.notes) {
          workingDto.notes = so.notes ? `Generated from Sales Order #${so.order_number}. ${so.notes}` : `Generated from Sales Order #${so.order_number}.`;
        }
      }
    }

    validateInvoice(workingDto, false);

    // Verify customer exists
    const customer = CustomerModel.findById(workingDto.customer_id);
    if (!customer) {
      throw new AppError(`Customer with ID '${workingDto.customer_id}' not found.`, 404);
    }

    // Set invoice number or verify uniqueness
    let invoiceNumber = workingDto.invoice_number?.trim();
    if (invoiceNumber) {
      const existing = InvoiceModel.findByInvoiceNumber(invoiceNumber);
      if (existing) {
        throw new AppError(`Invoice number '${invoiceNumber}' already exists. Invoice numbers must be unique.`, 409);
      }
    } else {
      invoiceNumber = InvoiceModel.generateInvoiceNumber();
    }

    const today = new Date().toISOString().split('T')[0];
    const invoiceDate = workingDto.invoice_date?.trim() || today;
    const dueDate = workingDto.due_date?.trim() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const status: InvoiceStatus = workingDto.status || 'DRAFT';

    // Calculate line items financial totals
    const calculatedItems = (workingDto.items || []).map((item) => {
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Math.max(0, Number(item.unit_price) || 0);
      const itemTax = Math.max(0, Number(item.tax) || 0);
      const itemDiscount = Math.max(0, Number(item.discount) || 0);
      const lineTotal = Math.max(0, Math.round((quantity * unitPrice + itemTax - itemDiscount) * 100) / 100);

      // Verify product if product_id is supplied
      let description = item.description.trim();
      if (item.product_id) {
        const prod = ProductModel.findById(item.product_id);
        if (prod && !item.description) {
          description = `${prod.name} (${prod.sku})`;
        }
      }

      return {
        product_id: item.product_id || null,
        description,
        quantity,
        unit_price: unitPrice,
        tax: itemTax,
        discount: itemDiscount,
        line_total: lineTotal,
      };
    });

    const subtotal = Math.round(calculatedItems.reduce((acc, curr) => acc + curr.line_total, 0) * 100) / 100;
    const orderTax = Math.max(0, Number(workingDto.tax) || 0);
    const orderDiscount = Math.max(0, Number(workingDto.discount) || 0);
    const total = Math.max(0, Math.round((subtotal + orderTax - orderDiscount) * 100) / 100);

    // Create Invoice Record
    const createdInvoice = InvoiceModel.create({
      invoice_number: invoiceNumber,
      sales_order_id: workingDto.sales_order_id || null,
      customer_id: workingDto.customer_id,
      invoice_date: invoiceDate,
      due_date: dueDate,
      status,
      subtotal,
      tax: orderTax,
      discount: orderDiscount,
      total,
      notes: workingDto.notes || null,
      created_by: userId,
    });

    // Create Line Items
    for (const item of calculatedItems) {
      InvoiceItemModel.create({
        invoice_id: createdInvoice.id,
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax: item.tax,
        discount: item.discount,
        line_total: item.line_total,
      });
    }

    AuditService.recordActivity({
      user_id: userId,
      action: 'CREATE',
      module: 'INVOICE',
      entity_type: 'INVOICE',
      entity_id: createdInvoice.id,
      description: `Created invoice #${createdInvoice.invoice_number} for customer ${customer.customer_name} (Total: ${total})`,
      new_value: { invoice_number: createdInvoice.invoice_number, customer_id: workingDto.customer_id, total, status },
    });
    return this.getInvoiceById(createdInvoice.id);
  }

  /**
   * Update an existing draft invoice.
   * Only invoices with status 'DRAFT' can be modified.
   */
  static updateInvoice(id: string, dto: IInvoiceFormData): IInvoiceDetail {
    const existing = InvoiceModel.findById(id);
    if (!existing) {
      throw new AppError(`Invoice with ID '${id}' not found.`, 404);
    }

    if (existing.status !== 'DRAFT') {
      throw new AppError(
        `Cannot edit invoice #${existing.invoice_number} because it is in '${existing.status}' status. Only DRAFT invoices can be modified.`,
        400
      );
    }

    validateInvoice(dto, false);

    // Verify customer exists
    const customer = CustomerModel.findById(dto.customer_id);
    if (!customer) {
      throw new AppError(`Customer with ID '${dto.customer_id}' not found.`, 404);
    }

    // Re-calculate line items
    const calculatedItems = (dto.items || []).map((item) => {
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Math.max(0, Number(item.unit_price) || 0);
      const itemTax = Math.max(0, Number(item.tax) || 0);
      const itemDiscount = Math.max(0, Number(item.discount) || 0);
      const lineTotal = Math.max(0, Math.round((quantity * unitPrice + itemTax - itemDiscount) * 100) / 100);

      let description = item.description.trim();
      if (item.product_id) {
        const prod = ProductModel.findById(item.product_id);
        if (prod && !item.description) {
          description = `${prod.name} (${prod.sku})`;
        }
      }

      return {
        product_id: item.product_id || null,
        description,
        quantity,
        unit_price: unitPrice,
        tax: itemTax,
        discount: itemDiscount,
        line_total: lineTotal,
      };
    });

    const subtotal = Math.round(calculatedItems.reduce((acc, curr) => acc + curr.line_total, 0) * 100) / 100;
    const orderTax = Math.max(0, Number(dto.tax) || 0);
    const orderDiscount = Math.max(0, Number(dto.discount) || 0);
    const total = Math.max(0, Math.round((subtotal + orderTax - orderDiscount) * 100) / 100);

    // Update main invoice table
    InvoiceModel.update(id, {
      customer_id: dto.customer_id,
      invoice_date: dto.invoice_date || existing.invoice_date,
      due_date: dto.due_date || existing.due_date,
      subtotal,
      tax: orderTax,
      discount: orderDiscount,
      total,
      notes: dto.notes !== undefined ? dto.notes : existing.notes,
      status: dto.status || existing.status,
    });

    // Replace line items
    InvoiceItemModel.deleteByInvoiceId(id);
    for (const item of calculatedItems) {
      InvoiceItemModel.create({
        invoice_id: id,
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax: item.tax,
        discount: item.discount,
        line_total: item.line_total,
      });
    }

    return this.getInvoiceById(id);
  }

  /**
   * Update invoice workflow status with transition validation.
   */
  static updateStatus(id: string, newStatus: InvoiceStatus, userId?: string): IInvoiceDetail {
    const existing = InvoiceModel.findById(id);
    if (!existing) {
      throw new AppError(`Invoice with ID '${id}' not found.`, 404);
    }

    validateStatusTransition(existing.status, newStatus);
    InvoiceModel.updateStatus(existing.id, newStatus);

    AuditService.recordActivity({
      user_id: userId,
      action: 'STATUS_CHANGE',
      module: 'INVOICE',
      entity_type: 'INVOICE',
      entity_id: existing.id,
      description: `Invoice #${existing.invoice_number} status changed: ${existing.status} -> ${newStatus}`,
      old_value: { status: existing.status },
      new_value: { status: newStatus },
    });

    return this.getInvoiceById(existing.id);
  }

  /**
   * Retrieve aggregate financial metrics for invoices.
   */
  static getMetrics(): IInvoiceMetrics {
    return InvoiceModel.getMetrics();
  }
}
