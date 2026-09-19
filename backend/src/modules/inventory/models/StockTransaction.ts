import { db } from '../../../database/connection';
import { IStockTransaction, ITransactionFilterQuery } from '../types/inventory.types';
import { IPaginatedResult } from '../../products/types/product.types';

export class StockTransactionModel {
  /**
   * Append an immutable stock movement record
   */
  static create(tx: {
    id: string;
    product_id: string;
    transaction_type: string;
    quantity: number;
    previous_quantity: number;
    new_quantity: number;
    reason: string;
    reference?: string | null;
    performed_by: string;
  }): IStockTransaction {
    const stmt = db.prepare(`
      INSERT INTO stock_transactions (
        id, product_id, transaction_type, quantity,
        previous_quantity, new_quantity, reason, reference,
        performed_by, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(
      tx.id,
      tx.product_id,
      tx.transaction_type,
      tx.quantity,
      tx.previous_quantity,
      tx.new_quantity,
      tx.reason.trim(),
      tx.reference ? tx.reference.trim() : null,
      tx.performed_by
    );

    const created = this.findById(tx.id);
    if (!created) throw new Error('Failed to retrieve transaction record after creation');
    return created;
  }

  /**
   * Retrieve transaction by ID
   */
  static findById(id: string): IStockTransaction | null {
    const stmt = db.prepare(`
      SELECT 
        st.id, st.product_id, p.name as product_name, p.sku,
        st.transaction_type, st.quantity, st.previous_quantity, st.new_quantity,
        st.reason, st.reference, st.performed_by, u.full_name as performer_name,
        st.created_at
      FROM stock_transactions st
      JOIN products p ON st.product_id = p.id
      LEFT JOIN users u ON st.performed_by = u.id
      WHERE st.id = ?
    `);
    const row = stmt.get(id) as unknown as IStockTransaction | undefined;
    return row || null;
  }

  /**
   * Filter and paginate transaction history
   */
  static findFiltered(query: ITransactionFilterQuery): IPaginatedResult<IStockTransaction> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ['1=1'];
    const params: any[] = [];

    if (query.product_id && query.product_id.trim() !== '') {
      whereClauses.push('st.product_id = ?');
      params.push(query.product_id.trim());
    }

    if (query.transaction_type && query.transaction_type !== 'ALL') {
      whereClauses.push('st.transaction_type = ?');
      params.push(query.transaction_type);
    }

    if (query.performed_by && query.performed_by.trim() !== '') {
      whereClauses.push('st.performed_by = ?');
      params.push(query.performed_by.trim());
    }

    if (query.date_from && query.date_from.trim() !== '') {
      whereClauses.push("st.created_at >= datetime(?, 'start of day')");
      params.push(query.date_from.trim());
    }

    if (query.date_to && query.date_to.trim() !== '') {
      whereClauses.push("st.created_at <= datetime(?, 'end of day')");
      params.push(query.date_to.trim());
    }

    const whereSql = whereClauses.join(' AND ');

    // Total count
    const countSql = `SELECT COUNT(*) as total FROM stock_transactions st WHERE ${whereSql}`;
    const countStmt = db.prepare(countSql);
    const countResult = countStmt.get(...params) as any;
    const total = countResult ? countResult.total : 0;

    const sortOrder = query.sort_order && query.sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Data query
    const dataSql = `
      SELECT 
        st.id, st.product_id, p.name as product_name, p.sku,
        st.transaction_type, st.quantity, st.previous_quantity, st.new_quantity,
        st.reason, st.reference, st.performed_by, u.full_name as performer_name,
        st.created_at
      FROM stock_transactions st
      JOIN products p ON st.product_id = p.id
      LEFT JOIN users u ON st.performed_by = u.id
      WHERE ${whereSql}
      ORDER BY st.created_at ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    const dataStmt = db.prepare(dataSql);
    const items = dataStmt.all(...params, limit, offset) as unknown as IStockTransaction[];

    return {
      items,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }
}
