import { db } from '../../../database/connection';
import { AppError } from '../../authentication/services/AuthService';
import { NotificationModel } from '../models/Notification';
import {
  ICreateNotificationDto,
  INotification,
  INotificationFilterQuery,
  INotificationListResponse,
  NotificationType,
} from '../types/notification.types';

export class NotificationService {
  /**
   * Find user IDs belonging to the specified roles.
   */
  private static getUserIdsByRoles(roles: string[]): string[] {
    if (!roles || roles.length === 0) return [];
    const placeholders = roles.map(() => '?').join(',');
    const rows = db
      .prepare(`
        SELECT u.id 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.status = 'ACTIVE' AND r.name IN (${placeholders})
      `)
      .all(...roles) as any[];

    return rows.map((r) => r.id);
  }

  /**
   * Retrieve notifications for a specific user with pagination & filters.
   */
  static getNotifications(
    userId: string,
    filters: INotificationFilterQuery = {}
  ): INotificationListResponse {
    // Proactively check inventory stock alerts so warehouse staff see latest alerts
    this.checkAndGenerateInventoryAlerts();

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));

    const result = NotificationModel.findByUserId(userId, {
      ...filters,
      page,
      limit,
    });

    const totalPages = Math.ceil(result.total / limit) || 1;

    return {
      notifications: result.notifications,
      total: result.total,
      unread_count: result.unread_count,
      page,
      limit,
      total_pages: totalPages,
    };
  }

  /**
   * Retrieve total unread notifications count for a specific user.
   */
  static getUnreadCount(userId: string): number {
    // Proactively evaluate inventory alerts
    this.checkAndGenerateInventoryAlerts();
    return NotificationModel.getUnreadCount(userId);
  }

  /**
   * Create a single notification with duplicate-prevention logic.
   */
  static createNotification(dto: ICreateNotificationDto): INotification | null {
    // Enforce duplicate prevention: If an identical unread alert exists, skip insertion
    if (dto.reference_type && dto.reference_id) {
      const exists = NotificationModel.existsUnread(
        dto.user_id,
        dto.type,
        dto.reference_type,
        dto.reference_id
      );
      if (exists) {
        return null; // Prevent duplicate unread notifications
      }
    }

    return NotificationModel.create(dto);
  }

  /**
   * Dispatch a notification to all active users with the specified roles.
   */
  static notifyRoles(
    roles: string[],
    payload: Omit<ICreateNotificationDto, 'user_id'>
  ): INotification[] {
    const userIds = this.getUserIdsByRoles(roles);
    const created: INotification[] = [];

    for (const userId of userIds) {
      const notif = this.createNotification({
        ...payload,
        user_id: userId,
      });
      if (notif) {
        created.push(notif);
      }
    }

    return created;
  }

  /**
   * Mark a single notification as read.
   */
  static markAsRead(id: string, userId: string): INotification {
    const notification = NotificationModel.findById(id);
    if (!notification || notification.user_id !== userId) {
      throw new AppError(`Notification with ID '${id}' not found or access denied`, 404);
    }

    NotificationModel.markAsRead(id, userId);
    return NotificationModel.findById(id)!;
  }

  /**
   * Mark all unread notifications as read for a given user.
   */
  static markAllAsRead(userId: string): { updated_count: number } {
    const updatedCount = NotificationModel.markAllAsRead(userId);
    return { updated_count: updatedCount };
  }

  /**
   * CORE INVENTORY ALERT CHECK:
   * Reuses authoritative product & inventory quantities (Current Stock <= Reorder Level).
   * Generates LOW_STOCK and OUT_OF_STOCK notifications for ADMIN and INVENTORY_MANAGER users
   * with strict duplicate prevention.
   */
  static checkAndGenerateInventoryAlerts(): void {
    try {
      const query = `
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.unit,
          p.reorder_level,
          COALESCE(i.current_quantity, p.current_stock, 0) AS current_quantity
        FROM products p
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE p.status = 'ACTIVE'
      `;
      const products = db.prepare(query).all() as any[];
      const targetRoles = ['ADMIN', 'INVENTORY_MANAGER'];
      const targetUserIds = this.getUserIdsByRoles(targetRoles);

      for (const prod of products) {
        const qty = Number(prod.current_quantity) || 0;
        const reorderLevel = Number(prod.reorder_level) || 0;

        if (qty === 0) {
          // OUT OF STOCK Alert
          for (const userId of targetUserIds) {
            this.createNotification({
              user_id: userId,
              type: 'OUT_OF_STOCK',
              title: `Out of Stock Alert: ${prod.name}`,
              message: `Product '${prod.name}' (${prod.sku}) is completely out of stock (0 ${prod.unit} remaining). Reorder level is ${reorderLevel}.`,
              reference_type: 'PRODUCT',
              reference_id: prod.id,
            });
          }
        } else if (qty <= reorderLevel) {
          // LOW STOCK Alert
          for (const userId of targetUserIds) {
            this.createNotification({
              user_id: userId,
              type: 'LOW_STOCK',
              title: `Low Stock Alert: ${prod.name}`,
              message: `Product '${prod.name}' (${prod.sku}) stock level has dropped to ${qty} ${prod.unit} (Reorder level: ${reorderLevel}).`,
              reference_type: 'PRODUCT',
              reference_id: prod.id,
            });
          }
        }
      }
    } catch (err) {
      console.error('[NotificationService] Error evaluating inventory stock alerts:', err);
    }
  }

  /**
   * Event helper: Purchase order state change notification.
   */
  static notifyPurchaseOrderEvent(
    poId: string,
    status: string,
    supplierName: string
  ): void {
    this.notifyRoles(['ADMIN', 'PURCHASE_MANAGER'], {
      type: 'PURCHASE_ORDER',
      title: `Purchase Order ${status}: ${supplierName}`,
      message: `Purchase order #${poId.slice(0, 8)} for supplier '${supplierName}' status transitioned to ${status}.`,
      reference_type: 'PURCHASE_ORDER',
      reference_id: poId,
    });
  }

  /**
   * Event helper: Sales order state change notification.
   */
  static notifySalesOrderEvent(
    soId: string,
    orderNumber: string,
    status: string
  ): void {
    this.notifyRoles(['ADMIN', 'SALES_MANAGER'], {
      type: 'SALES_ORDER',
      title: `Sales Order ${status}: ${orderNumber}`,
      message: `Sales order ${orderNumber} is now ${status}.`,
      reference_type: 'SALES_ORDER',
      reference_id: soId,
    });
  }

  /**
   * Event helper: Commercial invoice event notification.
   */
  static notifyInvoiceEvent(
    invoiceId: string,
    invoiceNumber: string,
    status: string
  ): void {
    this.notifyRoles(['ADMIN', 'SALES_MANAGER'], {
      type: 'INVOICE',
      title: `Invoice ${status}: ${invoiceNumber}`,
      message: `Invoice ${invoiceNumber} status updated to ${status}.`,
      reference_type: 'INVOICE',
      reference_id: invoiceId,
    });
  }
}
