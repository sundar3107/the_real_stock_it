import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { authenticate, authorizePermission } from '../../../middleware/authMiddleware';

const router = Router();

// All product routes require authentication
router.use(authenticate);

router.get('/', authorizePermission('product:read'), ProductController.getAll);
router.get('/:id', authorizePermission('product:read'), ProductController.getById);
router.post('/', authorizePermission('product:create'), ProductController.create);
router.put('/:id', authorizePermission('product:update'), ProductController.update);
router.delete('/:id', authorizePermission('product:delete'), ProductController.delete);

export default router;
