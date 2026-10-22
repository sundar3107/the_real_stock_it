import { Router } from 'express';
import { AdministrationController } from '../controllers/AdministrationController';
import { authenticate, authorizeRoles } from '../../../middleware/authMiddleware';

const router = Router();

// Strictly restrict entire administrative module to users with the ADMIN role
router.use(authenticate, authorizeRoles('ADMIN'));

// Administrative Telemetry Overview
router.get('/summary', AdministrationController.getSummary);

// User Management Endpoints
router.get('/users', AdministrationController.getUsers);
router.get('/users/:id', AdministrationController.getUserById);
router.post('/users', AdministrationController.createUser);
router.put('/users/:id', AdministrationController.updateUser);
router.patch('/users/:id/status', AdministrationController.updateUserStatus);
router.patch('/users/:id/role', AdministrationController.updateUserRole);

// Roles & Permissions Matrix
router.get('/roles', AdministrationController.getRoles);

// System Configuration Settings
router.get('/settings', AdministrationController.getSettings);
router.put('/settings', AdministrationController.updateSettings);

export default router;
