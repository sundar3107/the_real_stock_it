import { Request, Response, NextFunction } from 'express';
import { PurchaseService } from '../services/PurchaseService';
import { IPurchaseFilterQuery, PurchaseStatus } from '../types/purchase.types';

export class PurchaseController {
  static getAll(req: Request, res: Response, next: NextFunction): void {
    try {
      const query: IPurchaseFilterQuery = {
        search: req.query.search as string | undefined,
        supplier_id: req.query.supplier_id as string | undefined,
        status: req.query.status as PurchaseStatus | undefined,
        from_date: (req.query.from_date || req.query.start_date) as string | undefined,
        to_date: (req.query.to_date || req.query.end_date) as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sort_by: req.query.sort_by as any,
        sort_order: req.query.sort_order as any,
      };

      const result = PurchaseService.getPurchases(query);
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
      const metrics = PurchaseService.getMetrics();
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
      const po = PurchaseService.getPurchaseById(id);
      res.status(200).json({
        success: true,
        data: po,
      });
    } catch (error) {
      next(error);
    }
  }

  static create(req: Request, res: Response, next: NextFunction): void {
    try {
      const userId = (req as any).user?.userId || 'usr_unknown';
      const created = PurchaseService.createPurchase(req.body, userId);
      res.status(201).json({
        success: true,
        message: 'Purchase order created successfully.',
        data: created,
      });
    } catch (error) {
      next(error);
    }
  }

  static update(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = req.params.id as string;
      const updated = PurchaseService.updatePurchase(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Purchase order updated successfully.',
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
      const userId = (req as any).user?.userId || 'usr_unknown';
      const updated = PurchaseService.updateStatus(id, status, userId);
      res.status(200).json({
        success: true,
        message: `Purchase order status changed to '${status}'.`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static receive(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = req.params.id as string;
      const userId = (req as any).user?.userId || 'usr_unknown';
      const result = PurchaseService.receivePurchase(id, req.body, userId);
      res.status(200).json({
        success: true,
        message: `Successfully received ${result.received_count} unit(s) into inventory.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
