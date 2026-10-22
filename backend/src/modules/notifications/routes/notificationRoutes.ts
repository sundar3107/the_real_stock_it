import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authenticate } from '../../../middleware/authMiddleware';
import { validateNotificationQuery } from '../validators/notificationValidators';

const router = Router();

// All notification operations require authentication
router.use(authenticate);

router.get('/', validateNotificationQuery, NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:id/read', NotificationController.markAsRead);

export default router;
