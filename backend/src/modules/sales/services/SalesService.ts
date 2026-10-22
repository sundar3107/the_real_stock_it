import { AppError } from '../../authentication/services/AuthService';
import { AuditService } from '../../audit/services/AuditService';
import { SalesOrderModel } from '../models/SalesOrder';
import { SalesOrderItemModel } from '../models/SalesOrderItem';
import { CustomerModel } from '../../customers/models/Customer';
import { ProductModel } from '../../products/models/Product';
import { InventoryModel } from '../../inventory/models/Inventory';
import { InventoryService } from '../../inventory/services/InventoryService';
import {
  ISalesOrder,
  ISalesOrderDetail,
  ISalesOrderFormData,
  ISalesFilterQuery,
  ISalesMetrics,
  SalesStatus,
} from '../types/sales.types';
import {
  validateSalesOrder,
  validateStatusTransition,
} from '../validators/salesValidators';

export class SalesService {
  static getSales(query: ISalesFilterQuery = {}) {
    return SalesOrderModel.findWithPagination(query);
  }

  static getSaleById(id: string): ISalesOrderDetail {
    const order = SalesOrderModel.findById(id);
    if (!order) {
      throw new AppError(`Sales order with identifier '${id}' not found.`, 404);
    }

    const items = SalesOrderItemModel.findBySalesOrderId(order.id);
    const customer = CustomerModel.findById(order.customer_id);

    return {
      ...order,
      items,
      customer,
    };
  }

  static createSale(data: ISalesOrderFormData, userId: string): ISalesOrderDetail {
    const validation = validateSalesOrder(data, false);
    if (!validation.isValid) {
      throw new AppError('Validation failed for sales order.', 400, validation.errors);
    }

    // 1. Verify customer exists and is ACTIVE
    const customer = CustomerModel.findById(data.customer_id);
    if (!customer) {
      throw new AppError(`Customer with ID '${data.customer_id}' not found.`, 404);
    }
    if (customer.status !== 'ACTIVE') {
      throw new AppError(
        `Cannot create sales order for inactive customer '${customer.customer_name}'.`,
        400
      );
    }

    // 2. Verify all products exist and are ACTIVE
    for (const item of data.items) {
      const product = ProductModel.findById(item.product_id);
      if (!product) {
        throw new AppError(`Product with ID '${item.product_id}' not found.`, 404);
      }
      if (product.status !== 'ACTIVE') {
        throw new AppError(
          `Cannot include inactive product '${product.name}' on a sales order.`,
          400
        );
      }
    }

    // 3. Compute calculations
    let subtotal = 0;
    const computedItems = data.items.map((item) => {
      const product = ProductModel.findById(item.product_id)!;
      const qty = Math.floor(Number(item.quantity));
      const price = item.unit_price !== undefined ? Number(item.unit_price) : Number(product.selling_price || 0);
      const tax = Number(item.tax || 0);
      const discount = Number(item.discount || 0);
      const lineTotal = Math.max(0, qty * price + tax - discount);
      subtotal += lineTotal;

      return {
        product_id: item.product_id,
        quantity: qty,
        unit_price: price,
        tax,
        discount,
        line_total: Math.round(lineTotal * 100) / 100,
      };
    });

    const orderTax = data.tax !== undefined ? Number(data.tax) : 0;
    const orderDiscount = data.discount !== undefined ? Number(data.discount) : 0;
    const total = Math.max(0, Math.round((subtotal + orderTax - orderDiscount) * 100) / 100);

    const initialStatus: SalesStatus = data.status || 'DRAFT';

    // 4. Create master sales order
    const createdSO = SalesOrderModel.create({
      customer_id: data.customer_id,
      order_number: data.order_number,
      order_date: data.order_date,
      status: initialStatus === 'COMPLETED' ? 'CONFIRMED' : initialStatus,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: orderTax,
      discount: orderDiscount,
      total,
      notes: data.notes,
      created_by: userId,
    });

    // 5. Create line items
    for (const item of computedItems) {
      SalesOrderItemModel.create({
        sales_order_id: createdSO.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax: item.tax,
        discount: item.discount,
        line_total: item.line_total,
      });
    }

    // 6. If requested initially as COMPLETED, complete and deduct stock
    if (initialStatus === 'COMPLETED') {
      return this.completeSale(createdSO.id, userId);
    }

    AuditService.recordActivity({
      user_id: userId,
      action: 'CREATE',
      module: 'SALES',
      entity_type: 'SALES_ORDER',
      entity_id: createdSO.id,
      description: `Created sales order ${createdSO.order_number} for customer ${customer.customer_name} (Total: ${total})`,
      new_value: { customer_id: data.customer_id, order_number: createdSO.order_number, total, status: initialStatus, items_count: computedItems.length },
    });
    return this.getSaleById(createdSO.id);
  }

