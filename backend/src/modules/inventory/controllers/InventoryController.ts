import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/InventoryService';
import { IInventoryFilterQuery, ITransactionFilterQuery } from '../types/inventory.types';

export class InventoryController {
  static getOverview(req: Request, res: Response, next: NextFunction): void {
    try {
      const query: IInventoryFilterQuery = {
        search: req.query.search as string | undefined,
        category_id: req.query.category_id as string | undefined,
        stock_status: req.query.stock_status as any,
        product_status: req.query.product_status as any,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sort_by: req.query.sort_by as any,
        sort_order: req.query.sort_order as any,
      };

      const result = InventoryService.getStockOverview(query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static getItemStock(req: Request, res: Response, next: NextFunction): void {
    try {
      const productId = req.params.productId as string;
      const result = InventoryService.getItemStock(productId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static stockIn(req: Request, res: Response, next: NextFunction): void {
    try {
      const userId = req.user!.userId;
      const result = InventoryService.stockIn(req.body, userId);
      res.status(201).json({
        success: true,
        message: 'Stock IN recorded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static stockOut(req: Request, res: Response, next: NextFunction): void {
    try {
      const userId = req.user!.userId;
      const result = InventoryService.stockOut(req.body, userId);
      res.status(200).json({
        success: true,
        message: 'Stock OUT recorded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static adjust(req: Request, res: Response, next: NextFunction): void {
    try {
      const userId = req.user!.userId;
      const result = InventoryService.adjustStock(req.body, userId);
      res.status(200).json({
        success: true,
        message: 'Stock adjustment recorded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static getTransactions(req: Request, res: Response, next: NextFunction): void {
    try {
      const query: ITransactionFilterQuery = {
        product_id: req.query.product_id as string | undefined,
        transaction_type: req.query.transaction_type as any,
        date_from: req.query.date_from as string | undefined,
        date_to: req.query.date_to as string | undefined,
        performed_by: req.query.performed_by as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sort_order: req.query.sort_order as any,
      };

      const result = InventoryService.getTransactionHistory(query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static getTransactionById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = req.params.id as string;
      const result = InventoryService.getTransactionById(id);
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
      const metrics = InventoryService.getMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }
}
