import { db } from '../../../database/connection';
import { IUser, IUserResponse, UserRole, UserStatus } from '../types/auth.types';

export class UserModel {
  /**
   * Find a user by ID
   */
  static findById(id: string): IUser | null {
    const stmt = db.prepare(`
      SELECT id, full_name, email, password_hash, role_id, status, created_at, updated_at
      FROM users
      WHERE id = ?
    `);
    const user = stmt.get(id) as unknown as IUser | undefined;
    return user || null;
  }

  /**
   * Find a user by email (case-insensitive)
   */
  static findByEmail(email: string): IUser | null {
    const stmt = db.prepare(`
      SELECT id, full_name, email, password_hash, role_id, status, created_at, updated_at
      FROM users
      WHERE LOWER(email) = LOWER(?)
    `);
    const user = stmt.get(email.trim()) as unknown as IUser | undefined;
    return user || null;
  }

  /**
   * Create a new user record
   */
  static create(user: {
    id: string;
    full_name: string;
    email: string;
    password_hash: string;
    role_id: string;
    status: UserStatus;
  }): IUser {
    const stmt = db.prepare(`
      INSERT INTO users (id, full_name, email, password_hash, role_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    stmt.run(user.id, user.full_name, user.email.toLowerCase().trim(), user.password_hash, user.role_id, user.status);

    const created = this.findById(user.id);
    if (!created) {
      throw new Error('Failed to retrieve user after creation');
    }
    return created;
  }

  /**
   * Update profile fields (full_name, email)
   */
  static update(id: string, updates: { full_name?: string; email?: string }): IUser | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const newFullName = updates.full_name !== undefined ? updates.full_name.trim() : existing.full_name;
    const newEmail = updates.email !== undefined ? updates.email.toLowerCase().trim() : existing.email;

    const stmt = db.prepare(`
      UPDATE users
      SET full_name = ?, email = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(newFullName, newEmail, id);

    return this.findById(id);
  }

  /**
   * Strip sensitive fields (like password_hash) to produce an IUserResponse
   */
  static toResponse(user: IUser, roleName: UserRole): IUserResponse {
    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: roleName,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  /**
   * Find users with optional filters, search, and pagination (Admin use)
   */
  static findFiltered(query: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): { users: IUserResponse[]; total: number } {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (query.role) {
      whereClause += ' AND r.name = ?';
      params.push(query.role);
    }

    if (query.status) {
      whereClause += ' AND u.status = ?';
      params.push(query.status);
    }

    if (query.search) {
      whereClause += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.id LIKE ?)';
      params.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`);
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ${whereClause}
    `);
    const countRow = countStmt.get(...params) as any;
    const total = Number(countRow?.count) || 0;

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const offset = (page - 1) * limit;

    const dataStmt = db.prepare(`
      SELECT u.id, u.full_name, u.email, u.status, u.created_at, u.updated_at, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const rows = dataStmt.all(...params, limit, offset) as any[];

    const users: IUserResponse[] = rows.map((r) => ({
      id: r.id,
      full_name: r.full_name,
      email: r.email,
      role: (r.role_name || 'VIEWER') as UserRole,
      status: r.status as UserStatus,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return { users, total };
  }

  /**
   * Update user status (ACTIVE / INACTIVE)
   */
  static updateStatus(id: string, status: UserStatus): IUser | null {
    db.prepare(`
      UPDATE users
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, id);

    return this.findById(id);
  }

  /**
   * Update user role
   */
  static updateRole(id: string, roleId: string): IUser | null {
    db.prepare(`
      UPDATE users
      SET role_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(roleId, id);

    return this.findById(id);
  }

  /**
   * Admin full update (full_name, email, optional password_hash, role_id, status)
   */
  static adminUpdate(id: string, updates: {
    full_name?: string;
    email?: string;
    password_hash?: string;
    role_id?: string;
    status?: UserStatus;
  }): IUser | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const newFullName = updates.full_name !== undefined ? updates.full_name.trim() : existing.full_name;
    const newEmail = updates.email !== undefined ? updates.email.toLowerCase().trim() : existing.email;
    const newPasswordHash = updates.password_hash !== undefined ? updates.password_hash : existing.password_hash;
    const newRoleId = updates.role_id !== undefined ? updates.role_id : existing.role_id;
    const newStatus = updates.status !== undefined ? updates.status : existing.status;

    db.prepare(`
      UPDATE users
      SET full_name = ?, email = ?, password_hash = ?, role_id = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newFullName, newEmail, newPasswordHash, newRoleId, newStatus, id);

    return this.findById(id);
  }

  /**
   * Count active users holding the ADMIN role
   */
  static countActiveAdmins(): number {
    const row = db.prepare(`
      SELECT COUNT(*) as count
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = 'ADMIN' AND u.status = 'ACTIVE'
    `).get() as any;

    return Number(row?.count) || 0;
  }
}