  static updateSale(id: string, data: Partial<ISalesOrderFormData>): ISalesOrderDetail {
    const existing = SalesOrderModel.findById(id);
    if (!existing) {
      throw new AppError(`Sales order with ID '${id}' not found.`, 404);
    }

    // Line items and details can only be modified while in DRAFT status
    if (existing.status !== 'DRAFT') {
      throw new AppError(
        `Cannot modify a sales order in '${existing.status}' status. Only DRAFT orders can be updated.`,
        400
      );
    }

    const validation = validateSalesOrder(data, true);
    if (!validation.isValid) {
      throw new AppError('Validation failed for sales order update.', 400, validation.errors);
    }

    if (data.customer_id && data.customer_id !== existing.customer_id) {
      const customer = CustomerModel.findById(data.customer_id);
      if (!customer || customer.status !== 'ACTIVE') {
        throw new AppError('Customer must exist and be ACTIVE.', 400);
      }
    }

    let subtotal = existing.subtotal;
    let orderTax = data.tax !== undefined ? Number(data.tax) : existing.tax;
    let orderDiscount = data.discount !== undefined ? Number(data.discount) : existing.discount;

    // If updating line items
    if (data.items) {
      // Verify products exist and are active
      for (const item of data.items) {
        const product = ProductModel.findById(item.product_id);
        if (!product || product.status !== 'ACTIVE') {
          throw new AppError(`Product '${item.product_id}' must exist and be ACTIVE.`, 400);
        }
      }

      // Remove old items
      SalesOrderItemModel.deleteBySalesOrderId(existing.id);

      // Recompute and insert new items
      subtotal = 0;
      for (const item of data.items) {
        const product = ProductModel.findById(item.product_id)!;
        const qty = Math.floor(Number(item.quantity));
        const price = item.unit_price !== undefined ? Number(item.unit_price) : Number(product.selling_price || 0);
        const tax = Number(item.tax || 0);
        const discount = Number(item.discount || 0);
        const lineTotal = Math.max(0, qty * price + tax - discount);
        subtotal += lineTotal;

        SalesOrderItemModel.create({
          sales_order_id: existing.id,
          product_id: item.product_id,
          quantity: qty,
          unit_price: price,
          tax,
          discount,
          line_total: Math.round(lineTotal * 100) / 100,
        });
      }
    }

    const total = Math.max(0, Math.round((subtotal + orderTax - orderDiscount) * 100) / 100);

    SalesOrderModel.update(existing.id, {
      customer_id: data.customer_id,
      order_date: data.order_date,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: orderTax,
      discount: orderDiscount,
      total,
      notes: data.notes,
      status: data.status,
    });

    return this.getSaleById(existing.id);
  }

  static updateStatus(id: string, newStatus: SalesStatus, userId: string): ISalesOrderDetail {
    const existing = SalesOrderModel.findById(id);
    if (!existing) {
      throw new AppError(`Sales order with ID '${id}' not found.`, 404);
    }

    if (newStatus === 'COMPLETED') {
      return this.completeSale(id, userId);
    }

    const validation = validateStatusTransition(existing.status, newStatus);
    if (!validation.isValid) {
      throw new AppError(validation.errors.status, 400);
    }

    SalesOrderModel.updateStatus(existing.id, newStatus);
    return this.getSaleById(existing.id);
  }

  /**
   * Critical SCM Integration:
   * Completing a sale verifies stock sufficiency across all items,
   * invokes InventoryService.stockOut for each item,
   * creates immutable stock transactions referencing the SO,
   * and transitions order status to COMPLETED exactly once.
   */
  static completeSale(id: string, userId: string): ISalesOrderDetail {
    const order = SalesOrderModel.findById(id);
    if (!order) {
      throw new AppError(`Sales order with ID '${id}' not found.`, 404);
    }

    if (order.status === 'COMPLETED') {
      throw new AppError(
        `Sales order #${order.order_number} is already completed and stock has been deducted. Cannot complete twice.`,
        400
      );
    }

    if (order.status === 'CANCELLED') {
      throw new AppError(
        `Cannot complete a cancelled sales order (${order.order_number}).`,
        400
      );
    }

    const items = SalesOrderItemModel.findBySalesOrderId(order.id);
    if (items.length === 0) {
      throw new AppError('Cannot complete a sales order with no product line items.', 400);
    }

    // 1. Stock Pre-Validation: Verify sufficient stock is available for EVERY line item before deducting
    for (const item of items) {
      const product = ProductModel.findById(item.product_id);
      const inventory = InventoryModel.ensureInventoryRecord(item.product_id);

      if (item.quantity > inventory.current_quantity) {
        throw new AppError(
          `Insufficient stock for '${product?.name || item.product_id}'. Requested ${item.quantity} ${product?.unit || 'units'}, but only ${inventory.current_quantity} available in inventory.`,
          400,
          {
            product_id: item.product_id,
            requested: String(item.quantity),
            available: String(inventory.current_quantity),
          }
        );
      }
    }

    // 2. Authoritative Stock Depletion: Call InventoryService.stockOut for each item
    for (const item of items) {
      InventoryService.stockOut(
        {
          product_id: item.product_id,
          quantity: item.quantity,
          reference: `SO #${order.order_number || order.id}`,
          reason: order.notes?.trim()
            ? `Sales Fulfillment: ${order.notes.trim()}`
            : `Sales Order Fulfillment (${order.order_number || order.id})`,
        },
        userId
      );
    }

    // 3. Mark sales order status as COMPLETED
    SalesOrderModel.updateStatus(order.id, 'COMPLETED');

    AuditService.recordActivity({
      user_id: userId,
      action: 'STATUS_CHANGE',
      module: 'SALES',
      entity_type: 'SALES_ORDER',
      entity_id: order.id,
      description: `Completed sales order ${order.order_number}. Inventory stock deducted for ${items.length} line items.`,
      old_value: { status: order.status },
      new_value: { status: 'COMPLETED' },
    });

    return this.getSaleById(order.id);
  }

  static getMetrics(): ISalesMetrics {
    return SalesOrderModel.getMetrics();
  }
}
