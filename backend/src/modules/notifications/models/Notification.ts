import crypto from 'crypto';
import { db } from '../../../database/connection';
import {
  ICreateNotificationDto,
  INotification,
  INotificationFilterQuery,
} from '../types/notification.types';

export class NotificationModel {
  /**
   * Helper to map a raw database row to a typed INotification object.
   */
  private static mapRow(row: any): INotification {
    return {
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      reference_type: row.reference_type,
      reference_id: row.reference_id,
      is_read: Boolean(row.is_read),
      created_at: row.created_at,
    };
  }

  /**
   * Create a new notification record.
   */
  static create(dto: ICreateNotificationDto): INotification {
    const id = `notif_${crypto.randomBytes(6).toString('hex')}`;
    const stmt = db.prepare(`
      INSERT INTO notifications (
        id, user_id, type, title, message, reference_type, reference_id, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))
    `);

    stmt.run(
      id,
      dto.user_id,
      dto.type,
      dto.title,
      dto.message,
      dto.reference_type || null,
      dto.reference_id || null
    );

    return this.findById(id)!;
  }

  /**
   * Find notification by unique ID.
   */
  static findById(id: string): INotification | null {
    const row = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as any;
    return row ? this.mapRow(row) : null;
  }

  /**
   * Find all notifications for a specific user with filtering and pagination.
   */
  static findByUserId(
    userId: string,
    filters: INotificationFilterQuery = {}
  ): { notifications: INotification[]; total: number; unread_count: number } {
    let baseWhere = `WHERE user_id = ?`;
    const params: any[] = [userId];

    if (filters.is_read !== undefined && filters.is_read !== '') {
      const isReadStr = String(filters.is_read).toLowerCase();
      const isReadVal = isReadStr === 'true' || isReadStr === '1' ? 1 : 0;
      baseWhere += ` AND is_read = ?`;
      params.push(isReadVal);
    }

    if (filters.type && filters.type !== '') {
      baseWhere += ` AND type = ?`;
      params.push(filters.type);
    }

    // Count total filtered
    const countRow = db
      .prepare(`SELECT COUNT(*) as count FROM notifications ${baseWhere}`)
      .get(...params) as any;
    const total = Number(countRow?.count) || 0;

    // Count unread total for this user
    const unreadRow = db
      .prepare(`SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`)
      .get(userId) as any;
    const unread_count = Number(unreadRow?.count) || 0;

    // Pagination
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));
    const offset = (page - 1) * limit;

    const dataQuery = `
      SELECT * FROM notifications 
      ${baseWhere} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const rows = db.prepare(dataQuery).all(...params, limit, offset) as any[];

    return {
      notifications: rows.map(this.mapRow),
      total,
      unread_count,
    };
  }

  /**
   * Get unread notification count for a specific user.
   */
  static getUnreadCount(userId: string): number {
    const row = db
      .prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0')
      .get(userId) as any;
    return Number(row?.count) || 0;
  }

  /**
   * Mark a single notification as read for a given user.
   */
  static markAsRead(id: string, userId: string): boolean {
    const result = db
      .prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
      .run(id, userId);
    return Number(result.changes) > 0;
  }

  /**
   * Mark all unread notifications as read for a given user.
   */
  static markAllAsRead(userId: string): number {
    const result = db
      .prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0')
      .run(userId);
    return Number(result.changes);
  }

  /**
   * Delete a notification for a user.
   */
  static delete(id: string, userId: string): boolean {
    const result = db
      .prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?')
      .run(id, userId);
    return Number(result.changes) > 0;
  }

  /**
   * Duplicate prevention check: Checks if an active unread or recent notification already exists
   * for the given user, type, reference_type, and reference_id (within 24 hours).
   */
  static existsUnreadOrRecent(
    userId: string,
    type: string,
    referenceType: string,
    referenceId: string
  ): boolean {
    const row = db
      .prepare(`
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_id = ? 
          AND type = ? 
          AND reference_type = ? 
          AND reference_id = ? 
          AND (is_read = 0 OR datetime(created_at) >= datetime('now', '-1 day'))
      `)
      .get(userId, type, referenceType, referenceId) as any;
    return Number(row?.count) > 0;
  }

  static existsUnread(
    userId: string,
    type: string,
    referenceType: string,
    referenceId: string
  ): boolean {
    return this.existsUnreadOrRecent(userId, type, referenceType, referenceId);
  }
}
