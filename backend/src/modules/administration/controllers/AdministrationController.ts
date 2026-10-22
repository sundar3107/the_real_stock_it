import { Request, Response, NextFunction } from 'express';
import { AdministrationService } from '../services/AdministrationService';
import { IUserFilterQuery } from '../types/administration.types';

export class AdministrationController {
  static getUsers(req: Request, res: Response, next: NextFunction): void {
    try {
      const query: IUserFilterQuery = {
        search: req.query.search as string | undefined,
        role: req.query.role as string | undefined,
        status: req.query.status as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };

      const result = AdministrationService.getUsers(query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static getUserById(req: Request, res: Response, next: NextFunction): void {
    try {
      const userId = req.params.id as string;
      const user = AdministrationService.getUserById(userId);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.user?.userId;
      const created = await AdministrationService.createUser(req.body, adminUserId);
      res.status(201).json({
        success: true,
        message: `User '${created.full_name}' created successfully.`,
        data: created,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id as string;
      const adminUserId = req.user?.userId;
      const updated = await AdministrationService.updateUser(userId, req.body, adminUserId);
      res.status(200).json({
        success: true,
        message: `User '${updated.full_name}' updated successfully.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static updateUserStatus(req: Request, res: Response, next: NextFunction): void {
    try {
      const userId = req.params.id as string;
      const { status } = req.body;
      const adminUserId = req.user?.userId;
      const updated = AdministrationService.updateUserStatus(userId, status, adminUserId);
      res.status(200).json({
        success: true,
        message: `User status changed to '${status}'.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static updateUserRole(req: Request, res: Response, next: NextFunction): void {
    try {
      const userId = req.params.id as string;
      const { role } = req.body;
      const adminUserId = req.user?.userId;
      const updated = AdministrationService.updateUserRole(userId, role, adminUserId);
      res.status(200).json({
        success: true,
        message: `User role changed to '${role}'.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static getRoles(req: Request, res: Response, next: NextFunction): void {
    try {
      const roles = AdministrationService.getRolesWithPermissions();
      res.status(200).json({
        success: true,
        data: roles,
      });
    } catch (err) {
      next(err);
    }
  }

  static getSettings(req: Request, res: Response, next: NextFunction): void {
    try {
      const result = AdministrationService.getSettings();
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static updateSettings(req: Request, res: Response, next: NextFunction): void {
    try {
      const adminUserId = req.user?.userId;
      const settingsPayload = req.body.settings || req.body;
      const updated = AdministrationService.updateSettings(settingsPayload, adminUserId);
      res.status(200).json({
        success: true,
        message: 'System settings updated successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static getSummary(req: Request, res: Response, next: NextFunction): void {
    try {
      const summary = AdministrationService.getAdminSummary();
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }
}
