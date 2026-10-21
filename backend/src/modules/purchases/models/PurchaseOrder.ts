import crypto from 'crypto';
import { db } from '../../../database/connection';
import {
  IPurchaseOrder,
  IPurchaseFilterQuery,
  IPurchaseMetrics,
  PurchaseStatus,
} from '../types/purchase.types';

export class PurchaseOrderModel {
  static findWithPagination(query: IPurchaseFilterQuery = {}): {
    items: IPurchaseOrder[];
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
        '(po.id LIKE ? OR s.supplier_name LIKE ? OR s.company_name LIKE ? OR po.notes LIKE ?)'
      );
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (query.status && query.status !== 'ALL') {
      whereClauses.push('po.status = ?');
      params.push(query.status);
    }

    if (query.supplier_id && query.supplier_id.trim()) {
      whereClauses.push('po.supplier_id = ?');
      params.push(query.supplier_id.trim());
    }

    if (query.from_date && query.from_date.trim()) {
      whereClauses.push('po.order_date >= ?');
      params.push(query.from_date.trim());
    }

    if (query.to_date && query.to_date.trim()) {
      whereClauses.push('po.order_date <= ?');
      params.push(query.to_date.trim());
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count query
    const countSql = `
      SELECT COUNT(*) as count 
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      ${whereSql}
    `;
    const countRow = db.prepare(countSql).get(...params) as any;
    const total = countRow ? Number(countRow.count) : 0;

    // Sorting
    const validSortColumns: Record<string, string> = {
      order_date: 'po.order_date',
      total: 'po.total',
      status: 'po.status',
      created_at: 'po.created_at',
      updated_at: 'po.updated_at',
    };
    const sortCol = validSortColumns[query.sort_by || ''] || 'po.created_at';
    const sortDir = query.sort_order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const itemsSql = `
      SELECT 
        po.*,
        s.supplier_name,
        s.company_name AS supplier_company,
        u.full_name AS creator_name,
        (SELECT COUNT(*) FROM purchase_order_items poi WHERE poi.purchase_order_id = po.id) AS item_count
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN users u ON po.created_by = u.id
      ${whereSql}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `;

    const items = (db.prepare(itemsSql).all(...params, limit, offset) as unknown) as IPurchaseOrder[];
    const total_pages = Math.ceil(total / limit) || 1;

    return {
      items,
      total,
      page,
      limit,
      total_pages,
    };
  }

  static findById(id: string): IPurchaseOrder | null {
    const sql = `
      SELECT 
        po.*,
        s.supplier_name,
        s.company_name AS supplier_company,
        u.full_name AS creator_name,
        (SELECT COUNT(*) FROM purchase_order_items poi WHERE poi.purchase_order_id = po.id) AS item_count
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN users u ON po.created_by = u.id
      WHERE po.id = ?
    `;
    const row = (db.prepare(sql).get(id) as unknown) as IPurchaseOrder | undefined;
    return row || null;
  }

  static create(data: {
    supplier_id: string;
    order_date?: string;
    expected_delivery_date?: string | null;
    status?: PurchaseStatus;
    subtotal: number;
    tax?: number;
    discount?: number;
    total: number;
    notes?: string | null;
    created_by: string;
  }): IPurchaseOrder {
    const id = `po_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const orderDate = data.order_date || now.split('T')[0];

    const stmt = db.prepare(`
      INSERT INTO purchase_orders (
        id, supplier_id, order_date, expected_delivery_date, status,
        subtotal, tax, discount, total, notes, created_by, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      id,
      data.supplier_id,
      orderDate,
      data.expected_delivery_date || null,
      data.status || 'DRAFT',
      data.subtotal,
      data.tax || 0,
      data.discount || 0,
      data.total,
      data.notes ? data.notes.trim() : null,
      data.created_by,
      now,
      now
    );

    return this.findById(id)!;
  }

  static update(
    id: string,
    data: {
      supplier_id?: string;
      order_date?: string;
      expected_delivery_date?: string | null;
      subtotal?: number;
      tax?: number;
      discount?: number;
      total?: number;
      notes?: string | null;
      status?: PurchaseStatus;
    }
  ): IPurchaseOrder | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (data.supplier_id !== undefined) {
      updates.push('supplier_id = ?');
      params.push(data.supplier_id);
    }
    if (data.order_date !== undefined) {
      updates.push('order_date = ?');
      params.push(data.order_date);
    }
    if (data.expected_delivery_date !== undefined) {
      updates.push('expected_delivery_date = ?');
      params.push(data.expected_delivery_date || null);
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
      params.push(data.notes ? data.notes.trim() : null);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }

    if (updates.length === 0) return existing;

    updates.push("updated_at = datetime('now')");
    params.push(id);

    const sql = `UPDATE purchase_orders SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...params);

    return this.findById(id);
  }

  static updateStatus(id: string, status: PurchaseStatus): IPurchaseOrder | null {
    const stmt = db.prepare(`
      UPDATE purchase_orders 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    const info = stmt.run(status, id);
    if (info.changes === 0) return null;
    return this.findById(id);
  }

  static getMetrics(): IPurchaseMetrics {
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM purchase_orders').get() as any;
    const draftRow = db.prepare("SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'DRAFT'").get() as any;
    const orderedRow = db.prepare("SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'ORDERED'").get() as any;
    const partialRow = db.prepare("SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'PARTIALLY_RECEIVED'").get() as any;
    const receivedRow = db.prepare("SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'RECEIVED'").get() as any;
    const cancelledRow = db.prepare("SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'CANCELLED'").get() as any;
    const spendRow = db.prepare("SELECT SUM(total) as spend FROM purchase_orders WHERE status != 'CANCELLED'").get() as any;

    return {
      total_orders: totalRow ? Number(totalRow.count) : 0,
      draft_orders: draftRow ? Number(draftRow.count) : 0,
      ordered_orders: orderedRow ? Number(orderedRow.count) : 0,
      partially_received_orders: partialRow ? Number(partialRow.count) : 0,
      received_orders: receivedRow ? Number(receivedRow.count) : 0,
      cancelled_orders: cancelledRow ? Number(cancelledRow.count) : 0,
      total_spend: spendRow && spendRow.spend ? Number(spendRow.spend) : 0,
    };
  }
}
