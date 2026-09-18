import { db } from '../../../database/connection';
import { IRole, UserRole } from '../types/auth.types';

export class RoleModel {
  /**
   * Find a role by its unique ID
   */
  static findById(id: string): IRole | null {
    const stmt = db.prepare('SELECT id, name, description, created_at FROM roles WHERE id = ?');
    const role = stmt.get(id) as unknown as IRole | undefined;
    return role || null;
  }

  /**
   * Find a role by its enum/name
   */
  static findByName(name: UserRole): IRole | null {
    const stmt = db.prepare('SELECT id, name, description, created_at FROM roles WHERE name = ?');
    const role = stmt.get(name) as unknown as IRole | undefined;
    return role || null;
  }

  /**
   * Get all defined roles
   */
  static findAll(): IRole[] {
    const stmt = db.prepare('SELECT id, name, description, created_at FROM roles ORDER BY name ASC');
    return stmt.all() as unknown as IRole[];
  }
}
