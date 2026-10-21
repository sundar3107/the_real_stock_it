import crypto from 'crypto';
import { db } from '../../../database/connection';
import {
  ISalesOrder,
  ISalesFilterQuery,
  ISalesMetrics,
  SalesStatus,
} from '../types/sales.types';

export class SalesOrderModel {
  static generateOrderNumber(): string {
    const year = new Date().getFullYear();
    const countRow = db
      .prepare("SELECT COUNT(*) as count FROM sales_orders WHERE order_number LIKE ?")
      .get(`SO-${year}-%`) as any;
    const nextSeq = (countRow ? Number(countRow.count) : 0) + 1;
    const seqStr = String(nextSeq).padStart(4, '0');
    const orderNumber = `SO-${year}-${seqStr}`;

    // Verify uniqueness
    const exists = db
      .prepare('SELECT id FROM sales_orders WHERE order_number = ?')
      .get(orderNumber);
    if (exists) {
      const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
      return `SO-${year}-${seqStr}-${randomSuffix}`;
    }
    return orderNumber;
  }

  static findWithPagination(query: ISalesFilterQuery = {}): {
    items: ISalesOrder[];
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
        '(so.id LIKE ? OR so.order_number LIKE ? OR c.customer_name LIKE ? OR c.company_name LIKE ? OR so.notes LIKE ?)'
      );
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (query.status && query.status !== 'ALL') {
      whereClauses.push('so.status = ?');
      params.push(query.status);
    }

    if (query.customer_id && query.customer_id.trim()) {
      whereClauses.push('so.customer_id = ?');
      params.push(query.customer_id.trim());
    }

    if (query.from_date && query.from_date.trim()) {
      whereClauses.push('so.order_date >= ?');
      params.push(query.from_date.trim());
    }

    if (query.to_date && query.to_date.trim()) {
      whereClauses.push('so.order_date <= ?');
      params.push(query.to_date.trim());
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count query
    const countSql = `
      SELECT COUNT(*) as count 
      FROM sales_orders so
      LEFT JOIN customers c ON so.customer_id = c.id
      ${whereSql}
    `;
    const countRow = db.prepare(countSql).get(...params) as any;
    const total = countRow ? Number(countRow.count) : 0;

    // Sorting
    const validSortColumns: Record<string, string> = {
      order_date: 'so.order_date',
      total: 'so.total',
      status: 'so.status',
      created_at: 'so.created_at',
      order_number: 'so.order_number',
    };
    const sortCol = validSortColumns[query.sort_by || ''] || 'so.created_at';
    const sortDir = query.sort_order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const itemsSql = `
      SELECT 
        so.*,
        c.customer_name,
        c.company_name,
        u.full_name AS created_by_name,
        (SELECT COUNT(*) FROM sales_order_items soi WHERE soi.sales_order_id = so.id) AS item_count
      FROM sales_orders so
      LEFT JOIN customers c ON so.customer_id = c.id
      LEFT JOIN users u ON so.created_by = u.id
      ${whereSql}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `;

    const items = (db.prepare(itemsSql).all(...params, limit, offset) as unknown) as ISalesOrder[];
    const total_pages = Math.ceil(total / limit) || 1;

    return {
      items,
      total,
      page,
      limit,
      total_pages,
    };
  }

  static findById(id: string): ISalesOrder | null {
    const sql = `
      SELECT 
        so.*,
        c.customer_name,
        c.company_name,
        u.full_name AS created_by_name,
        (SELECT COUNT(*) FROM sales_order_items soi WHERE soi.sales_order_id = so.id) AS item_count
      FROM sales_orders so
      LEFT JOIN customers c ON so.customer_id = c.id
      LEFT JOIN users u ON so.created_by = u.id
      WHERE so.id = ? OR so.order_number = ?
    `;
    const row = (db.prepare(sql).get(id, id) as unknown) as ISalesOrder | undefined;
    return row || null;
  }

