import crypto from 'crypto';
import { db } from '../../../database/connection';
import { ISupplierProduct } from '../types/supplier.types';

export class SupplierProductModel {
  static getProductsBySupplierId(supplierId: string): ISupplierProduct[] {
    const sql = `
      SELECT 
        sp.id,
        sp.supplier_id,
        sp.product_id,
        p.name AS product_name,
        p.sku,
        p.purchase_price,
        p.unit,
        c.name AS category_name,
        sp.created_at
      FROM supplier_products sp
      INNER JOIN products p ON sp.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE sp.supplier_id = ?
      ORDER BY p.name ASC
    `;
    return (db.prepare(sql).all(supplierId) as unknown) as ISupplierProduct[];
  }

  static isAssociated(supplierId: string, productId: string): boolean {
    const sql = 'SELECT id FROM supplier_products WHERE supplier_id = ? AND product_id = ?';
    const row = db.prepare(sql).get(supplierId, productId);
    return !!row;
  }

  static associateProduct(supplierId: string, productId: string): ISupplierProduct {
    const existing = db.prepare(
      'SELECT * FROM supplier_products WHERE supplier_id = ? AND product_id = ?'
    ).get(supplierId, productId) as any;

    if (existing) {
      return this.getProductsBySupplierId(supplierId).find((sp) => sp.product_id === productId)!;
    }

    const id = `sp_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO supplier_products (id, supplier_id, product_id, created_at)
      VALUES (?, ?, ?, ?)
    `).run(id, supplierId, productId, now);

    return this.getProductsBySupplierId(supplierId).find((sp) => sp.product_id === productId)!;
  }

  static disassociateProduct(supplierId: string, productId: string): boolean {
    const stmt = db.prepare('DELETE FROM supplier_products WHERE supplier_id = ? AND product_id = ?');
    const info = stmt.run(supplierId, productId);
    return info.changes > 0;
  }

  static hasAssociations(supplierId: string): boolean {
    const row = db.prepare(
      'SELECT COUNT(*) as count FROM supplier_products WHERE supplier_id = ?'
    ).get(supplierId) as any;
    return row && row.count > 0;
  }
}
