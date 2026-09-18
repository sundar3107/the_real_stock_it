import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../../../middleware/authMiddleware';

const router = Router();

// Public authentication routes
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/logout', AuthController.logout);
router.get('/roles', AuthController.getRoles);

// Protected authenticated routes
router.get('/me', authenticate, AuthController.getMe);
router.put('/profile', authenticate, AuthController.updateProfile);

export default router;
