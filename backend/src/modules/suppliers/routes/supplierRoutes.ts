import { Router } from 'express';
import { SupplierController } from '../controllers/SupplierController';
import { authenticate, authorizeRoles } from '../../../middleware/authMiddleware';

const router = Router();

// Read operations: Available to all authenticated roles
router.get(
  '/',
  authenticate,
  authorizeRoles('ADMIN', 'PURCHASE_MANAGER', 'INVENTORY_MANAGER', 'SALES_MANAGER', 'VIEWER'),
  SupplierController.getAll
);

router.get(
  '/metrics',
  authenticate,
  authorizeRoles('ADMIN', 'PURCHASE_MANAGER', 'INVENTORY_MANAGER', 'SALES_MANAGER', 'VIEWER'),
  SupplierController.getMetrics
);

router.get(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN', 'PURCHASE_MANAGER', 'INVENTORY_MANAGER', 'SALES_MANAGER', 'VIEWER'),
  SupplierController.getById
);

router.get(
  '/:id/products',
  authenticate,
  authorizeRoles('ADMIN', 'PURCHASE_MANAGER', 'INVENTORY_MANAGER', 'SALES_MANAGER', 'VIEWER'),
  SupplierController.getProducts
);

// Write / Modification operations: Restricted to ADMIN & PURCHASE_MANAGER
router.post(
  '/',
  authenticate,
  authorizeRoles('ADMIN', 'PURCHASE_MANAGER'),
  SupplierController.create
);

router.put(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN', 'PURCHASE_MANAGER'),
  SupplierController.update
);

router.patch(
  '/:id/status',
  authenticate,
  authorizeRoles('ADMIN', 'PURCHASE_MANAGER'),
  SupplierController.updateStatus
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN', 'PURCHASE_MANAGER'),
  SupplierController.delete
);

router.post(
  '/:id/products',
  authenticate,
  authorizeRoles('ADMIN', 'PURCHASE_MANAGER'),
  SupplierController.associateProducts
);

router.delete(
  '/:id/products/:productId',
  authenticate,
  authorizeRoles('ADMIN', 'PURCHASE_MANAGER'),
  SupplierController.disassociateProduct
);

export default router;
