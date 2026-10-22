import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authenticate, authorizeRoles } from '../../../middleware/authMiddleware';

const router = Router();

// All dashboard endpoints require authentication and are accessible across roles
router.use(authenticate);
router.use(
  authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'SALES_MANAGER', 'PURCHASE_MANAGER', 'VIEWER')
);

router.get('/summary', DashboardController.getSummary);
router.get('/inventory', DashboardController.getInventory);
router.get('/sales', DashboardController.getSales);
router.get('/purchases', DashboardController.getPurchases);
router.get('/recent', DashboardController.getRecent);
router.get('/charts', DashboardController.getCharts);

export default router;
