import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/ReportService';
import {
  IInventoryValuationFilters,
  IPurchaseReportFilters,
  ISalesReportFilters,
  IStockMovementFilters,
} from '../types/report.types';

export class ReportController {
  /**
   * GET /api/reports/inventory-valuation
   */
  static getInventoryValuation(req: Request, res: Response, next: NextFunction): void {
    try {
      const filters: IInventoryValuationFilters = {
        category_id: req.query.category_id ? String(req.query.category_id) : undefined,
        stock_status: req.query.stock_status ? String(req.query.stock_status) : undefined,
        search: req.query.search ? String(req.query.search) : undefined,
      };

      const data = ReportService.getInventoryValuationReport(filters);

      res.status(200).json({
        success: true,
        message: 'Inventory valuation report retrieved successfully.',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reports/sales
   */
  static getSales(req: Request, res: Response, next: NextFunction): void {
    try {
      const filters: ISalesReportFilters = {
        start_date: req.query.start_date ? String(req.query.start_date) : undefined,
        end_date: req.query.end_date ? String(req.query.end_date) : undefined,
        customer_id: req.query.customer_id ? String(req.query.customer_id) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
        search: req.query.search ? String(req.query.search) : undefined,
      };

      const data = ReportService.getSalesReport(filters);

      res.status(200).json({
        success: true,
        message: 'Sales analytics report retrieved successfully.',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reports/purchases
   */
  static getPurchases(req: Request, res: Response, next: NextFunction): void {
    try {
      const filters: IPurchaseReportFilters = {
        start_date: req.query.start_date ? String(req.query.start_date) : undefined,
        end_date: req.query.end_date ? String(req.query.end_date) : undefined,
        supplier_id: req.query.supplier_id ? String(req.query.supplier_id) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
        search: req.query.search ? String(req.query.search) : undefined,
      };

      const data = ReportService.getPurchasesReport(filters);

      res.status(200).json({
        success: true,
        message: 'Purchases analytics report retrieved successfully.',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reports/stock-movement
   */
  static getStockMovement(req: Request, res: Response, next: NextFunction): void {
    try {
      const filters: IStockMovementFilters = {
        start_date: req.query.start_date ? String(req.query.start_date) : undefined,
        end_date: req.query.end_date ? String(req.query.end_date) : undefined,
        product_id: req.query.product_id ? String(req.query.product_id) : undefined,
        transaction_type: req.query.transaction_type ? String(req.query.transaction_type) : undefined,
        search: req.query.search ? String(req.query.search) : undefined,
      };

      const data = ReportService.getStockMovementReport(filters);

      res.status(200).json({
        success: true,
        message: 'Stock movement transaction ledger report retrieved successfully.',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reports/export
   * Exports specified report as CSV stream
   */
  static exportReport(req: Request, res: Response, next: NextFunction): void {
    try {
      const reportType = String(req.query.report_type) as 'inventory' | 'sales' | 'purchases' | 'movement';
      const { filename, csvContent } = ReportService.exportReportToCsv(reportType, req.query);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  }
}
