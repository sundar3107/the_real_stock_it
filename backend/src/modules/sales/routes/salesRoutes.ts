import { Router } from 'express';
import { SalesController } from '../controllers/SalesController';
import { authenticate, authorizeRoles } from '../../../middleware/authMiddleware';

const router = Router();

// Read operations: Accessible by ADMIN, SALES_MANAGER, INVENTORY_MANAGER, PURCHASE_MANAGER, VIEWER
router.get(
  '/',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER', 'INVENTORY_MANAGER', 'PURCHASE_MANAGER', 'VIEWER'),
  SalesController.getAll
);

router.get(
  '/metrics',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER', 'INVENTORY_MANAGER', 'PURCHASE_MANAGER', 'VIEWER'),
  SalesController.getMetrics
);

router.get(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER', 'INVENTORY_MANAGER', 'PURCHASE_MANAGER', 'VIEWER'),
  SalesController.getById
);

// Order creation & modification: Restricted to ADMIN & SALES_MANAGER
router.post(
  '/',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER'),
  SalesController.create
);

router.put(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER'),
  SalesController.update
);

router.patch(
  '/:id/status',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER'),
  SalesController.updateStatus
);

// Complete sale & deduct stock: Restricted to ADMIN & SALES_MANAGER
router.post(
  '/:id/complete',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER'),
  SalesController.complete
);

export default router;
