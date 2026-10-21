import { Request, Response, NextFunction } from 'express';
import { SalesService } from '../services/SalesService';
import { ISalesFilterQuery, SalesStatus } from '../types/sales.types';

export class SalesController {
  static getAll(req: Request, res: Response, next: NextFunction): void {
    try {
      const query: ISalesFilterQuery = {
        search: req.query.search as string | undefined,
        customer_id: req.query.customer_id as string | undefined,
        status: req.query.status as SalesStatus | undefined,
        from_date: (req.query.from_date || req.query.start_date) as string | undefined,
        to_date: (req.query.to_date || req.query.end_date) as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sort_by: req.query.sort_by as any,
        sort_order: req.query.sort_order as any,
      };

      const result = SalesService.getSales(query);
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
      const metrics = SalesService.getMetrics();
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
      const order = SalesService.getSaleById(id);
      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  static create(req: Request, res: Response, next: NextFunction): void {
    try {
      const userId = (req as any).user?.userId || 'usr_unknown';
      const created = SalesService.createSale(req.body, userId);
      res.status(201).json({
        success: true,
        message: 'Sales order created successfully.',
        data: created,
      });
    } catch (error) {
      next(error);
    }
  }

  static update(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = req.params.id as string;
      const updated = SalesService.updateSale(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Sales order updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static updateStatus(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = req.params.id as string;
      const userId = (req as any).user?.userId || 'usr_unknown';
      const { status } = req.body;
      const updated = SalesService.updateStatus(id, status, userId);
      res.status(200).json({
        success: true,
        message: `Sales order status changed to '${status}'.`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static complete(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = req.params.id as string;
      const userId = (req as any).user?.userId || 'usr_unknown';
      const completed = SalesService.completeSale(id, userId);
      res.status(200).json({
        success: true,
        message: `Sales order #${completed.order_number} completed successfully and stock deducted from inventory.`,
        data: completed,
      });
    } catch (error) {
      next(error);
    }
  }
}
