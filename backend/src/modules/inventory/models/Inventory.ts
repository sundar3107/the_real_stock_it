import { db } from '../../../database/connection';
import { IInventoryItem, IInventoryFilterQuery, IInventoryMetrics, StockStatus } from '../types/inventory.types';
import { IPaginatedResult } from '../../products/types/product.types';

export class InventoryModel {
  /**
   * Find inventory record for a specific product ID
   */
  static findByProductId(productId: string): IInventoryItem | null {
    const stmt = db.prepare(`
      SELECT 
        inv.id, inv.product_id, p.name as product_name, p.sku,
        p.category_id, c.name as category_name, p.unit,
        inv.current_quantity, p.reorder_level, p.status as product_status,
        inv.created_at, inv.updated_at
      FROM inventory inv
      JOIN products p ON inv.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE inv.product_id = ?
    `);
    const row = stmt.get(productId) as any;
    if (!row) return null;
    return this.attachStockStatus(row);
  }

  /**
   * Ensure an inventory record exists for the product (initializing from product opening_stock if missing)
   */
  static ensureInventoryRecord(productId: string): IInventoryItem {
    let item = this.findByProductId(productId);
    if (!item) {
      const prodStmt = db.prepare('SELECT opening_stock FROM products WHERE id = ?');
      const prod = prodStmt.get(productId) as any;
      const initialStock = prod ? prod.opening_stock : 0;
      
      const insertStmt = db.prepare(`
        INSERT INTO inventory (id, product_id, current_quantity, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `);
      insertStmt.run(`inv_${productId}`, productId, initialStock);
      item = this.findByProductId(productId)!;
    }
    return item;
  }

  /**
   * Filter, search, and paginate inventory items
   */
  static findFiltered(query: IInventoryFilterQuery): IPaginatedResult<IInventoryItem> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ['1=1'];
    const params: any[] = [];

    // Search query
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

    // Product status filter
    if (query.product_status && query.product_status !== 'ALL') {
      whereClauses.push('p.status = ?');
      params.push(query.product_status);
    }

    // Stock Status filter
    if (query.stock_status && query.stock_status !== 'ALL') {
      if (query.stock_status === 'OUT_OF_STOCK') {
        whereClauses.push('inv.current_quantity <= 0');
      } else if (query.stock_status === 'LOW_STOCK') {
        whereClauses.push('inv.current_quantity > 0 AND inv.current_quantity <= p.reorder_level');
      } else if (query.stock_status === 'IN_STOCK') {
        whereClauses.push('inv.current_quantity > p.reorder_level');
      }
    }

    const whereSql = whereClauses.join(' AND ');

    // Total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM inventory inv
      JOIN products p ON inv.product_id = p.id
      WHERE ${whereSql}
    `;
    const countStmt = db.prepare(countSql);
    const countResult = countStmt.get(...params) as any;
    const total = countResult ? countResult.total : 0;

    // Sorting
    const sortFieldMap: Record<string, string> = {
      product_name: 'p.name',
      sku: 'p.sku',
      current_quantity: 'inv.current_quantity',
      reorder_level: 'p.reorder_level',
      updated_at: 'inv.updated_at',
    };
    const sortField = query.sort_by && sortFieldMap[query.sort_by] ? sortFieldMap[query.sort_by] : 'inv.updated_at';
    const sortOrder = query.sort_order && query.sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Data query
    const dataSql = `
      SELECT 
        inv.id, inv.product_id, p.name as product_name, p.sku,
        p.category_id, c.name as category_name, p.unit,
        inv.current_quantity, p.reorder_level, p.status as product_status,
        inv.created_at, inv.updated_at
      FROM inventory inv
      JOIN products p ON inv.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereSql}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    const dataStmt = db.prepare(dataSql);
    const rawRows = dataStmt.all(...params, limit, offset) as any[];
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
   * Update quantity atomically for a product
   */
  static updateQuantity(productId: string, newQuantity: number): void {
    const stmt = db.prepare(`
      UPDATE inventory
      SET current_quantity = ?, updated_at = datetime('now')
      WHERE product_id = ?
    `);
    stmt.run(newQuantity, productId);

    // Sync products.current_stock for catalog consistency
    const syncProductStmt = db.prepare(`
      UPDATE products
      SET current_stock = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    syncProductStmt.run(newQuantity, productId);
  }

  /**
   * Calculate high-level inventory metrics
   */
  static getMetrics(): IInventoryMetrics {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN inv.current_quantity > p.reorder_level THEN 1 ELSE 0 END) as in_stock_items,
        SUM(CASE WHEN inv.current_quantity > 0 AND inv.current_quantity <= p.reorder_level THEN 1 ELSE 0 END) as low_stock_items,
        SUM(CASE WHEN inv.current_quantity <= 0 THEN 1 ELSE 0 END) as out_of_stock_items,
        SUM(inv.current_quantity) as total_stock_units
      FROM inventory inv
      JOIN products p ON inv.product_id = p.id
      WHERE p.status = 'ACTIVE'
    `);
    const result = stmt.get() as any;
    return {
      total_items: result ? Number(result.total_items) : 0,
      in_stock_items: result ? Number(result.in_stock_items) : 0,
      low_stock_items: result ? Number(result.low_stock_items) : 0,
      out_of_stock_items: result ? Number(result.out_of_stock_items) : 0,
      total_stock_units: result ? Number(result.total_stock_units) : 0,
    };
  }

  /**
   * Centralized helper to compute stock_status dynamically
   */
  private static attachStockStatus(row: any): IInventoryItem {
    let stock_status: StockStatus = 'IN_STOCK';
    if (row.current_quantity <= 0) {
      stock_status = 'OUT_OF_STOCK';
    } else if (row.current_quantity <= row.reorder_level) {
      stock_status = 'LOW_STOCK';
    }
    return {
      ...row,
      stock_status,
    };
  }
}
