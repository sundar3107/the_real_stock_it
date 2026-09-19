import crypto from 'crypto';
import { db } from '../../../database/connection';
import { ISupplier, ISupplierFilterQuery, ISupplierFormData, ISupplierMetrics, SupplierStatus } from '../types/supplier.types';

export class SupplierModel {
  static findWithPagination(query: ISupplierFilterQuery = {}): {
    items: ISupplier[];
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
        '(s.supplier_name LIKE ? OR s.company_name LIKE ? OR s.email LIKE ? OR s.phone LIKE ? OR s.contact_person LIKE ? OR s.id LIKE ?)'
      );
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (query.status && query.status !== 'ALL') {
      whereClauses.push('s.status = ?');
      params.push(query.status);
    }

    if (query.city && query.city.trim()) {
      whereClauses.push('s.city LIKE ?');
      params.push(`%${query.city.trim()}%`);
    }

    if (query.state && query.state.trim()) {
      whereClauses.push('s.state LIKE ?');
      params.push(`%${query.state.trim()}%`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total matching
    const countSql = `SELECT COUNT(*) as count FROM suppliers s ${whereSql}`;
    const countRow = db.prepare(countSql).get(...params) as any;
    const total = countRow ? Number(countRow.count) : 0;

    // Sorting
    const validSortColumns: Record<string, string> = {
      supplier_name: 's.supplier_name',
      company_name: 's.company_name',
      city: 's.city',
      created_at: 's.created_at',
      updated_at: 's.updated_at',
    };
    const sortCol = validSortColumns[query.sort_by || ''] || 's.created_at';
    const sortDir = query.sort_order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const itemsSql = `
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM supplier_products sp WHERE sp.supplier_id = s.id) AS product_count
      FROM suppliers s
      ${whereSql}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `;

    const items = (db.prepare(itemsSql).all(...params, limit, offset) as unknown) as ISupplier[];
    const total_pages = Math.ceil(total / limit) || 1;

    return {
      items,
      total,
      page,
      limit,
      total_pages,
    };
  }

  static findById(id: string): ISupplier | null {
    const sql = `
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM supplier_products sp WHERE sp.supplier_id = s.id) AS product_count
      FROM suppliers s
      WHERE s.id = ?
    `;
    const row = (db.prepare(sql).get(id) as unknown) as ISupplier | undefined;
    return row || null;
  }

  static findByEmail(email: string): ISupplier | null {
    const sql = 'SELECT * FROM suppliers WHERE email = ? COLLATE NOCASE';
    const row = (db.prepare(sql).get(email.trim()) as unknown) as ISupplier | undefined;
    return row || null;
  }

  static create(data: ISupplierFormData): ISupplier {
    const id = `sup_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO suppliers (
        id, supplier_name, company_name, email, phone, alternate_phone,
        address, city, state, country, postal_code, tax_number,
        contact_person, notes, status, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      id,
      data.supplier_name.trim(),
      data.company_name.trim(),
      data.email.trim().toLowerCase(),
      data.phone.trim(),
      data.alternate_phone ? data.alternate_phone.trim() : null,
      data.address.trim(),
      data.city.trim(),
      data.state.trim(),
      data.country.trim(),
      data.postal_code.trim(),
      data.tax_number ? data.tax_number.trim() : null,
      data.contact_person.trim(),
      data.notes ? data.notes.trim() : null,
      data.status || 'ACTIVE',
      now,
      now
    );

    return this.findById(id)!;
  }

  static update(id: string, data: Partial<ISupplierFormData>): ISupplier | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (data.supplier_name !== undefined) {
      updates.push('supplier_name = ?');
      params.push(data.supplier_name.trim());
    }
    if (data.company_name !== undefined) {
      updates.push('company_name = ?');
      params.push(data.company_name.trim());
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
    if (data.contact_person !== undefined) {
      updates.push('contact_person = ?');
      params.push(data.contact_person.trim());
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

    updates.push('updated_at = datetime(\'now\')');
    params.push(id);

    const sql = `UPDATE suppliers SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...params);

    return this.findById(id);
  }

  static updateStatus(id: string, status: SupplierStatus): ISupplier | null {
    const stmt = db.prepare(`
      UPDATE suppliers 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    const info = stmt.run(status, id);
    if (info.changes === 0) return null;
    return this.findById(id);
  }

  static delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM suppliers WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  static getMetrics(): ISupplierMetrics {
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM suppliers').get() as any;
    const activeRow = db.prepare("SELECT COUNT(*) as count FROM suppliers WHERE status = 'ACTIVE'").get() as any;
    const inactiveRow = db.prepare("SELECT COUNT(*) as count FROM suppliers WHERE status = 'INACTIVE'").get() as any;

    return {
      total_suppliers: totalRow ? Number(totalRow.count) : 0,
      active_suppliers: activeRow ? Number(activeRow.count) : 0,
      inactive_suppliers: inactiveRow ? Number(inactiveRow.count) : 0,
    };
  }
}
