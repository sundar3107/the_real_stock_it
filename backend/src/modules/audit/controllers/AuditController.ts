import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/AuditService';
import { IAuditFilterQuery } from '../types/audit.types';

export class AuditController {
  /**
   * GET /api/audit/logs
   * List paginated audit trail logs with filtering
   */
  static getLogs(req: Request, res: Response, next: NextFunction): void {
    try {
      const query: IAuditFilterQuery = {
        search: req.query.search ? String(req.query.search) : undefined,
        user_id: req.query.user_id ? String(req.query.user_id) : undefined,
        module: req.query.module ? String(req.query.module) : undefined,
        action: req.query.action ? String(req.query.action) : undefined,
        entity_type: req.query.entity_type ? String(req.query.entity_type) : undefined,
        start_date: req.query.start_date ? String(req.query.start_date) : undefined,
        end_date: req.query.end_date ? String(req.query.end_date) : undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };

      const result = AuditService.getLogs(query);

      res.status(200).json({
        success: true,
        message: 'Activity audit logs retrieved successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/audit/logs/:id
   * Get single detailed audit log record
   */
  static getLogById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = String(req.params.id);
      const log = AuditService.getLogById(id);

      res.status(200).json({
        success: true,
        message: 'Audit log details retrieved successfully.',
        data: log,
      });
    } catch (error) {
      next(error);
    }
  }
}
