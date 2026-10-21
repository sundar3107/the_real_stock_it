import { AppError } from '../../authentication/services/AuthService';
import { PurchaseOrderModel } from '../models/PurchaseOrder';
import { PurchaseOrderItemModel } from '../models/PurchaseOrderItem';
import { SupplierModel } from '../../suppliers/models/Supplier';
import { ProductModel } from '../../products/models/Product';
import { InventoryService } from '../../inventory/services/InventoryService';
import {
  IPurchaseOrder,
  IPurchaseOrderDetail,
  IPurchaseOrderFormData,
  IPurchaseFilterQuery,
  IPurchaseMetrics,
  IReceivePurchaseDto,
  PurchaseStatus,
} from '../types/purchase.types';
import {
  validatePurchaseOrder,
  validateStatusTransition,
  validateReceiveItems,
} from '../validators/purchaseValidators';

export class PurchaseService {
  static getPurchases(query: IPurchaseFilterQuery = {}) {
    return PurchaseOrderModel.findWithPagination(query);
  }

  static getPurchaseById(id: string): IPurchaseOrderDetail {
    const po = PurchaseOrderModel.findById(id);
    if (!po) {
      throw new AppError(`Purchase order with ID '${id}' not found.`, 404);
    }

    const items = PurchaseOrderItemModel.findByPurchaseOrderId(id);
    const supplier = SupplierModel.findById(po.supplier_id);

    return {
      ...po,
      items,
      supplier,
    };
  }

  static createPurchase(data: IPurchaseOrderFormData, userId: string): IPurchaseOrderDetail {
    const validation = validatePurchaseOrder(data, false);
    if (!validation.isValid) {
      throw new AppError('Validation failed for purchase order.', 400, validation.errors);
    }

    // 1. Verify supplier exists and is ACTIVE
    const supplier = SupplierModel.findById(data.supplier_id);
    if (!supplier) {
      throw new AppError(`Supplier with ID '${data.supplier_id}' not found.`, 404);
    }
    if (supplier.status !== 'ACTIVE') {
      throw new AppError(
        `Cannot issue purchase order to inactive supplier '${supplier.supplier_name}'.`,
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
          `Cannot include inactive product '${product.name}' on a purchase order.`,
          400
        );
      }
    }

