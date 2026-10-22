import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/NotificationService';
import { INotificationFilterQuery } from '../types/notification.types';

export class NotificationController {
  /**
   * GET /api/notifications
   * List notifications for authenticated user with pagination and filters
   */
  static getNotifications(req: Request, res: Response, next: NextFunction): void {
    try {
      const userId = req.user!.userId;
      const filters: INotificationFilterQuery = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        is_read: req.query.is_read !== undefined ? String(req.query.is_read) : undefined,
        type: req.query.type ? String(req.query.type) : undefined,
      };

      const result = NotificationService.getNotifications(userId, filters);

      res.status(200).json({
        success: true,
        message: 'Notifications retrieved successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/unread-count
   * Returns total unread count for current user
   */
  static getUnreadCount(req: Request, res: Response, next: NextFunction): void {
    try {
      const userId = req.user!.userId;
      const unreadCount = NotificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: {
          unread_count: unreadCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Mark a single notification as read
   */
  static markAsRead(req: Request, res: Response, next: NextFunction): void {
    try {
      const userId = req.user!.userId;
      const id = String(req.params.id);

      const updated = NotificationService.markAsRead(id, userId);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/read-all
   * Mark all unread notifications as read for current user
   */
  static markAllAsRead(req: Request, res: Response, next: NextFunction): void {
    try {
      const userId = req.user!.userId;
      const result = NotificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
