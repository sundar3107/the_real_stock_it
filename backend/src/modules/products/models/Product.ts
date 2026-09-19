import { db } from '../../../database/connection';
import { IProduct, IProductFilterQuery, IPaginatedResult, ProductStatus, StockStatus } from '../types/product.types';

export class ProductModel {
  /**
   * Find product by unique ID including joined category name
   */
  static findById(id: string): IProduct | null {
    const stmt = db.prepare(`
      SELECT 
        p.id, p.name, p.sku, p.category_id, c.name as category_name,
        p.description, p.unit, p.purchase_price, p.selling_price,
        p.opening_stock, p.current_stock, p.reorder_level, p.status,
        p.created_at, p.updated_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `);
    const row = stmt.get(id) as unknown as IProduct | undefined;
    if (!row) return null;
    return this.attachStockStatus(row);
  }

  /**
   * Find product by unique SKU (case-insensitive)
   */
  static findBySku(sku: string): IProduct | null {
    const stmt = db.prepare(`
      SELECT 
        p.id, p.name, p.sku, p.category_id, c.name as category_name,
        p.description, p.unit, p.purchase_price, p.selling_price,
        p.opening_stock, p.current_stock, p.reorder_level, p.status,
        p.created_at, p.updated_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE LOWER(p.sku) = LOWER(?)
    `);
    const row = stmt.get(sku.trim()) as unknown as IProduct | undefined;
    if (!row) return null;
    return this.attachStockStatus(row);
  }

  /**
   * Retrieve filtered, searched, sorted, and paginated products
   */
  static findFiltered(query: IProductFilterQuery): IPaginatedResult<IProduct> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ['1=1'];
    const params: any[] = [];

    // Search query matches name, sku, or id
    if (query.search && query.search.trim() !== '') {
      const searchTerm = `%${query.search.trim()}%`;
      whereClauses.push('(p.name LIKE ? OR p.sku LIKE ? OR p.id LIKE ?)');
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Category filter
    if (query.category_id && query.category_id.trim() !== '' && query.category_id !== 'ALL') {
      whereClauses.push('p.category_id = ?');
      params.push(query.category_id.trim());
    }

    // Status filter
    if (query.status && query.status !== 'ALL') {
      whereClauses.push('p.status = ?');
      params.push(query.status);
    }

    // Stock status filter (calculated dynamically)
    if (query.stock_status && query.stock_status !== 'ALL') {
      if (query.stock_status === 'OUT_OF_STOCK') {
        whereClauses.push('p.current_stock <= 0');
      } else if (query.stock_status === 'LOW_STOCK') {
        whereClauses.push('p.current_stock > 0 AND p.current_stock <= p.reorder_level');
      } else if (query.stock_status === 'IN_STOCK') {
        whereClauses.push('p.current_stock > p.reorder_level');
      }
    }

    const whereSql = whereClauses.join(' AND ');

    // Total count query
    const countSql = `SELECT COUNT(*) as total FROM products p WHERE ${whereSql}`;
    const countStmt = db.prepare(countSql);
    const countResult = countStmt.get(...params) as any;
    const total = countResult ? countResult.total : 0;

    // Sorting
    const allowedSortFields: Record<string, string> = {
      name: 'p.name',
      sku: 'p.sku',
      selling_price: 'p.selling_price',
      current_stock: 'p.current_stock',
      created_at: 'p.created_at',
    };
    const sortField = query.sort_by && allowedSortFields[query.sort_by] ? allowedSortFields[query.sort_by] : 'p.created_at';
    const sortOrder = query.sort_order && query.sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Data query
    const dataSql = `
      SELECT 
        p.id, p.name, p.sku, p.category_id, c.name as category_name,
        p.description, p.unit, p.purchase_price, p.selling_price,
        p.opening_stock, p.current_stock, p.reorder_level, p.status,
        p.created_at, p.updated_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereSql}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    const dataStmt = db.prepare(dataSql);
    const rawRows = dataStmt.all(...params, limit, offset) as unknown as IProduct[];
    const items = rawRows.map((r) => this.attachStockStatus(r));

    return {
      items,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Create a new product record
   */
  static create(data: {
    id: string;
    name: string;
    sku: string;
    category_id: string;
    description?: string | null;
    unit: string;
    purchase_price: number;
    selling_price: number;
    opening_stock: number;
    current_stock: number;
    reorder_level: number;
    status: ProductStatus;
  }): IProduct {
    const stmt = db.prepare(`
      INSERT INTO products (
        id, name, sku, category_id, description, unit,
        purchase_price, selling_price, opening_stock, current_stock,
        reorder_level, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    stmt.run(
      data.id,
      data.name.trim(),
      data.sku.trim().toUpperCase(),
      data.category_id,
      data.description ? data.description.trim() : null,
      data.unit.trim(),
      data.purchase_price,
      data.selling_price,
      data.opening_stock,
      data.current_stock,
      data.reorder_level,
      data.status
    );

    const created = this.findById(data.id);
    if (!created) throw new Error('Failed to retrieve product after creation');
    return created;
  }

  /**
   * Update master product attributes.
   * NOTE: Does NOT alter stock levels; stock adjustments will later be managed by the Inventory module.
   */
  static update(
    id: string,
    updates: {
      name?: string;
      sku?: string;
      category_id?: string;
      description?: string | null;
      unit?: string;
      purchase_price?: number;
      selling_price?: number;
      reorder_level?: number;
      status?: ProductStatus;
    }
  ): IProduct | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const newName = updates.name !== undefined ? updates.name.trim() : existing.name;
    const newSku = updates.sku !== undefined ? updates.sku.trim().toUpperCase() : existing.sku;
    const newCategoryId = updates.category_id !== undefined ? updates.category_id : existing.category_id;
    const newDesc = updates.description !== undefined ? (updates.description ? updates.description.trim() : null) : existing.description;
    const newUnit = updates.unit !== undefined ? updates.unit.trim() : existing.unit;
    const newPurchasePrice = updates.purchase_price !== undefined ? updates.purchase_price : existing.purchase_price;
    const newSellingPrice = updates.selling_price !== undefined ? updates.selling_price : existing.selling_price;
    const newReorderLevel = updates.reorder_level !== undefined ? updates.reorder_level : existing.reorder_level;
    const newStatus = updates.status !== undefined ? updates.status : existing.status;

    const stmt = db.prepare(`
      UPDATE products
      SET name = ?, sku = ?, category_id = ?, description = ?, unit = ?,
          purchase_price = ?, selling_price = ?, reorder_level = ?, status = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `);

    stmt.run(
      newName,
      newSku,
      newCategoryId,
      newDesc,
      newUnit,
      newPurchasePrice,
      newSellingPrice,
      newReorderLevel,
      newStatus,
      id
    );

    return this.findById(id);
  }

  /**
   * Soft-deactivate a product. Preserves historical relationships.
   */
  static deactivate(id: string): IProduct | null {
    return this.update(id, { status: 'INACTIVE' });
  }

  /**
   * Helper to compute stock_status dynamically based on current stock vs reorder level
   */
  private static attachStockStatus(product: IProduct): IProduct {
    let stock_status: StockStatus = 'IN_STOCK';
    if (product.current_stock <= 0) {
      stock_status = 'OUT_OF_STOCK';
    } else if (product.current_stock <= product.reorder_level) {
      stock_status = 'LOW_STOCK';
    }
    return {
      ...product,
      stock_status,
    };
  }
}