    // 3. Compute calculations
    let subtotal = 0;
    const computedItems = data.items.map((item) => {
      const qty = Math.floor(Number(item.quantity));
      const price = Number(item.unit_price);
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

    const orderTax = Number(data.tax || 0);
    const orderDiscount = Number(data.discount || 0);
    const total = Math.max(0, Math.round((subtotal + orderTax - orderDiscount) * 100) / 100);

    // 4. Create master Purchase Order record
    const status: PurchaseStatus = data.status || 'DRAFT';
    const createdPO = PurchaseOrderModel.create({
      supplier_id: data.supplier_id,
      order_date: data.order_date,
      expected_delivery_date: data.expected_delivery_date,
      status,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: orderTax,
      discount: orderDiscount,
      total,
      notes: data.notes,
      created_by: userId,
    });

    // 5. Create line items
    for (const item of computedItems) {
      PurchaseOrderItemModel.create({
        purchase_order_id: createdPO.id,
        product_id: item.product_id,
        quantity: item.quantity,
        received_quantity: 0,
        unit_price: item.unit_price,
        tax: item.tax,
        discount: item.discount,
        line_total: item.line_total,
      });
    }

    return this.getPurchaseById(createdPO.id);
  }

  static updatePurchase(id: string, data: Partial<IPurchaseOrderFormData>): IPurchaseOrderDetail {
    const existing = PurchaseOrderModel.findById(id);
    if (!existing) {
      throw new AppError(`Purchase order with ID '${id}' not found.`, 404);
    }

    // Line items can only be changed while PO is in DRAFT status
    if (data.items && existing.status !== 'DRAFT') {
      throw new AppError(
        `Cannot modify line items for a purchase order in '${existing.status}' status.`,
        400
      );
    }

    const validation = validatePurchaseOrder(data, true);
    if (!validation.isValid) {
      throw new AppError('Validation failed for purchase order update.', 400, validation.errors);
    }

    if (data.supplier_id && data.supplier_id !== existing.supplier_id) {
      const supplier = SupplierModel.findById(data.supplier_id);
      if (!supplier || supplier.status !== 'ACTIVE') {
        throw new AppError('Supplier must exist and be ACTIVE.', 400);
      }
    }

    let subtotal = existing.subtotal;
    let orderTax = data.tax !== undefined ? Number(data.tax) : existing.tax;
    let orderDiscount = data.discount !== undefined ? Number(data.discount) : existing.discount;

    if (data.items) {
      // Re-validate and recalculate items
      subtotal = 0;
      PurchaseOrderItemModel.deleteByPurchaseOrderId(id);

      for (const item of data.items) {
        const product = ProductModel.findById(item.product_id);
        if (!product || product.status !== 'ACTIVE') {
          throw new AppError(`Product '${item.product_id}' is invalid or inactive.`, 400);
        }

        const qty = Math.floor(Number(item.quantity));
        const price = Number(item.unit_price);
        const tax = Number(item.tax || 0);
        const discount = Number(item.discount || 0);
        const lineTotal = Math.max(0, qty * price + tax - discount);
        subtotal += lineTotal;

        PurchaseOrderItemModel.create({
          purchase_order_id: id,
          product_id: item.product_id,
          quantity: qty,
          received_quantity: 0,
          unit_price: price,
          tax,
          discount,
          line_total: Math.round(lineTotal * 100) / 100,
        });
      }
    }

    const total = Math.max(0, Math.round((subtotal + orderTax - orderDiscount) * 100) / 100);

    PurchaseOrderModel.update(id, {
      supplier_id: data.supplier_id,
      order_date: data.order_date,
      expected_delivery_date: data.expected_delivery_date,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: orderTax,
      discount: orderDiscount,
      total,
      notes: data.notes,
      status: data.status,
    });

    return this.getPurchaseById(id);
  }

  static updateStatus(id: string, newStatus: PurchaseStatus): IPurchaseOrderDetail {
    const existing = PurchaseOrderModel.findById(id);
    if (!existing) {
      throw new AppError(`Purchase order with ID '${id}' not found.`, 404);
    }

    const items = PurchaseOrderItemModel.findByPurchaseOrderId(id);
    const hasReceivedItems = items.some((i) => i.received_quantity > 0);

    const validation = validateStatusTransition(existing.status, newStatus, hasReceivedItems);
    if (!validation.isValid) {
      throw new AppError(validation.errors.status, 400);
    }

    PurchaseOrderModel.updateStatus(id, newStatus);
    return this.getPurchaseById(id);
  }

  /**
   * Critical SCM Integration:
   * Receiving products delegates to InventoryService.stockIn to update authoritative balances
   * and create immutable stock audit transactions.
   */
  static receivePurchase(
    id: string,
    dto: IReceivePurchaseDto,
    userId: string
  ): { purchase_order: IPurchaseOrderDetail; received_count: number } {
    const po = PurchaseOrderModel.findById(id);
    if (!po) {
      throw new AppError(`Purchase order with ID '${id}' not found.`, 404);
    }

    if (po.status !== 'ORDERED' && po.status !== 'PARTIALLY_RECEIVED') {
      throw new AppError(
        `Cannot receive products for a purchase order in '${po.status}' status. Only ORDERED or PARTIALLY_RECEIVED orders can receive items.`,
        400
      );
    }

    const validation = validateReceiveItems(dto);
    if (!validation.isValid) {
      throw new AppError('Validation failed for receiving items.', 400, validation.errors);
    }

    const existingItems = PurchaseOrderItemModel.findByPurchaseOrderId(id);
    const itemMap = new Map(existingItems.map((item) => [item.id, item]));

    // Validate quantities against remaining ordered items
    for (const receipt of dto.items) {
      const poi = itemMap.get(receipt.item_id);
      if (!poi) {
        throw new AppError(`Line item with ID '${receipt.item_id}' not found on PO #${id}.`, 404);
      }

      const remaining = poi.quantity - poi.received_quantity;
      const receiveQty = Math.floor(Number(receipt.receive_quantity));

      if (receiveQty > remaining) {
        throw new AppError(
          `Cannot receive ${receiveQty} units of '${poi.product_name || poi.product_id}'. Only ${remaining} units remaining on this order.`,
          400
        );
      }
    }

    // Process receipts: update received quantities and invoke InventoryService.stockIn
    let totalReceivedThisBatch = 0;
    for (const receipt of dto.items) {
      const poi = itemMap.get(receipt.item_id)!;
      const receiveQty = Math.floor(Number(receipt.receive_quantity));
      const newReceivedQty = poi.received_quantity + receiveQty;

      // 1. Update received quantity on PO item
      PurchaseOrderItemModel.updateReceivedQuantity(poi.id, newReceivedQty);

      // 2. Delegate to InventoryService to increase physical stock balance
      InventoryService.stockIn(
        {
          product_id: poi.product_id,
          quantity: receiveQty,
          reference: `PO #${po.id}`,
          reason: dto.notes?.trim()
            ? `Purchase Inbound: ${dto.notes.trim()}`
            : `Purchase Order Receipt (${po.id})`,
        },
        userId
      );

      totalReceivedThisBatch += receiveQty;
    }

    // Determine new status based on all items
    const updatedItems = PurchaseOrderItemModel.findByPurchaseOrderId(id);
    const allFullyReceived = updatedItems.every((i) => i.received_quantity >= i.quantity);
    const someReceived = updatedItems.some((i) => i.received_quantity > 0);

    const nextStatus: PurchaseStatus = allFullyReceived
      ? 'RECEIVED'
      : someReceived
      ? 'PARTIALLY_RECEIVED'
      : po.status;

    PurchaseOrderModel.updateStatus(id, nextStatus);

    return {
      purchase_order: this.getPurchaseById(id),
      received_count: totalReceivedThisBatch,
    };
  }

  static getMetrics(): IPurchaseMetrics {
    return PurchaseOrderModel.getMetrics();
  }
}
