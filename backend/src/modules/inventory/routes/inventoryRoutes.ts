import { Router } from 'express';
import { InventoryController } from '../controllers/InventoryController';
import { authenticate, authorizePermission } from '../../../middleware/authMiddleware';

const router = Router();

// All inventory routes require authentication
router.use(authenticate);

// Overview & Item Queries
router.get('/', authorizePermission('inventory:read'), InventoryController.getOverview);
router.get('/overview', authorizePermission('inventory:read'), InventoryController.getOverview);
router.get('/metrics', authorizePermission('inventory:read'), InventoryController.getMetrics);
router.get('/item/:productId', authorizePermission('inventory:read'), InventoryController.getItemStock);

// Stock Movements
router.post('/stock-in', authorizePermission('inventory:manage'), InventoryController.stockIn);
router.post('/stock-out', authorizePermission('inventory:manage'), InventoryController.stockOut);
router.post('/adjust', authorizePermission('inventory:adjust'), InventoryController.adjust);

// Immutable Transaction Ledger
router.get('/transactions', authorizePermission('inventory:read'), InventoryController.getTransactions);
router.get('/transactions/:id', authorizePermission('inventory:read'), InventoryController.getTransactionById);

export default router;
