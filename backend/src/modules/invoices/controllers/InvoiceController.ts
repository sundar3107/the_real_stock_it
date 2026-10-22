import { Request, Response, NextFunction } from 'express';
import { InvoiceService } from '../services/InvoiceService';
import { IInvoiceFilterQuery, InvoiceStatus } from '../types/invoice.types';

export class InvoiceController {
  static getAll(req: Request, res: Response, next: NextFunction): void {
    try {
      const query: IInvoiceFilterQuery = {
        search: req.query.search as string | undefined,
        status: req.query.status as InvoiceStatus | undefined,
        customer_id: req.query.customer_id as string | undefined,
        sales_order_id: req.query.sales_order_id as string | undefined,
        from_date: (req.query.from_date || req.query.start_date) as string | undefined,
        to_date: (req.query.to_date || req.query.end_date) as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sort_by: req.query.sort_by as any,
        sort_order: req.query.sort_order as any,
      };

      const result = InvoiceService.getInvoices(query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static getMetrics(req: Request, res: Response, next: NextFunction): void {
    try {
      const metrics = InvoiceService.getMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  static getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = req.params.id as string;
      const invoice = InvoiceService.getInvoiceById(id);
      res.status(200).json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  static getPreviewFromSales(req: Request, res: Response, next: NextFunction): void {
    try {
      const salesOrderId = req.params.salesOrderId as string;
      const preview = InvoiceService.getSalesOrderInvoicePreview(salesOrderId);
      res.status(200).json({
        success: true,
        data: preview,
      });
    } catch (error) {
      next(error);
    }
  }

  static create(req: Request, res: Response, next: NextFunction): void {
    try {
      const userId = (req as any).user?.userId || 'usr_unknown';
      const created = InvoiceService.createInvoice(req.body, userId);
      res.status(201).json({
        success: true,
        message: `Commercial invoice #${created.invoice_number} created successfully.`,
        data: created,
      });
    } catch (error) {
      next(error);
    }
  }

  static update(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = req.params.id as string;
      const updated = InvoiceService.updateInvoice(id, req.body);
      res.status(200).json({
        success: true,
        message: `Invoice #${updated.invoice_number} updated successfully.`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static updateStatus(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const userId = (req as any).user?.userId;
      const updated = InvoiceService.updateStatus(id, status, userId);
      res.status(200).json({
        success: true,
        message: `Invoice #${updated.invoice_number} status changed to '${status}'.`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}
