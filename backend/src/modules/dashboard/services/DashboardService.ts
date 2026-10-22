import { db } from '../../../database/connection';
import { UserRole } from '../../authentication/types/auth.types';
import { InventoryModel } from '../../inventory/models/Inventory';
import { SupplierModel } from '../../suppliers/models/Supplier';
import { CustomerModel } from '../../customers/models/Customer';
import { PurchaseOrderModel } from '../../purchases/models/PurchaseOrder';
import { SalesOrderModel } from '../../sales/models/SalesOrder';
import { InvoiceModel } from '../../invoices/models/Invoice';
import {
  IChartData,
  IDashboardSummary,
  IInventorySummary,
  IPurchaseSummary,
  IRecentActivityItem,
  ISalesSummary,
} from '../types/dashboard.types';

export class DashboardService {
  /**
   * Main summary endpoint aggregating metrics across all modules.
   */
  static getSummary(role: UserRole = 'ADMIN'): IDashboardSummary {
    // 1. Products Metrics
    const productCounts = db
      .prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'INACTIVE' THEN 1 ELSE 0 END) as inactive
        FROM products
      `)
      .get() as any;

    // 2. Inventory Metrics
    const invMetrics = InventoryModel.getMetrics();

    // 3. Suppliers Metrics
    const supplierMetrics = SupplierModel.getMetrics();

    // 4. Customers Metrics
    const customerMetrics = CustomerModel.getMetrics();

    // 5. Purchases Metrics
    const purchaseMetrics = PurchaseOrderModel.getMetrics();

    // 6. Sales Metrics
    const salesMetrics = SalesOrderModel.getMetrics();

    // 7. Invoices Metrics
    const invoiceMetrics = InvoiceModel.getMetrics();

    return {
      role,
      products: {
        total: Number(productCounts?.total) || 0,
        active: Number(productCounts?.active) || 0,
        inactive: Number(productCounts?.inactive) || 0,
      },
      inventory: invMetrics,
      suppliers: {
        total: supplierMetrics.total_suppliers,
        active: supplierMetrics.active_suppliers,
        inactive: supplierMetrics.inactive_suppliers,
      },
      customers: {
        total: customerMetrics.total_customers,
        active: customerMetrics.active_customers,
        inactive: customerMetrics.inactive_customers,
      },
      purchases: {
        total_orders: purchaseMetrics.total_orders,
        pending_orders: purchaseMetrics.draft_orders + purchaseMetrics.ordered_orders + purchaseMetrics.partially_received_orders,
        received_orders: purchaseMetrics.received_orders,
        cancelled_orders: purchaseMetrics.cancelled_orders,
        total_spend: purchaseMetrics.total_spend,
      },
      sales: {
        total_orders: salesMetrics.total_orders,
        pending_orders: salesMetrics.draft_orders + salesMetrics.confirmed_orders + salesMetrics.processing_orders,
        completed_orders: salesMetrics.completed_orders,
        cancelled_orders: salesMetrics.cancelled_orders,
        total_revenue: salesMetrics.total_revenue,
      },
      invoices: invoiceMetrics,
    };
  }

  /**
   * Inventory summary with stock alerts and category distributions.
   */
  static getInventorySummary(): IInventorySummary {
    const metrics = InventoryModel.getMetrics();

    // Low stock items query (quantity > 0 AND quantity <= reorder_level)
    const lowStockRows = db
      .prepare(`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.sku,
          c.name as category_name,
          inv.current_quantity,
          p.reorder_level,
          p.unit
        FROM inventory inv
        JOIN products p ON inv.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'ACTIVE' 
          AND inv.current_quantity > 0 
          AND inv.current_quantity <= p.reorder_level
        ORDER BY inv.current_quantity ASC
        LIMIT 10
      `)
      .all() as any[];

    // Out of stock items query (quantity <= 0)
    const outOfStockRows = db
      .prepare(`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.sku,
          c.name as category_name,
          inv.current_quantity,
          p.reorder_level,
          p.unit
        FROM inventory inv
        JOIN products p ON inv.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'ACTIVE' 
          AND inv.current_quantity <= 0
        ORDER BY p.name ASC
        LIMIT 10
      `)
      .all() as any[];

    // Stock by category
    const categoryStockRows = db
      .prepare(`
        SELECT 
          c.id as category_id,
          c.name as category_name,
          COUNT(p.id) as product_count,
          COALESCE(SUM(inv.current_quantity), 0) as total_units
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.status = 'ACTIVE'
        LEFT JOIN inventory inv ON p.id = inv.product_id
        GROUP BY c.id, c.name
        ORDER BY total_units DESC
      `)
      .all() as any[];

    return {
      metrics,
      low_stock_products: lowStockRows.map((r) => ({
        product_id: r.product_id,
        product_name: r.product_name,
        sku: r.sku,
        category_name: r.category_name || undefined,
        current_quantity: Number(r.current_quantity),
        reorder_level: Number(r.reorder_level),
        unit: r.unit,
        stock_status: 'LOW_STOCK',
      })),
      out_of_stock_products: outOfStockRows.map((r) => ({
        product_id: r.product_id,
        product_name: r.product_name,
        sku: r.sku,
        category_name: r.category_name || undefined,
        current_quantity: Number(r.current_quantity),
        reorder_level: Number(r.reorder_level),
        unit: r.unit,
        stock_status: 'OUT_OF_STOCK',
      })),
      stock_by_category: categoryStockRows.map((r) => ({
        category_id: r.category_id,
        category_name: r.category_name,
        product_count: Number(r.product_count) || 0,
        total_units: Number(r.total_units) || 0,
      })),
    };
  }

  /**
   * Sales summary with recent sales orders and monthly trend data.
   */
  static getSalesSummary(): ISalesSummary {
    const metrics = SalesOrderModel.getMetrics();

    // Recent sales orders
    const recentOrders = db
      .prepare(`
        SELECT 
          so.id,
          so.order_number,
          c.customer_name,
          so.order_date,
          so.status,
          so.total
        FROM sales_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        ORDER BY so.created_at DESC
        LIMIT 5
      `)
      .all() as any[];

    // Monthly sales trend (last 6 months)
    const monthlyTrend = db
      .prepare(`
        SELECT 
          strftime('%Y-%m', order_date) as month,
          COUNT(*) as order_count,
          SUM(total) as total_revenue
        FROM sales_orders
        WHERE status != 'CANCELLED'
        GROUP BY strftime('%Y-%m', order_date)
        ORDER BY month ASC
        LIMIT 6
      `)
      .all() as any[];

    return {
      metrics,
      recent_orders: recentOrders.map((r) => ({
        id: r.id,
        order_number: r.order_number,
        customer_name: r.customer_name || 'Customer',
        order_date: r.order_date,
        status: r.status,
        total: Number(r.total) || 0,
      })),
      monthly_trend: monthlyTrend.map((r) => ({
        month: r.month,
        order_count: Number(r.order_count) || 0,
        total_revenue: Math.round((Number(r.total_revenue) || 0) * 100) / 100,
      })),
    };
  }

  /**
   * Purchases summary with pending orders, recent purchases, and spend trend.
   */
  static getPurchasesSummary(): IPurchaseSummary {
    const metrics = PurchaseOrderModel.getMetrics();

    // Pending purchase orders
    const pendingOrders = db
      .prepare(`
        SELECT 
          po.id,
          po.id as po_number,
          s.supplier_name,
          po.order_date,
          po.status,
          po.total
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        WHERE po.status IN ('DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED')
        ORDER BY po.created_at DESC
        LIMIT 5
      `)
      .all() as any[];

    // Recent purchase orders
    const recentOrders = db
      .prepare(`
        SELECT 
          po.id,
          po.id as po_number,
          s.supplier_name,
          po.order_date,
          po.status,
          po.total
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        ORDER BY po.created_at DESC
        LIMIT 5
      `)
      .all() as any[];

    // Monthly purchase spend trend
    const monthlyTrend = db
      .prepare(`
        SELECT 
          strftime('%Y-%m', order_date) as month,
          COUNT(*) as order_count,
          SUM(total) as total_spend
        FROM purchase_orders
        WHERE status != 'CANCELLED'
        GROUP BY strftime('%Y-%m', order_date)
        ORDER BY month ASC
        LIMIT 6
      `)
      .all() as any[];

    return {
      metrics,
      pending_orders: pendingOrders.map((r) => ({
        id: r.id,
        po_number: r.po_number,
        supplier_name: r.supplier_name || 'Supplier',
        order_date: r.order_date,
        status: r.status,
        total: Number(r.total) || 0,
      })),
      recent_orders: recentOrders.map((r) => ({
        id: r.id,
        po_number: r.po_number,
        supplier_name: r.supplier_name || 'Supplier',
        order_date: r.order_date,
        status: r.status,
        total: Number(r.total) || 0,
      })),
      monthly_trend: monthlyTrend.map((r) => ({
        month: r.month,
        order_count: Number(r.order_count) || 0,
        total_spend: Math.round((Number(r.total_spend) || 0) * 100) / 100,
      })),
    };
  }

  /**
   * Aggregates recent activity across inventory, sales, purchases, and invoices into a chronological feed.
   */
  static getRecentActivity(limit = 10): IRecentActivityItem[] {
    const activities: IRecentActivityItem[] = [];

    // 1. Recent Stock Transactions
    const stockTransactions = db
      .prepare(`
        SELECT 
          st.id,
          st.transaction_type,
          st.quantity,
          st.reason,
          st.reference,
          st.created_at,
          p.name as product_name,
          p.sku as product_sku,
          u.full_name as user_name
        FROM stock_transactions st
        JOIN products p ON st.product_id = p.id
        LEFT JOIN users u ON st.performed_by = u.id
        ORDER BY st.created_at DESC
        LIMIT 6
      `)
      .all() as any[];

    for (const st of stockTransactions) {
      let type: IRecentActivityItem['type'] = 'STOCK_ADJUST';
      let title = 'Stock Adjusted';
      let badgeColor: IRecentActivityItem['badge_color'] = 'amber';

      if (st.transaction_type === 'STOCK_IN') {
        type = 'STOCK_IN';
        title = `Stock IN: +${st.quantity} units`;
        badgeColor = 'emerald';
      } else if (st.transaction_type === 'STOCK_OUT') {
        type = 'STOCK_OUT';
        title = `Stock OUT: -${st.quantity} units`;
        badgeColor = 'blue';
      } else {
        title = `Stock Adjusted: ${st.quantity} units`;
      }

      activities.push({
        id: `act_st_${st.id}`,
        type,
        title,
        description: `${st.product_name} (${st.product_sku}) - ${st.reason || 'Inventory balance adjustment'}`,
        timestamp: st.created_at,
        reference_id: st.reference || undefined,
        user_name: st.user_name || undefined,
        badge_color: badgeColor,
      });
    }

    // 2. Recent Sales Orders
    const salesOrders = db
      .prepare(`
        SELECT 
          so.id,
          so.order_number,
          so.status,
          so.total,
          so.created_at,
          c.customer_name,
          u.full_name as user_name
        FROM sales_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        LEFT JOIN users u ON so.created_by = u.id
        ORDER BY so.created_at DESC
        LIMIT 4
      `)
      .all() as any[];

    for (const so of salesOrders) {
      const isCompleted = so.status === 'COMPLETED';
      activities.push({
        id: `act_so_${so.id}`,
        type: isCompleted ? 'SALE_COMPLETED' : 'SALE_CREATED',
        title: isCompleted ? `Sale Fulfilled #${so.order_number}` : `Sales Order #${so.order_number}`,
        description: `${so.customer_name || 'Customer'} - Total: $${Number(so.total).toFixed(2)} (${so.status})`,
        timestamp: so.created_at,
        reference_id: so.order_number,
        user_name: so.user_name || undefined,
        badge_color: isCompleted ? 'emerald' : 'blue',
      });
    }

    // 3. Recent Purchase Orders
    const purchaseOrders = db
      .prepare(`
        SELECT 
          po.id,
          po.id as po_number,
          po.status,
          po.total,
          po.created_at,
          s.supplier_name,
          u.full_name as user_name
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN users u ON po.created_by = u.id
        ORDER BY po.created_at DESC
        LIMIT 4
      `)
      .all() as any[];

    for (const po of purchaseOrders) {
      const isReceived = po.status === 'RECEIVED' || po.status === 'PARTIALLY_RECEIVED';
      activities.push({
        id: `act_po_${po.id}`,
        type: isReceived ? 'PURCHASE_RECEIVED' : 'PURCHASE_CREATED',
        title: `Purchase Order #${po.po_number}`,
        description: `${po.supplier_name || 'Supplier'} - Total: $${Number(po.total).toFixed(2)} (${po.status})`,
        timestamp: po.created_at,
        reference_id: po.po_number,
        user_name: po.user_name || undefined,
        badge_color: isReceived ? 'purple' : 'slate',
      });
    }

    // 4. Recent Commercial Invoices
    const invoices = db
      .prepare(`
        SELECT 
          inv.id,
          inv.invoice_number,
          inv.status,
          inv.total,
          inv.created_at,
          c.customer_name,
          u.full_name as user_name
        FROM invoices inv
        LEFT JOIN customers c ON inv.customer_id = c.id
        LEFT JOIN users u ON inv.created_by = u.id
        ORDER BY inv.created_at DESC
        LIMIT 4
      `)
      .all() as any[];

    for (const inv of invoices) {
      const isPaid = inv.status === 'PAID';
      activities.push({
        id: `act_inv_${inv.id}`,
        type: isPaid ? 'INVOICE_PAID' : 'INVOICE_CREATED',
        title: isPaid ? `Invoice Paid #${inv.invoice_number}` : `Invoice Issued #${inv.invoice_number}`,
        description: `${inv.customer_name || 'Customer'} - Value: $${Number(inv.total).toFixed(2)} (${inv.status})`,
        timestamp: inv.created_at,
        reference_id: inv.invoice_number,
        user_name: inv.user_name || undefined,
        badge_color: isPaid ? 'emerald' : 'blue',
      });
    }

    // Sort combined activities by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return activities.slice(0, limit);
  }

  /**
   * Aggregate chart dataset for visual trends.
   */
  static getChartData(): IChartData {
    // 1. Stock Status Distribution
    const stockStatusCounts = db
      .prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN inv.current_quantity > p.reorder_level THEN 1 ELSE 0 END) as in_stock,
          SUM(CASE WHEN inv.current_quantity > 0 AND inv.current_quantity <= p.reorder_level THEN 1 ELSE 0 END) as low_stock,
          SUM(CASE WHEN inv.current_quantity <= 0 THEN 1 ELSE 0 END) as out_of_stock
        FROM inventory inv
        JOIN products p ON inv.product_id = p.id
        WHERE p.status = 'ACTIVE'
      `)
      .get() as any;

    const totalStock = Number(stockStatusCounts?.total) || 1;
    const inStock = Number(stockStatusCounts?.in_stock) || 0;
    const lowStock = Number(stockStatusCounts?.low_stock) || 0;
    const outOfStock = Number(stockStatusCounts?.out_of_stock) || 0;

    const stockDistribution: IChartData['stock_status_distribution'] = [
      {
        status: 'IN_STOCK',
        count: inStock,
        percentage: Math.round((inStock / totalStock) * 100),
      },
      {
        status: 'LOW_STOCK',
        count: lowStock,
        percentage: Math.round((lowStock / totalStock) * 100),
      },
      {
        status: 'OUT_OF_STOCK',
        count: outOfStock,
        percentage: Math.round((outOfStock / totalStock) * 100),
      },
    ];

    // 2. Sales vs Purchases comparison
    const salesMonthly = db
      .prepare(`
        SELECT 
          strftime('%Y-%m', order_date) as month,
          SUM(total) as total_amount
        FROM sales_orders
        WHERE status != 'CANCELLED'
        GROUP BY strftime('%Y-%m', order_date)
        ORDER BY month ASC
        LIMIT 6
      `)
      .all() as any[];

    const purchaseMonthly = db
      .prepare(`
        SELECT 
          strftime('%Y-%m', order_date) as month,
          SUM(total) as total_amount
        FROM purchase_orders
        WHERE status != 'CANCELLED'
        GROUP BY strftime('%Y-%m', order_date)
        ORDER BY month ASC
        LIMIT 6
      `)
      .all() as any[];

    const monthMap: Record<string, { sales: number; purchases: number }> = {};
    for (const s of salesMonthly) {
      if (s.month) {
        monthMap[s.month] = { sales: Math.round((Number(s.total_amount) || 0) * 100) / 100, purchases: 0 };
      }
    }
    for (const p of purchaseMonthly) {
      if (p.month) {
        if (!monthMap[p.month]) {
          monthMap[p.month] = { sales: 0, purchases: Math.round((Number(p.total_amount) || 0) * 100) / 100 };
        } else {
          monthMap[p.month].purchases = Math.round((Number(p.total_amount) || 0) * 100) / 100;
        }
      }
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    if (!monthMap[currentMonth]) {
      monthMap[currentMonth] = { sales: 0, purchases: 0 };
    }

    const salesVsPurchases = Object.keys(monthMap)
      .sort()
      .map((m) => ({
        month: m,
        sales: monthMap[m].sales,
        purchases: monthMap[m].purchases,
      }));

    // 3. Category Distribution
    const categoryDistributionRows = db
      .prepare(`
        SELECT 
          c.name as category_name,
          COUNT(p.id) as product_count,
          COALESCE(SUM(inv.current_quantity), 0) as total_units
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.status = 'ACTIVE'
        LEFT JOIN inventory inv ON p.id = inv.product_id
        GROUP BY c.id, c.name
        ORDER BY total_units DESC
      `)
      .all() as any[];

    return {
      sales_vs_purchases: salesVsPurchases,
      stock_status_distribution: stockDistribution,
      category_distribution: categoryDistributionRows.map((r) => ({
        category_name: r.category_name,
        product_count: Number(r.product_count) || 0,
        total_units: Number(r.total_units) || 0,
      })),
    };
  }
}