  static create(order: {
    customer_id: string;
    order_number?: string;
    order_date?: string;
    status?: SalesStatus;
    subtotal: number;
    tax?: number;
    discount?: number;
    total: number;
    notes?: string | null;
    created_by: string;
  }): ISalesOrder {
    const id = `so_${crypto.randomUUID()}`;
    const order_number = order.order_number || this.generateOrderNumber();
    const order_date = order.order_date || new Date().toISOString().split('T')[0];
    const status = order.status || 'DRAFT';
    const subtotal = Number(order.subtotal) || 0;
    const tax = Number(order.tax) || 0;
    const discount = Number(order.discount) || 0;
    const total = Number(order.total) || 0;
    const notes = order.notes?.trim() || null;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO sales_orders (
        id, order_number, customer_id, order_date, status,
        subtotal, tax, discount, total, notes,
        created_by, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?
      )
    `);

    stmt.run(
      id,
      order_number,
      order.customer_id,
      order_date,
      status,
      subtotal,
      tax,
      discount,
      total,
      notes,
      order.created_by,
      now,
      now
    );

    return this.findById(id)!;
  }

  static update(
    id: string,
    updates: {
      customer_id?: string;
      order_date?: string;
      subtotal?: number;
      tax?: number;
      discount?: number;
      total?: number;
      notes?: string | null;
      status?: SalesStatus;
    }
  ): ISalesOrder | null {
    const setClauses: string[] = ['updated_at = ?'];
    const params: any[] = [new Date().toISOString()];

    if (updates.customer_id !== undefined) {
      setClauses.push('customer_id = ?');
      params.push(updates.customer_id);
    }
    if (updates.order_date !== undefined) {
      setClauses.push('order_date = ?');
      params.push(updates.order_date);
    }
    if (updates.subtotal !== undefined) {
      setClauses.push('subtotal = ?');
      params.push(updates.subtotal);
    }
    if (updates.tax !== undefined) {
      setClauses.push('tax = ?');
      params.push(updates.tax);
    }
    if (updates.discount !== undefined) {
      setClauses.push('discount = ?');
      params.push(updates.discount);
    }
    if (updates.total !== undefined) {
      setClauses.push('total = ?');
      params.push(updates.total);
    }
    if (updates.notes !== undefined) {
      setClauses.push('notes = ?');
      params.push(updates.notes ? updates.notes.trim() : null);
    }
    if (updates.status !== undefined) {
      setClauses.push('status = ?');
      params.push(updates.status);
    }

    params.push(id);
    const sql = `UPDATE sales_orders SET ${setClauses.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...params);

    return this.findById(id);
  }

  static updateStatus(id: string, newStatus: SalesStatus): ISalesOrder | null {
    const now = new Date().toISOString();
    const stmt = db.prepare('UPDATE sales_orders SET status = ?, updated_at = ? WHERE id = ?');
    stmt.run(newStatus, now, id);
    return this.findById(id);
  }

  static getMetrics(): ISalesMetrics {
    const totalOrdersRow = db
      .prepare('SELECT COUNT(*) as count FROM sales_orders')
      .get() as any;
    const draftOrdersRow = db
      .prepare("SELECT COUNT(*) as count FROM sales_orders WHERE status = 'DRAFT'")
      .get() as any;
    const confirmedOrdersRow = db
      .prepare("SELECT COUNT(*) as count FROM sales_orders WHERE status = 'CONFIRMED'")
      .get() as any;
    const processingOrdersRow = db
      .prepare("SELECT COUNT(*) as count FROM sales_orders WHERE status = 'PROCESSING'")
      .get() as any;
    const completedOrdersRow = db
      .prepare("SELECT COUNT(*) as count FROM sales_orders WHERE status = 'COMPLETED'")
      .get() as any;
    const cancelledOrdersRow = db
      .prepare("SELECT COUNT(*) as count FROM sales_orders WHERE status = 'CANCELLED'")
      .get() as any;
    const totalSpendRow = db
      .prepare("SELECT SUM(total) as revenue FROM sales_orders WHERE status != 'CANCELLED'")
      .get() as any;

    return {
      total_orders: totalOrdersRow ? Number(totalOrdersRow.count) : 0,
      draft_orders: draftOrdersRow ? Number(draftOrdersRow.count) : 0,
      confirmed_orders: confirmedOrdersRow ? Number(confirmedOrdersRow.count) : 0,
      processing_orders: processingOrdersRow ? Number(processingOrdersRow.count) : 0,
      completed_orders: completedOrdersRow ? Number(completedOrdersRow.count) : 0,
      cancelled_orders: cancelledOrdersRow ? Number(cancelledOrdersRow.count) : 0,
      total_revenue: totalSpendRow && totalSpendRow.revenue ? Math.round(Number(totalSpendRow.revenue) * 100) / 100 : 0,
    };
  }
}
