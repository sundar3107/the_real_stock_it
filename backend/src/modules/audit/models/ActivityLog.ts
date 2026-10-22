import crypto from 'crypto';
import { db } from '../../../database/connection';
import {
  IActivityLog,
  IAuditFilterQuery,
  IRecordActivityDto,
} from '../types/audit.types';

function scrubSensitiveData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(scrubSensitiveData);

  const clean: Record<string, any> = {};
  const sensitiveKeys = [
    'password',
    'password_hash',
    'token',
    'secret',
    'confirm_password',
    'authorization',
  ];

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = scrubSensitiveData(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export class ActivityLogModel {
  private static parseJsonSafely(val: any): any {
    if (!val || typeof val !== 'string') return val;
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }

  private static mapRow(row: any): IActivityLog {
    return {
      id: row.id,
      user_id: row.user_id,
      user_name: row.user_name || 'System / Automated',
      user_email: row.user_email || null,
      action: row.action,
      module: row.module,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      description: row.description,
      old_value: this.parseJsonSafely(row.old_value),
      new_value: this.parseJsonSafely(row.new_value),
      metadata: this.parseJsonSafely(row.metadata),
      timestamp: row.timestamp,
    };
  }

  /**
   * Create an immutable audit log record.
   */
  static create(dto: IRecordActivityDto): IActivityLog {
    const id = `audit_${crypto.randomBytes(6).toString('hex')}`;

    const cleanOld = dto.old_value !== undefined ? JSON.stringify(scrubSensitiveData(dto.old_value)) : null;
    const cleanNew = dto.new_value !== undefined ? JSON.stringify(scrubSensitiveData(dto.new_value)) : null;
    const cleanMeta = dto.metadata !== undefined ? JSON.stringify(scrubSensitiveData(dto.metadata)) : null;

    db.prepare(`
      INSERT INTO activity_logs (
        id, user_id, action, module, entity_type, entity_id, description, old_value, new_value, metadata, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      id,
      dto.user_id || null,
      dto.action,
      dto.module,
      dto.entity_type || null,
      dto.entity_id || null,
      dto.description,
      cleanOld,
      cleanNew,
      cleanMeta
    );

    return this.findById(id)!;
  }

  /**
   * Find audit log record by ID with user attribution.
   */
  static findById(id: string): IActivityLog | null {
    const query = `
      SELECT 
        a.*,
        u.full_name AS user_name,
        u.email AS user_email
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `;
    const row = db.prepare(query).get(id) as any;
    return row ? this.mapRow(row) : null;
  }

  /**
   * Find filtered and paginated activity logs.
   */
  static findFiltered(query: IAuditFilterQuery = {}): { logs: IActivityLog[]; total: number } {
    let whereClause = `WHERE 1=1`;
    const params: any[] = [];

    if (query.user_id) {
      whereClause += ` AND a.user_id = ?`;
      params.push(query.user_id);
    }

    if (query.module) {
      whereClause += ` AND a.module = ?`;
      params.push(query.module);
    }

    if (query.action) {
      whereClause += ` AND a.action = ?`;
      params.push(query.action);
    }

    if (query.entity_type) {
      whereClause += ` AND a.entity_type = ?`;
      params.push(query.entity_type);
    }

    if (query.start_date) {
      whereClause += ` AND date(a.timestamp) >= date(?)`;
      params.push(query.start_date);
    }

    if (query.end_date) {
      whereClause += ` AND date(a.timestamp) <= date(?)`;
      params.push(query.end_date);
    }

    if (query.search) {
      whereClause += ` AND (a.description LIKE ? OR a.entity_id LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`, `%${query.search}%`);
    }

    // Total Count
    const countQuery = `
      SELECT COUNT(*) AS count
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
    `;
    const countRow = db.prepare(countQuery).get(...params) as any;
    const total = Number(countRow?.count) || 0;

    // Pagination
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const offset = (page - 1) * limit;

    const dataQuery = `
      SELECT 
        a.*,
        u.full_name AS user_name,
        u.email AS user_email
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.timestamp DESC, a.id DESC
      LIMIT ? OFFSET ?
    `;

    const rows = db.prepare(dataQuery).all(...params, limit, offset) as any[];

    return {
      logs: rows.map((r) => this.mapRow(r)),
      total,
    };
  }
}
