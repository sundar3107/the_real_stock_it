import { Request, Response, NextFunction } from 'express';
import { AppError } from '../modules/authentication/services/AuthService';

/**
 * Centralized error-handling middleware.
 * Ensures consistent error shapes and prevents exposing internal database or stack traces.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(err);
  }

  // Handle custom application errors with explicit status codes
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  // Log non-operational errors internally
  console.error('[UNHANDLED_ERROR]', err);

  // Fallback internal server error
  res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred. Please try again later.',
  });
}
