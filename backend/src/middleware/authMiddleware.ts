import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/tokenUtils';
import { IJwtPayload, UserRole } from '../modules/authentication/types/auth.types';
import { RoleService } from '../modules/authentication/services/RoleService';

// Extend Express Request interface to carry decoded user payload
declare global {
  namespace Express {
    interface Request {
      user?: IJwtPayload;
    }
  }
}

/**
 * Authentication middleware: Validates JWT token from the Authorization header
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Missing or malformed token.',
    });
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication session. Please log in again.',
    });
    return;
  }

  req.user = payload;
  next();
}

/**
 * Authorization middleware: Enforces that the user has one of the allowed roles
 */
export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access forbidden: You do not have permission to perform this action.',
      });
      return;
    }

    next();
  };
}

/**
 * Permission-based authorization middleware
 */
export function authorizePermission(action: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!RoleService.can(req.user.role, action)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Missing required permission '${action}'.`,
      });
      return;
    }

    next();
  };
}
