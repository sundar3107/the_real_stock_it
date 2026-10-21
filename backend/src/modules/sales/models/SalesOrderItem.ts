import crypto from 'crypto';
import { db } from '../../../database/connection';
import { ISalesOrderItem } from '../types/sales.types';

export class SalesOrderItemModel {
  static create(item: {
    sales_order_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    tax?: number;
    discount?: number;
    line_total: number;
  }): ISalesOrderItem {
    const id = `soi_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO sales_order_items (
        id, sales_order_id, product_id, quantity,
        unit_price, tax, discount, line_total, created_at
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      id,
      item.sales_order_id,
      item.product_id,
      item.quantity,
      item.unit_price,
      item.tax || 0,
      item.discount || 0,
      item.line_total,
      now
    );

    return this.findById(id)!;
  }

  static findById(id: string): ISalesOrderItem | null {
    const sql = `
      SELECT 
        soi.*,
        p.name AS product_name,
        p.sku AS product_sku,
        p.unit
      FROM sales_order_items soi
      LEFT JOIN products p ON soi.product_id = p.id
      WHERE soi.id = ?
    `;
    const row = (db.prepare(sql).get(id) as unknown) as ISalesOrderItem | undefined;
    return row || null;
  }

  static findBySalesOrderId(soId: string): ISalesOrderItem[] {
    const sql = `
      SELECT 
        soi.*,
        p.name AS product_name,
        p.sku AS product_sku,
        p.unit
      FROM sales_order_items soi
      LEFT JOIN products p ON soi.product_id = p.id
      WHERE soi.sales_order_id = ?
      ORDER BY soi.created_at ASC
    `;
    const rows = (db.prepare(sql).all(soId) as unknown) as ISalesOrderItem[];
    return rows;
  }

  static deleteBySalesOrderId(soId: string): void {
    const stmt = db.prepare('DELETE FROM sales_order_items WHERE sales_order_id = ?');
    stmt.run(soId);
  }
}
