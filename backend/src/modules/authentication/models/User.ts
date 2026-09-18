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
}
