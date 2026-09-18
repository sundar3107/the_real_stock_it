import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { RoleService } from '../services/RoleService';

export class AuthController {
  /**
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    // On JWT token-based auth, client clears its local token.
    // Endpoint confirms successful state clearing.
    res.status(200).json({
      success: true,
      message: 'Successfully logged out',
    });
  }

  /**
   * GET /api/auth/me
   */
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const user = await AuthService.getCurrentUser(userId);
      const permissions = RoleService.getPermissions(user.role);

      res.status(200).json({
        success: true,
        data: {
          user,
          permissions,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/auth/profile
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const updatedUser = await AuthService.updateProfile(userId, req.body);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/roles
   */
  static async getRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = RoleService.getAllRoles();
      res.status(200).json({
        success: true,
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }
}
