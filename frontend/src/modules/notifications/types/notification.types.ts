export type NotificationType =
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'PURCHASE_ORDER'
  | 'SALES_ORDER'
  | 'INVOICE'
  | 'SYSTEM';

export type ReferenceType =
  | 'PRODUCT'
  | 'PURCHASE_ORDER'
  | 'SALES_ORDER'
  | 'INVOICE'
  | 'SYSTEM';

export interface INotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  reference_type: ReferenceType | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface INotificationFilterQuery {
  page?: number;
  limit?: number;
  is_read?: boolean | string;
  type?: NotificationType | string;
}

export interface INotificationListResponse {
  notifications: INotification[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
  total_pages: number;
}
