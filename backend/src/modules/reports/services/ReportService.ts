import { db } from '../../../database/connection';
import {
  IInventoryValuationFilters,
  IInventoryValuationItem,
  IInventoryValuationReport,
  IInventoryValuationSummary,
  IPurchaseReport,
  IPurchaseReportFilters,
  IPurchaseReportItem,
  IPurchaseReportSummary,
  IPurchaseReportSupplierSummary,
  ISalesReport,
  ISalesReportFilters,
  ISalesReportItem,
  ISalesReportProductSummary,
  ISalesReportSummary,
  IStockMovementFilters,
  IStockMovementReport,
  IStockMovementReportItem,
  IStockMovementSummary,
  StockStatus,
} from '../types/report.types';

export class ReportService {
  /**
   * 1. INVENTORY VALUATION REPORT
   * Calculates stock valuation, potential margins, and stock status distribution.
   */
  static getInventoryValuationReport(filters: IInventoryValuationFilters = {}): IInventoryValuationReport {
    let query = `
      SELECT 
        p.id AS product_id,
        p.name,
        p.sku,
        p.category_id,
        c.name AS category_name,
        p.unit,
        COALESCE(i.current_quantity, p.current_stock, 0) AS current_quantity,
        p.reorder_level,
        p.purchase_price,
        p.selling_price
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.category_id) {
      query += ` AND p.category_id = ?`;
      params.push(filters.category_id);
    }

    if (filters.search) {
      query += ` AND (p.name LIKE ? OR p.sku LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ` ORDER BY p.name ASC`;

    const rawRows = db.prepare(query).all(...params) as any[];

    const items: IInventoryValuationItem[] = [];
    let totalUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const row of rawRows) {
      const qty = Number(row.current_quantity) || 0;
      const reorderLevel = Number(row.reorder_level) || 0;
      const purchasePrice = Number(row.purchase_price) || 0;
      const sellingPrice = Number(row.selling_price) || 0;

      let stockStatus: StockStatus = 'IN_STOCK';
      if (qty <= 0) {
        stockStatus = 'OUT_OF_STOCK';
      } else if (qty <= reorderLevel) {
        stockStatus = 'LOW_STOCK';
      }

      // Filter by stock_status if specified
      if (filters.stock_status && filters.stock_status !== 'ALL' && stockStatus !== filters.stock_status) {
        continue;
      }

      const costVal = Number((qty * purchasePrice).toFixed(2));
      const retailVal = Number((qty * sellingPrice).toFixed(2));
      const margin = Number((retailVal - costVal).toFixed(2));
      const marginPct = retailVal > 0 ? Number(((margin / retailVal) * 100).toFixed(1)) : 0;

      items.push({
        product_id: row.product_id,
        name: row.name,
        sku: row.sku,
        category_id: row.category_id,
        category_name: row.category_name || 'Uncategorized',
        unit: row.unit,
        current_quantity: qty,
        reorder_level: reorderLevel,
        purchase_price: purchasePrice,
        selling_price: sellingPrice,
        total_cost_valuation: costVal,
        total_retail_valuation: retailVal,
        potential_margin: margin,
        margin_percentage: marginPct,
        stock_status: stockStatus,
      });

      totalUnits += qty;
      totalCostValuation += costVal;
      totalRetailValuation += retailVal;
      if (stockStatus === 'LOW_STOCK') lowStockCount++;
      if (stockStatus === 'OUT_OF_STOCK') outOfStockCount++;
    }

    const summary: IInventoryValuationSummary = {
      total_products: items.length,
      total_units: totalUnits,
      total_cost_valuation: Number(totalCostValuation.toFixed(2)),
      total_retail_valuation: Number(totalRetailValuation.toFixed(2)),
      total_potential_margin: Number((totalRetailValuation - totalCostValuation).toFixed(2)),
      low_stock_count: lowStockCount,
      out_of_stock_count: outOfStockCount,
    };

    return { summary, items };
  }

