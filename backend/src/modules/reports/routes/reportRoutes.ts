import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';
import { authenticate, authorizeRoles } from '../../../middleware/authMiddleware';
import { validateDateRange, validateExportQuery } from '../validators/reportValidators';

const router = Router();

// Reports access requires authentication across standard roles
router.use(authenticate);
router.use(
  authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'SALES_MANAGER', 'PURCHASE_MANAGER', 'VIEWER')
);

router.get('/inventory-valuation', ReportController.getInventoryValuation);
router.get('/sales', validateDateRange, ReportController.getSales);
router.get('/purchases', validateDateRange, ReportController.getPurchases);
router.get('/stock-movement', validateDateRange, ReportController.getStockMovement);
router.get('/export', validateExportQuery, validateDateRange, ReportController.exportReport);

export default router;
