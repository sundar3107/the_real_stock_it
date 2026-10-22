import { Router } from 'express';
import { AuditController } from '../controllers/AuditController';
import { authenticate, authorizeRoles } from '../../../middleware/authMiddleware';
import { validateAuditQuery } from '../validators/auditValidators';

const router = Router();

// Strictly restricted to ADMIN role for enterprise governance & traceability
router.use(authenticate);
router.use(authorizeRoles('ADMIN'));

// Append-oriented audit records: Read-only access endpoints
router.get('/logs', validateAuditQuery, AuditController.getLogs);
router.get('/logs/:id', AuditController.getLogById);

export default router;
