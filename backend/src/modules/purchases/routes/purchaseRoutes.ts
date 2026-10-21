import { Router } from 'express';
import { PurchaseController } from '../controllers/PurchaseController';
import { authenticate, authorizeRoles } from '../../../middleware/authMiddleware';

const router = Router();

// Read operations: Accessible by ADMIN, PURCHASE_MANAGER, INVENTORY_MANAGER, SALES_MANAGER, VIEWER
router.get(
  '/',
  authenticate,
  authorizeRoles('ADMIN', 'PURCHASE_MANAGER', 'INVENTORY_MANAGER', 'SALES_MANAGER', 'VIEWER'),
  PurchaseController.getAll
);

router.get(
  '/metrics',
  authenticate,
  authorizeRoles('ADMIN', 'PURCHASE_MANAGER', 'INVENTORY_MANAGER', 'SALES_MANAGER', 'VIEWER'),
  PurchaseController.getMetrics
);

router.get(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN', 'PURCHASE_MANAGER', 'INVENTORY_MANAGER', 'SALES_MANAGER', 'VIEWER'),
  PurchaseController.getById
);

// Order creation & modification: Restricted to ADMIN & PURCHASE_MANAGER
router.post(
  '/',
  authenticate,
  authorizeRoles('ADMIN', 'PURCHASE_MANAGER'),
  PurchaseController.create
);

router.put(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN', 'PURCHASE_MANAGER'),
  PurchaseController.update
);

router.patch(
  '/:id/status',
  authenticate,
  authorizeRoles('ADMIN', 'PURCHASE_MANAGER'),
  PurchaseController.updateStatus
);

// Inbound Goods Receiving: Accessible by ADMIN, PURCHASE_MANAGER, and INVENTORY_MANAGER
router.post(
  '/:id/receive',
  authenticate,
  authorizeRoles('ADMIN', 'PURCHASE_MANAGER', 'INVENTORY_MANAGER'),
  PurchaseController.receive
);

export default router;
