import { Router } from 'express';
import { CustomerController } from '../controllers/CustomerController';
import { authenticate, authorizeRoles } from '../../../middleware/authMiddleware';

const router = Router();

// Read operations: Accessible by ADMIN, SALES_MANAGER, INVENTORY_MANAGER, PURCHASE_MANAGER, VIEWER
router.get(
  '/',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER', 'INVENTORY_MANAGER', 'PURCHASE_MANAGER', 'VIEWER'),
  CustomerController.getAll
);

router.get(
  '/metrics',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER', 'INVENTORY_MANAGER', 'PURCHASE_MANAGER', 'VIEWER'),
  CustomerController.getMetrics
);

router.get(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER', 'INVENTORY_MANAGER', 'PURCHASE_MANAGER', 'VIEWER'),
  CustomerController.getById
);

// Write / Modification operations: Restricted to ADMIN & SALES_MANAGER
router.post(
  '/',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER'),
  CustomerController.create
);

router.put(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER'),
  CustomerController.update
);

router.patch(
  '/:id/status',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER'),
  CustomerController.updateStatus
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER'),
  CustomerController.delete
);

export default router;
