import crypto from 'crypto';
import { db } from '../../../database/connection';
import { IInvoiceItem } from '../types/invoice.types';

export class InvoiceItemModel {
  static create(item: {
    id?: string;
    invoice_id: string;
    product_id?: string | null;
    description: string;
    quantity: number;
    unit_price: number;
    tax?: number;
    discount?: number;
    line_total: number;
  }): IInvoiceItem {
    const id = item.id || `invi_${crypto.randomUUID()}`;
    const tax = Number(item.tax) || 0;
    const discount = Number(item.discount) || 0;

    const stmt = db.prepare(`
      INSERT INTO invoice_items (
        id, invoice_id, product_id, description, quantity,
        unit_price, tax, discount, line_total, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(
      id,
      item.invoice_id,
      item.product_id || null,
      item.description,
      item.quantity,
      item.unit_price,
      tax,
      discount,
      item.line_total
    );

    return this.findById(id)!;
  }

  static findById(id: string): IInvoiceItem | null {
    const stmt = db.prepare(`
      SELECT 
        ii.*,
        p.name AS product_name,
        p.sku AS product_sku
      FROM invoice_items ii
      LEFT JOIN products p ON ii.product_id = p.id
      WHERE ii.id = ?
    `);

    const row = stmt.get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      invoice_id: row.invoice_id,
      product_id: row.product_id,
      product_name: row.product_name || undefined,
      product_sku: row.product_sku || undefined,
      description: row.description,
      quantity: Number(row.quantity),
      unit_price: Number(row.unit_price),
      tax: Number(row.tax),
      discount: Number(row.discount),
      line_total: Number(row.line_total),
      created_at: row.created_at,
    };
  }

  static findByInvoiceId(invoiceId: string): IInvoiceItem[] {
    const stmt = db.prepare(`
      SELECT 
        ii.*,
        p.name AS product_name,
        p.sku AS product_sku
      FROM invoice_items ii
      LEFT JOIN products p ON ii.product_id = p.id
      WHERE ii.invoice_id = ?
      ORDER BY ii.created_at ASC
    `);

    const rows = stmt.all(invoiceId) as any[];
    return rows.map((row) => ({
      id: row.id,
      invoice_id: row.invoice_id,
      product_id: row.product_id,
      product_name: row.product_name || undefined,
      product_sku: row.product_sku || undefined,
      description: row.description,
      quantity: Number(row.quantity),
      unit_price: Number(row.unit_price),
      tax: Number(row.tax),
      discount: Number(row.discount),
      line_total: Number(row.line_total),
      created_at: row.created_at,
    }));
  }

  static deleteByInvoiceId(invoiceId: string): void {
    const stmt = db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?');
    stmt.run(invoiceId);
  }
}
