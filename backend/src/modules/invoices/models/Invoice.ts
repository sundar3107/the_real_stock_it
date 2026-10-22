import crypto from 'crypto';
import { db } from '../../../database/connection';
import {
  IInvoice,
  IInvoiceFilterQuery,
  IInvoiceMetrics,
  InvoiceStatus,
} from '../types/invoice.types';

export class InvoiceModel {
  static generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const countRow = db
      .prepare("SELECT COUNT(*) as count FROM invoices WHERE invoice_number LIKE ?")
      .get(`INV-${year}-%`) as any;
    const nextSeq = (countRow ? Number(countRow.count) : 0) + 1;
    const seqStr = String(nextSeq).padStart(4, '0');
    const invoiceNumber = `INV-${year}-${seqStr}`;

    // Verify uniqueness
    const exists = db
      .prepare('SELECT id FROM invoices WHERE invoice_number = ?')
      .get(invoiceNumber);
    if (exists) {
      const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
      return `INV-${year}-${seqStr}-${randomSuffix}`;
    }
    return invoiceNumber;
  }

  static findWithPagination(query: IInvoiceFilterQuery = {}): {
    items: IInvoice[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  } {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (query.search && query.search.trim()) {
      const searchTerm = `%${query.search.trim()}%`;
      whereClauses.push(
        '(inv.id LIKE ? OR inv.invoice_number LIKE ? OR c.customer_name LIKE ? OR c.company_name LIKE ? OR so.order_number LIKE ? OR inv.notes LIKE ?)'
      );
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (query.status && query.status !== 'ALL') {
      whereClauses.push('inv.status = ?');
      params.push(query.status);
    }

    if (query.customer_id && query.customer_id.trim()) {
      whereClauses.push('inv.customer_id = ?');
      params.push(query.customer_id.trim());
    }

    if (query.sales_order_id && query.sales_order_id.trim()) {
      whereClauses.push('inv.sales_order_id = ?');
      params.push(query.sales_order_id.trim());
    }

    if (query.from_date && query.from_date.trim()) {
      whereClauses.push('inv.invoice_date >= ?');
      params.push(query.from_date.trim());
    }

    if (query.to_date && query.to_date.trim()) {
      whereClauses.push('inv.invoice_date <= ?');
      params.push(query.to_date.trim());
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total matching records
    const countSql = `
      SELECT COUNT(*) as count
      FROM invoices inv
      LEFT JOIN customers c ON inv.customer_id = c.id
      LEFT JOIN sales_orders so ON inv.sales_order_id = so.id
      ${whereSql}
    `;
    const countRow = db.prepare(countSql).get(...params) as any;
    const total = countRow ? Number(countRow.count) : 0;
    const total_pages = Math.ceil(total / limit) || 1;

    // Sorting safe column whitelist
    const sortFieldMap: Record<string, string> = {
      invoice_date: 'inv.invoice_date',
      due_date: 'inv.due_date',
      total: 'inv.total',
      status: 'inv.status',
      created_at: 'inv.created_at',
      invoice_number: 'inv.invoice_number',
    };
    const orderColumn = query.sort_by && sortFieldMap[query.sort_by] ? sortFieldMap[query.sort_by] : 'inv.invoice_date';
    const orderDir = query.sort_order && query.sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const selectSql = `
      SELECT 
        inv.*,
        c.customer_name,
        c.company_name,
        so.order_number AS sales_order_number,
        u.full_name AS created_by_name,
        (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = inv.id) as item_count
      FROM invoices inv
      LEFT JOIN customers c ON inv.customer_id = c.id
      LEFT JOIN sales_orders so ON inv.sales_order_id = so.id
      LEFT JOIN users u ON inv.created_by = u.id
      ${whereSql}
      ORDER BY ${orderColumn} ${orderDir}, inv.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = db.prepare(selectSql).all(...params, limit, offset) as any[];

    const items: IInvoice[] = rows.map((row) => ({
      id: row.id,
      invoice_number: row.invoice_number,
      sales_order_id: row.sales_order_id || null,
      sales_order_number: row.sales_order_number || null,
      customer_id: row.customer_id,
      customer_name: row.customer_name || undefined,
      company_name: row.company_name || null,
      invoice_date: row.invoice_date,
      due_date: row.due_date,
      status: row.status as InvoiceStatus,
      subtotal: Number(row.subtotal),
      tax: Number(row.tax),
      discount: Number(row.discount),
      total: Number(row.total),
      notes: row.notes || null,
      created_by: row.created_by,
      created_by_name: row.created_by_name || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
      item_count: Number(row.item_count) || 0,
    }));

    return {
      items,
      total,
      page,
      limit,
      total_pages,
    };
  }

  static findById(id: string): IInvoice | null {
    const stmt = db.prepare(`
      SELECT 
        inv.*,
        c.customer_name,
        c.company_name,
        so.order_number AS sales_order_number,
        u.full_name AS created_by_name,
        (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = inv.id) as item_count
      FROM invoices inv
      LEFT JOIN customers c ON inv.customer_id = c.id
      LEFT JOIN sales_orders so ON inv.sales_order_id = so.id
      LEFT JOIN users u ON inv.created_by = u.id
      WHERE inv.id = ?
    `);

    const row = stmt.get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      invoice_number: row.invoice_number,
      sales_order_id: row.sales_order_id || null,
      sales_order_number: row.sales_order_number || null,
      customer_id: row.customer_id,
      customer_name: row.customer_name || undefined,
      company_name: row.company_name || null,
      invoice_date: row.invoice_date,
      due_date: row.due_date,
      status: row.status as InvoiceStatus,
      subtotal: Number(row.subtotal),
      tax: Number(row.tax),
      discount: Number(row.discount),
      total: Number(row.total),
      notes: row.notes || null,
      created_by: row.created_by,
      created_by_name: row.created_by_name || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
      item_count: Number(row.item_count) || 0,
    };
  }

  static findByInvoiceNumber(invoiceNumber: string): IInvoice | null {
    const stmt = db.prepare(`
      SELECT 
        inv.*,
        c.customer_name,
        c.company_name,
        so.order_number AS sales_order_number,
        u.full_name AS created_by_name,
        (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = inv.id) as item_count
      FROM invoices inv
      LEFT JOIN customers c ON inv.customer_id = c.id
      LEFT JOIN sales_orders so ON inv.sales_order_id = so.id
      LEFT JOIN users u ON inv.created_by = u.id
      WHERE inv.invoice_number = ?
    `);

    const row = stmt.get(invoiceNumber) as any;
    if (!row) return null;

    return {
      id: row.id,
      invoice_number: row.invoice_number,
      sales_order_id: row.sales_order_id || null,
      sales_order_number: row.sales_order_number || null,
      customer_id: row.customer_id,
      customer_name: row.customer_name || undefined,
      company_name: row.company_name || null,
      invoice_date: row.invoice_date,
      due_date: row.due_date,
      status: row.status as InvoiceStatus,
      subtotal: Number(row.subtotal),
      tax: Number(row.tax),
      discount: Number(row.discount),
      total: Number(row.total),
      notes: row.notes || null,
      created_by: row.created_by,
      created_by_name: row.created_by_name || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
      item_count: Number(row.item_count) || 0,
    };
  }

  static create(data: {
    id?: string;
    invoice_number: string;
    sales_order_id?: string | null;
    customer_id: string;
    invoice_date: string;
    due_date: string;
    status?: InvoiceStatus;
    subtotal: number;
    tax?: number;
    discount?: number;
    total: number;
    notes?: string | null;
    created_by: string;
  }): IInvoice {
    const id = data.id || `inv_${crypto.randomUUID()}`;
    const status = data.status || 'DRAFT';
    const tax = Number(data.tax) || 0;
    const discount = Number(data.discount) || 0;

    const stmt = db.prepare(`
      INSERT INTO invoices (
        id, invoice_number, sales_order_id, customer_id, invoice_date, due_date, status,
        subtotal, tax, discount, total, notes, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    stmt.run(
      id,
      data.invoice_number,
      data.sales_order_id || null,
      data.customer_id,
      data.invoice_date,
      data.due_date,
      status,
      data.subtotal,
      tax,
      discount,
      data.total,
      data.notes || null,
      data.created_by
    );

    return this.findById(id)!;
  }

  static update(
    id: string,
    data: {
      customer_id?: string;
      invoice_date?: string;
      due_date?: string;
      subtotal?: number;
      tax?: number;
      discount?: number;
      total?: number;
      notes?: string | null;
      status?: InvoiceStatus;
    }
  ): IInvoice {
    const updates: string[] = ['updated_at = datetime(\'now\')'];
    const params: any[] = [];

    if (data.customer_id !== undefined) {
      updates.push('customer_id = ?');
      params.push(data.customer_id);
    }
    if (data.invoice_date !== undefined) {
      updates.push('invoice_date = ?');
      params.push(data.invoice_date);
    }
    if (data.due_date !== undefined) {
      updates.push('due_date = ?');
      params.push(data.due_date);
    }
    if (data.subtotal !== undefined) {
      updates.push('subtotal = ?');
      params.push(data.subtotal);
    }
    if (data.tax !== undefined) {
      updates.push('tax = ?');
      params.push(data.tax);
    }
    if (data.discount !== undefined) {
      updates.push('discount = ?');
      params.push(data.discount);
    }
    if (data.total !== undefined) {
      updates.push('total = ?');
      params.push(data.total);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      params.push(data.notes || null);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }

    params.push(id);
    const sql = `UPDATE invoices SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...params);

    return this.findById(id)!;
  }

  static updateStatus(id: string, status: InvoiceStatus): void {
    const stmt = db.prepare(`
      UPDATE invoices
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(status, id);
  }

  static getMetrics(): IInvoiceMetrics {
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM invoices').get() as any;
    const draftStmt = db.prepare("SELECT COUNT(*) as count FROM invoices WHERE status = 'DRAFT'").get() as any;
    const issuedStmt = db.prepare("SELECT COUNT(*) as count FROM invoices WHERE status = 'ISSUED'").get() as any;
    const paidStmt = db.prepare("SELECT COUNT(*) as count FROM invoices WHERE status = 'PAID'").get() as any;
    const partialStmt = db.prepare("SELECT COUNT(*) as count FROM invoices WHERE status = 'PARTIALLY_PAID'").get() as any;
    const cancelStmt = db.prepare("SELECT COUNT(*) as count FROM invoices WHERE status = 'CANCELLED'").get() as any;
    
    // Invoiced value excludes CANCELLED
    const totalValStmt = db.prepare("SELECT SUM(total) as sum FROM invoices WHERE status != 'CANCELLED'").get() as any;
    // Paid value from PAID
    const paidValStmt = db.prepare("SELECT SUM(total) as sum FROM invoices WHERE status = 'PAID'").get() as any;

    return {
      total_invoices: Number(totalStmt?.count) || 0,
      draft_invoices: Number(draftStmt?.count) || 0,
      issued_invoices: Number(issuedStmt?.count) || 0,
      paid_invoices: Number(paidStmt?.count) || 0,
      partially_paid_invoices: Number(partialStmt?.count) || 0,
      cancelled_invoices: Number(cancelStmt?.count) || 0,
      total_invoiced_value: Math.round((Number(totalValStmt?.sum) || 0) * 100) / 100,
      total_paid_value: Math.round((Number(paidValStmt?.sum) || 0) * 100) / 100,
    };
  }
}
