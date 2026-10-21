import crypto from 'crypto';
import { db } from '../../../database/connection';
import {
  ICustomer,
  ICustomerFilterQuery,
  ICustomerFormData,
  ICustomerMetrics,
  CustomerStatus,
} from '../types/customer.types';

export class CustomerModel {
  static findWithPagination(query: ICustomerFilterQuery = {}): {
    items: ICustomer[];
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
        '(c.customer_name LIKE ? OR c.company_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.id LIKE ?)'
      );
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (query.status && query.status !== 'ALL') {
      whereClauses.push('c.status = ?');
      params.push(query.status);
    }

    if (query.city && query.city.trim()) {
      whereClauses.push('c.city LIKE ?');
      params.push(`%${query.city.trim()}%`);
    }

    if (query.state && query.state.trim()) {
      whereClauses.push('c.state LIKE ?');
      params.push(`%${query.state.trim()}%`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total matching
    const countSql = `SELECT COUNT(*) as count FROM customers c ${whereSql}`;
    const countRow = db.prepare(countSql).get(...params) as any;
    const total = countRow ? Number(countRow.count) : 0;

    // Sorting
    const validSortColumns: Record<string, string> = {
      customer_name: 'c.customer_name',
      company_name: 'c.company_name',
      city: 'c.city',
      state: 'c.state',
      created_at: 'c.created_at',
      updated_at: 'c.updated_at',
    };
    const sortCol = validSortColumns[query.sort_by || ''] || 'c.created_at';
    const sortDir = query.sort_order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const itemsSql = `
      SELECT c.*
      FROM customers c
      ${whereSql}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `;

    const items = (db.prepare(itemsSql).all(...params, limit, offset) as unknown) as ICustomer[];
    const total_pages = Math.ceil(total / limit) || 1;

    return {
      items,
      total,
      page,
      limit,
      total_pages,
    };
  }

  static findById(id: string): ICustomer | null {
    const sql = 'SELECT * FROM customers WHERE id = ?';
    const row = (db.prepare(sql).get(id) as unknown) as ICustomer | undefined;
    return row || null;
  }

  static findByEmail(email: string): ICustomer | null {
    const sql = 'SELECT * FROM customers WHERE email = ? COLLATE NOCASE';
    const row = (db.prepare(sql).get(email.trim()) as unknown) as ICustomer | undefined;
    return row || null;
  }

  static create(data: ICustomerFormData): ICustomer {
    const id = `cust_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO customers (
        id, customer_name, company_name, email, phone, alternate_phone,
        address, city, state, country, postal_code, tax_number,
        notes, status, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `);

    stmt.run(
      id,
      data.customer_name.trim(),
      data.company_name ? data.company_name.trim() : null,
      data.email.trim().toLowerCase(),
      data.phone.trim(),
      data.alternate_phone ? data.alternate_phone.trim() : null,
      data.address.trim(),
      data.city.trim(),
      data.state.trim(),
      data.country.trim(),
      data.postal_code.trim(),
      data.tax_number ? data.tax_number.trim() : null,
      data.notes ? data.notes.trim() : null,
      data.status || 'ACTIVE',
      now,
      now
    );

    return this.findById(id)!;
  }

  static update(id: string, data: Partial<ICustomerFormData>): ICustomer | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (data.customer_name !== undefined) {
      updates.push('customer_name = ?');
      params.push(data.customer_name.trim());
    }
    if (data.company_name !== undefined) {
      updates.push('company_name = ?');
      params.push(data.company_name ? data.company_name.trim() : null);
    }
    if (data.email !== undefined) {
      updates.push('email = ?');
      params.push(data.email.trim().toLowerCase());
    }
    if (data.phone !== undefined) {
      updates.push('phone = ?');
      params.push(data.phone.trim());
    }
    if (data.alternate_phone !== undefined) {
      updates.push('alternate_phone = ?');
      params.push(data.alternate_phone ? data.alternate_phone.trim() : null);
    }
    if (data.address !== undefined) {
      updates.push('address = ?');
      params.push(data.address.trim());
    }
    if (data.city !== undefined) {
      updates.push('city = ?');
      params.push(data.city.trim());
    }
    if (data.state !== undefined) {
      updates.push('state = ?');
      params.push(data.state.trim());
    }
    if (data.country !== undefined) {
      updates.push('country = ?');
      params.push(data.country.trim());
    }
    if (data.postal_code !== undefined) {
      updates.push('postal_code = ?');
      params.push(data.postal_code.trim());
    }
    if (data.tax_number !== undefined) {
      updates.push('tax_number = ?');
      params.push(data.tax_number ? data.tax_number.trim() : null);
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

    const sql = `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...params);

    return this.findById(id);
  }

  static updateStatus(id: string, status: CustomerStatus): ICustomer | null {
    const stmt = db.prepare(`
      UPDATE customers 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    const info = stmt.run(status, id);
    if (info.changes === 0) return null;
    return this.findById(id);
  }

  static delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM customers WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  static getMetrics(): ICustomerMetrics {
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM customers').get() as any;
    const activeRow = db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'ACTIVE'").get() as any;
    const inactiveRow = db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'INACTIVE'").get() as any;

    return {
      total_customers: totalRow ? Number(totalRow.count) : 0,
      active_customers: activeRow ? Number(activeRow.count) : 0,
      inactive_customers: inactiveRow ? Number(inactiveRow.count) : 0,
    };
  }
}
