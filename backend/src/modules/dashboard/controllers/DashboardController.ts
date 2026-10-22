import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/DashboardService';

export class DashboardController {
  static getSummary(req: Request, res: Response, next: NextFunction): void {
    try {
      const userRole = (req as any).user?.role || 'ADMIN';
      const summary = DashboardService.getSummary(userRole);
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  static getInventory(req: Request, res: Response, next: NextFunction): void {
    try {
      const inventory = DashboardService.getInventorySummary();
      res.status(200).json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      next(error);
    }
  }

  static getSales(req: Request, res: Response, next: NextFunction): void {
    try {
      const sales = DashboardService.getSalesSummary();
      res.status(200).json({
        success: true,
        data: sales,
      });
    } catch (error) {
      next(error);
    }
  }

  static getPurchases(req: Request, res: Response, next: NextFunction): void {
    try {
      const purchases = DashboardService.getPurchasesSummary();
      res.status(200).json({
        success: true,
        data: purchases,
      });
    } catch (error) {
      next(error);
    }
  }

  static getRecent(req: Request, res: Response, next: NextFunction): void {
    try {
      const limit = req.query.limit ? Math.min(50, Math.max(1, Number(req.query.limit))) : 10;
      const recent = DashboardService.getRecentActivity(limit);
      res.status(200).json({
        success: true,
        data: recent,
      });
    } catch (error) {
      next(error);
    }
  }

  static getCharts(req: Request, res: Response, next: NextFunction): void {
    try {
      const charts = DashboardService.getChartData();
      res.status(200).json({
        success: true,
        data: charts,
      });
    } catch (error) {
      next(error);
    }
  }
}
