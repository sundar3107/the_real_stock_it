import { db } from '../../../database/connection';
import { ICategory, ProductStatus } from '../types/product.types';

export class CategoryModel {
  /**
   * Retrieve all categories
   */
  static findAll(includeInactive: boolean = false): ICategory[] {
    const query = includeInactive
      ? 'SELECT id, name, description, status, created_at, updated_at FROM categories ORDER BY name ASC'
      : "SELECT id, name, description, status, created_at, updated_at FROM categories WHERE status = 'ACTIVE' ORDER BY name ASC";
    
    const stmt = db.prepare(query);
    return stmt.all() as unknown as ICategory[];
  }

  /**
   * Find a category by unique ID
   */
  static findById(id: string): ICategory | null {
    const stmt = db.prepare('SELECT id, name, description, status, created_at, updated_at FROM categories WHERE id = ?');
    const row = stmt.get(id) as unknown as ICategory | undefined;
    return row || null;
  }

  /**
   * Find a category by name (case-insensitive)
   */
  static findByName(name: string): ICategory | null {
    const stmt = db.prepare('SELECT id, name, description, status, created_at, updated_at FROM categories WHERE LOWER(name) = LOWER(?)');
    const row = stmt.get(name.trim()) as unknown as ICategory | undefined;
    return row || null;
  }

  /**
   * Create a new category
   */
  static create(data: { id: string; name: string; description?: string | null }): ICategory {
    const stmt = db.prepare(`
      INSERT INTO categories (id, name, description, status, created_at, updated_at)
      VALUES (?, ?, ?, 'ACTIVE', datetime('now'), datetime('now'))
    `);
    stmt.run(data.id, data.name.trim(), data.description ? data.description.trim() : null);

    const created = this.findById(data.id);
    if (!created) throw new Error('Failed to retrieve category after creation');
    return created;
  }

  /**
   * Update category fields
   */
  static update(id: string, updates: { name?: string; description?: string | null; status?: ProductStatus }): ICategory | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const newName = updates.name !== undefined ? updates.name.trim() : existing.name;
    const newDesc = updates.description !== undefined ? (updates.description ? updates.description.trim() : null) : existing.description;
    const newStatus = updates.status !== undefined ? updates.status : existing.status;

    const stmt = db.prepare(`
      UPDATE categories
      SET name = ?, description = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(newName, newDesc, newStatus, id);

    return this.findById(id);
  }

  /**
   * Soft-deactivate a category
   */
  static deactivate(id: string): ICategory | null {
    return this.update(id, { status: 'INACTIVE' });
  }

  /**
   * Count active products linked to this category
   */
  static countProductsByCategoryId(categoryId: string): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?');
    const res = stmt.get(categoryId) as any;
    return res ? res.count : 0;
  }
}
