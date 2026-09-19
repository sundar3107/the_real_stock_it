import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { authenticate, authorizePermission } from '../../../middleware/authMiddleware';

const router = Router();

// All category routes require authentication
router.use(authenticate);

router.get('/', authorizePermission('product:read'), CategoryController.getAll);
router.get('/:id', authorizePermission('product:read'), CategoryController.getById);
router.post('/', authorizePermission('product:create'), CategoryController.create);
router.put('/:id', authorizePermission('product:update'), CategoryController.update);
router.delete('/:id', authorizePermission('product:delete'), CategoryController.delete);

export default router;
