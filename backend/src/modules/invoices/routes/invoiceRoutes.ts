import { Router } from 'express';
import { InvoiceController } from '../controllers/InvoiceController';
import { authenticate, authorizeRoles } from '../../../middleware/authMiddleware';

const router = Router();

// Read operations: Accessible by ADMIN, SALES_MANAGER, INVENTORY_MANAGER, PURCHASE_MANAGER, VIEWER
router.get(
  '/',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER', 'INVENTORY_MANAGER', 'PURCHASE_MANAGER', 'VIEWER'),
  InvoiceController.getAll
);

router.get(
  '/metrics',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER', 'INVENTORY_MANAGER', 'PURCHASE_MANAGER', 'VIEWER'),
  InvoiceController.getMetrics
);

router.get(
  '/preview-sales/:salesOrderId',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER', 'INVENTORY_MANAGER', 'PURCHASE_MANAGER', 'VIEWER'),
  InvoiceController.getPreviewFromSales
);

router.get(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER', 'INVENTORY_MANAGER', 'PURCHASE_MANAGER', 'VIEWER'),
  InvoiceController.getById
);

// Creation and modification: Restricted to ADMIN & SALES_MANAGER
router.post(
  '/',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER'),
  InvoiceController.create
);

router.put(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER'),
  InvoiceController.update
);

router.patch(
  '/:id/status',
  authenticate,
  authorizeRoles('ADMIN', 'SALES_MANAGER'),
  InvoiceController.updateStatus
);

export default router;