  /**
   * 2. SALES ANALYTICS REPORT
   * Aggregates sales orders, revenue metrics, and product breakdown.
   */
  static getSalesReport(filters: ISalesReportFilters = {}): ISalesReport {
    let orderQuery = `
      SELECT 
        so.id AS sales_order_id,
        so.order_number,
        so.customer_id,
        c.customer_name,
        c.email AS customer_email,
        so.order_date,
        so.status,
        so.subtotal,
        so.tax,
        so.discount,
        so.total,
        COALESCE(SUM(soi.quantity), 0) AS total_quantity
      FROM sales_orders so
      JOIN customers c ON so.customer_id = c.id
      LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.start_date) {
      orderQuery += ` AND date(so.order_date) >= date(?)`;
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      orderQuery += ` AND date(so.order_date) <= date(?)`;
      params.push(filters.end_date);
    }
    if (filters.customer_id) {
      orderQuery += ` AND so.customer_id = ?`;
      params.push(filters.customer_id);
    }
    if (filters.status) {
      orderQuery += ` AND so.status = ?`;
      params.push(filters.status);
    }
    if (filters.search) {
      orderQuery += ` AND (so.order_number LIKE ? OR c.customer_name LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    orderQuery += `
      GROUP BY so.id
      ORDER BY so.order_date DESC, so.created_at DESC
    `;

    const rawOrders = db.prepare(orderQuery).all(...params) as any[];

    const orders: ISalesReportItem[] = [];
    let completedOrders = 0;
    let pendingOrders = 0;
    let cancelledOrders = 0;
    let totalRevenue = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    for (const row of rawOrders) {
      const total = Number(row.total) || 0;
      const tax = Number(row.tax) || 0;
      const discount = Number(row.discount) || 0;
      const subtotal = Number(row.subtotal) || 0;
      const totalQty = Number(row.total_quantity) || 0;

      orders.push({
        sales_order_id: row.sales_order_id,
        order_number: row.order_number,
        customer_id: row.customer_id,
        customer_name: row.customer_name,
        customer_email: row.customer_email,
        order_date: row.order_date,
        status: row.status,
        subtotal,
        tax,
        discount,
        total,
        total_quantity: totalQty,
      });

      if (row.status === 'COMPLETED') {
        completedOrders++;
        totalRevenue += total;
        totalTax += tax;
        totalDiscount += discount;
      } else if (row.status === 'CANCELLED') {
        cancelledOrders++;
      } else {
        pendingOrders++;
      }
    }

    const summary: ISalesReportSummary = {
      total_orders: orders.length,
      completed_orders: completedOrders,
      pending_orders: pendingOrders,
      cancelled_orders: cancelledOrders,
      total_revenue: Number(totalRevenue.toFixed(2)),
      total_tax: Number(totalTax.toFixed(2)),
      total_discount: Number(totalDiscount.toFixed(2)),
      average_order_value: completedOrders > 0 ? Number((totalRevenue / completedOrders).toFixed(2)) : 0,
    };

    // Aggregate top products breakdown
    let topProductsQuery = `
      SELECT 
        p.id AS product_id,
        p.name,
        p.sku,
        SUM(soi.quantity) AS units_sold,
        SUM(soi.line_total) AS total_revenue
      FROM sales_order_items soi
      JOIN sales_orders so ON soi.sales_order_id = so.id
      JOIN products p ON soi.product_id = p.id
      WHERE so.status != 'CANCELLED'
    `;
    const prodParams: any[] = [];
    if (filters.start_date) {
      topProductsQuery += ` AND date(so.order_date) >= date(?)`;
      prodParams.push(filters.start_date);
    }
    if (filters.end_date) {
      topProductsQuery += ` AND date(so.order_date) <= date(?)`;
      prodParams.push(filters.end_date);
    }
    topProductsQuery += `
      GROUP BY p.id
      ORDER BY total_revenue DESC
      LIMIT 10
    `;

    const rawTopProducts = db.prepare(topProductsQuery).all(...prodParams) as any[];
    const topProducts: ISalesReportProductSummary[] = rawTopProducts.map((p) => ({
      product_id: p.product_id,
      name: p.name,
      sku: p.sku,
      units_sold: Number(p.units_sold) || 0,
      total_revenue: Number(Number(p.total_revenue || 0).toFixed(2)),
    }));

    return {
      summary,
      orders,
      top_products: topProducts,
    };
  }

  /**
   * 3. PURCHASES ANALYTICS REPORT
   * Tracks procurement spend, supplier performance, and fulfillment rate.
   */
  static getPurchasesReport(filters: IPurchaseReportFilters = {}): IPurchaseReport {
    let orderQuery = `
      SELECT 
        po.id AS purchase_order_id,
        po.supplier_id,
        s.supplier_name,
        s.company_name AS supplier_company,
        po.order_date,
        po.expected_delivery_date,
        po.status,
        po.subtotal,
        po.tax,
        po.discount,
        po.total,
        COALESCE(SUM(poi.quantity), 0) AS total_ordered,
        COALESCE(SUM(poi.received_quantity), 0) AS total_received
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.start_date) {
      orderQuery += ` AND date(po.order_date) >= date(?)`;
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      orderQuery += ` AND date(po.order_date) <= date(?)`;
      params.push(filters.end_date);
    }
    if (filters.supplier_id) {
      orderQuery += ` AND po.supplier_id = ?`;
      params.push(filters.supplier_id);
    }
    if (filters.status) {
      orderQuery += ` AND po.status = ?`;
      params.push(filters.status);
    }
    if (filters.search) {
      orderQuery += ` AND (s.supplier_name LIKE ? OR s.company_name LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    orderQuery += `
      GROUP BY po.id
      ORDER BY po.order_date DESC, po.created_at DESC
    `;

    const rawOrders = db.prepare(orderQuery).all(...params) as any[];

    const orders: IPurchaseReportItem[] = [];
    let receivedOrders = 0;
    let pendingOrders = 0;
    let cancelledOrders = 0;
    let totalSpend = 0;
    let aggregateOrdered = 0;
    let aggregateReceived = 0;

    for (const row of rawOrders) {
      const total = Number(row.total) || 0;
      const subtotal = Number(row.subtotal) || 0;
      const tax = Number(row.tax) || 0;
      const discount = Number(row.discount) || 0;
      const ordered = Number(row.total_ordered) || 0;
      const received = Number(row.total_received) || 0;
      const fulfillmentPct = ordered > 0 ? Number(((received / ordered) * 100).toFixed(1)) : 0;

      orders.push({
        purchase_order_id: row.purchase_order_id,
        supplier_id: row.supplier_id,
        supplier_name: row.supplier_name,
        supplier_company: row.supplier_company,
        order_date: row.order_date,
        expected_delivery_date: row.expected_delivery_date,
        status: row.status,
        subtotal,
        tax,
        discount,
        total,
        total_ordered: ordered,
        total_received: received,
        fulfillment_percentage: fulfillmentPct,
      });

      if (row.status === 'RECEIVED') {
        receivedOrders++;
        totalSpend += total;
      } else if (row.status === 'CANCELLED') {
        cancelledOrders++;
      } else {
        pendingOrders++;
        if (row.status === 'PARTIALLY_RECEIVED') {
          totalSpend += total;
        }
      }

      aggregateOrdered += ordered;
      aggregateReceived += received;
    }

    const overallFulfillmentRate =
      aggregateOrdered > 0 ? Number(((aggregateReceived / aggregateOrdered) * 100).toFixed(1)) : 0;

    const summary: IPurchaseReportSummary = {
      total_orders: orders.length,
      received_orders: receivedOrders,
      pending_orders: pendingOrders,
      cancelled_orders: cancelledOrders,
      total_spend: Number(totalSpend.toFixed(2)),
      overall_fulfillment_rate: overallFulfillmentRate,
    };

    // Supplier Spend breakdown
    let supplierSpendQuery = `
      SELECT 
        s.id AS supplier_id,
        s.supplier_name,
        COUNT(po.id) AS orders_count,
        SUM(po.total) AS total_spend
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.status != 'CANCELLED'
    `;
    const suppParams: any[] = [];
    if (filters.start_date) {
      supplierSpendQuery += ` AND date(po.order_date) >= date(?)`;
      suppParams.push(filters.start_date);
    }
    if (filters.end_date) {
      supplierSpendQuery += ` AND date(po.order_date) <= date(?)`;
      suppParams.push(filters.end_date);
    }
    supplierSpendQuery += `
      GROUP BY s.id
      ORDER BY total_spend DESC
    `;

    const rawSuppliers = db.prepare(supplierSpendQuery).all(...suppParams) as any[];
    const supplierSpend: IPurchaseReportSupplierSummary[] = rawSuppliers.map((s) => ({
      supplier_id: s.supplier_id,
      supplier_name: s.supplier_name,
      orders_count: Number(s.orders_count) || 0,
      total_spend: Number(Number(s.total_spend || 0).toFixed(2)),
    }));

    return {
      summary,
      orders,
      supplier_spend: supplierSpend,
    };
  }

  /**
   * 4. STOCK MOVEMENT & TRANSACTION AUDIT LEDGER REPORT
   * Returns a complete, filterable chronological audit trail of all physical stock movements.
   */
  static getStockMovementReport(filters: IStockMovementFilters = {}): IStockMovementReport {
    let query = `
      SELECT 
        st.id AS transaction_id,
        st.created_at,
        st.product_id,
        p.name AS product_name,
        p.sku AS product_sku,
        c.name AS category_name,
        st.transaction_type,
        st.quantity,
        st.previous_quantity,
        st.new_quantity,
        st.reason,
        st.reference,
        u.full_name AS performed_by_name,
        u.email AS performed_by_email
      FROM stock_transactions st
      JOIN products p ON st.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN users u ON st.performed_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.start_date) {
      query += ` AND date(st.created_at) >= date(?)`;
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      query += ` AND date(st.created_at) <= date(?)`;
      params.push(filters.end_date);
    }
    if (filters.product_id) {
      query += ` AND st.product_id = ?`;
      params.push(filters.product_id);
    }
    if (filters.transaction_type) {
      query += ` AND st.transaction_type = ?`;
      params.push(filters.transaction_type);
    }
    if (filters.search) {
      query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR st.reason LIKE ? OR st.reference LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    query += ` ORDER BY st.created_at DESC`;

    const rawMovements = db.prepare(query).all(...params) as any[];

    const movements: IStockMovementReportItem[] = [];
    let stockInCount = 0;
    let stockInQuantity = 0;
    let stockOutCount = 0;
    let stockOutQuantity = 0;
    let adjustmentCount = 0;
    let netQuantityChange = 0;

    for (const row of rawMovements) {
      const qty = Number(row.quantity) || 0;
      const prevQty = Number(row.previous_quantity) || 0;
      const newQty = Number(row.new_quantity) || 0;
      const diff = newQty - prevQty;

      movements.push({
        transaction_id: row.transaction_id,
        created_at: row.created_at,
        product_id: row.product_id,
        product_name: row.product_name,
        product_sku: row.product_sku,
        category_name: row.category_name || 'Uncategorized',
        transaction_type: row.transaction_type,
        quantity: qty,
        previous_quantity: prevQty,
        new_quantity: newQty,
        reason: row.reason,
        reference: row.reference,
        performed_by_name: row.performed_by_name,
        performed_by_email: row.performed_by_email,
      });

      if (row.transaction_type === 'STOCK_IN') {
        stockInCount++;
        stockInQuantity += qty;
      } else if (row.transaction_type === 'STOCK_OUT') {
        stockOutCount++;
        stockOutQuantity += qty;
      } else {
        adjustmentCount++;
      }

      netQuantityChange += diff;
    }

    const summary: IStockMovementSummary = {
      total_movements: movements.length,
      stock_in_count: stockInCount,
      stock_in_quantity: stockInQuantity,
      stock_out_count: stockOutCount,
      stock_out_quantity: stockOutQuantity,
      adjustment_count: adjustmentCount,
      net_quantity_change: netQuantityChange,
    };

    return { summary, movements };
  }

  /**
   * Helper: Formats an array of rows into standard RFC-4180 compliant CSV string.
   */
  static formatCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
    const escapeCell = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = headers.map(escapeCell).join(',');
    const dataLines = rows.map((row) => row.map(escapeCell).join(','));

    return [headerLine, ...dataLines].join('\r\n');
  }

  /**
   * 5. CSV EXPORT GENERATOR
   * Returns CSV string and appropriate filename for any supported report type.
   */
  static exportReportToCsv(
    reportType: 'inventory' | 'sales' | 'purchases' | 'movement',
    filters: any
  ): { filename: string; csvContent: string } {
    const timestamp = new Date().toISOString().split('T')[0];

    switch (reportType) {
      case 'inventory': {
        const report = this.getInventoryValuationReport(filters);
        const headers = [
          'Product SKU',
          'Product Name',
          'Category',
          'Unit',
          'Current Stock',
          'Reorder Level',
          'Stock Status',
          'Purchase Price ($)',
          'Selling Price ($)',
          'Cost Valuation ($)',
          'Retail Valuation ($)',
          'Potential Margin ($)',
          'Margin (%)',
        ];
        const rows = report.items.map((i) => [
          i.sku,
          i.name,
          i.category_name,
          i.unit,
          i.current_quantity,
          i.reorder_level,
          i.stock_status,
          i.purchase_price.toFixed(2),
          i.selling_price.toFixed(2),
          i.total_cost_valuation.toFixed(2),
          i.total_retail_valuation.toFixed(2),
          i.potential_margin.toFixed(2),
          i.margin_percentage.toFixed(1) + '%',
        ]);
        return {
          filename: `inventory-valuation-report-${timestamp}.csv`,
          csvContent: this.formatCsv(headers, rows),
        };
      }

      case 'sales': {
        const report = this.getSalesReport(filters);
        const headers = [
          'Order Number',
          'Customer Name',
          'Customer Email',
          'Order Date',
          'Status',
          'Total Quantity',
          'Subtotal ($)',
          'Tax ($)',
          'Discount ($)',
          'Total ($)',
        ];
        const rows = report.orders.map((o) => [
          o.order_number,
          o.customer_name,
          o.customer_email,
          o.order_date,
          o.status,
          o.total_quantity,
          o.subtotal.toFixed(2),
          o.tax.toFixed(2),
          o.discount.toFixed(2),
          o.total.toFixed(2),
        ]);
        return {
          filename: `sales-report-${timestamp}.csv`,
          csvContent: this.formatCsv(headers, rows),
        };
      }

      case 'purchases': {
        const report = this.getPurchasesReport(filters);
        const headers = [
          'Order ID',
          'Supplier Name',
          'Company Name',
          'Order Date',
          'Expected Delivery',
          'Status',
          'Ordered Qty',
          'Received Qty',
          'Fulfillment (%)',
          'Subtotal ($)',
          'Tax ($)',
          'Discount ($)',
          'Total ($)',
        ];
        const rows = report.orders.map((p) => [
          p.purchase_order_id,
          p.supplier_name,
          p.supplier_company,
          p.order_date,
          p.expected_delivery_date || 'N/A',
          p.status,
          p.total_ordered,
          p.total_received,
          p.fulfillment_percentage.toFixed(1) + '%',
          p.subtotal.toFixed(2),
          p.tax.toFixed(2),
          p.discount.toFixed(2),
          p.total.toFixed(2),
        ]);
        return {
          filename: `purchases-report-${timestamp}.csv`,
          csvContent: this.formatCsv(headers, rows),
        };
      }

      case 'movement': {
        const report = this.getStockMovementReport(filters);
        const headers = [
          'Transaction ID',
          'Date & Time',
          'Product SKU',
          'Product Name',
          'Category',
          'Type',
          'Quantity Change',
          'Previous Stock',
          'New Stock',
          'Reason',
          'Reference',
          'Performed By',
        ];
        const rows = report.movements.map((m) => [
          m.transaction_id,
          m.created_at,
          m.product_sku,
          m.product_name,
          m.category_name,
          m.transaction_type,
          m.quantity,
          m.previous_quantity,
          m.new_quantity,
          m.reason,
          m.reference || 'N/A',
          `${m.performed_by_name} (${m.performed_by_email})`,
        ]);
        return {
          filename: `stock-movement-report-${timestamp}.csv`,
          csvContent: this.formatCsv(headers, rows),
        };
      }

      default:
        throw new Error(`Unsupported report type for export: ${reportType}`);
    }
  }
}
