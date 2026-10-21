import crypto from 'crypto';
import { db } from '../../../database/connection';
import { IPurchaseOrderItem } from '../types/purchase.types';

export class PurchaseOrderItemModel {
  static create(item: {
    purchase_order_id: string;
    product_id: string;
    quantity: number;
    received_quantity?: number;
    unit_price: number;
    tax?: number;
    discount?: number;
    line_total: number;
  }): IPurchaseOrderItem {
    const id = `poi_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO purchase_order_items (
        id, purchase_order_id, product_id, quantity, received_quantity,
        unit_price, tax, discount, line_total, created_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      id,
      item.purchase_order_id,
      item.product_id,
      item.quantity,
      item.received_quantity || 0,
      item.unit_price,
      item.tax || 0,
      item.discount || 0,
      item.line_total,
      now
    );

    return this.findById(id)!;
  }

  static findById(id: string): IPurchaseOrderItem | null {
    const sql = `
      SELECT 
        poi.*,
        p.name AS product_name,
        p.sku,
        p.unit
      FROM purchase_order_items poi
      LEFT JOIN products p ON poi.product_id = p.id
      WHERE poi.id = ?
    `;
    const row = (db.prepare(sql).get(id) as unknown) as IPurchaseOrderItem | undefined;
    return row || null;
  }

  static findByPurchaseOrderId(poId: string): IPurchaseOrderItem[] {
    const sql = `
      SELECT 
        poi.*,
        p.name AS product_name,
        p.sku,
        p.unit
      FROM purchase_order_items poi
      LEFT JOIN products p ON poi.product_id = p.id
      WHERE poi.purchase_order_id = ?
      ORDER BY poi.created_at ASC
    `;
    return (db.prepare(sql).all(poId) as unknown) as IPurchaseOrderItem[];
  }

  static updateReceivedQuantity(id: string, newReceivedQty: number): boolean {
    const stmt = db.prepare(`
      UPDATE purchase_order_items
      SET received_quantity = ?
      WHERE id = ?
    `);
    const info = stmt.run(newReceivedQty, id);
    return info.changes > 0;
  }

  static deleteByPurchaseOrderId(poId: string): boolean {
    const stmt = db.prepare('DELETE FROM purchase_order_items WHERE purchase_order_id = ?');
    const info = stmt.run(poId);
    return info.changes > 0;
  }
}
