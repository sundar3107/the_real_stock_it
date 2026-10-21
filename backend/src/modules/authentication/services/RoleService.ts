import { RoleModel } from '../models/Role';
import { IRole, UserRole } from '../types/auth.types';

/**
 * Permissions matrix mapping roles to permitted actions.
 * Allows future modules to query: RoleService.can(role, 'inventory:adjust')
 * instead of scattering hardcoded string checks.
 */
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: [
    '*', // Wildcard: Full administrative power
  ],
  INVENTORY_MANAGER: [
    'product:read',
    'product:create',
    'product:update',
    'product:delete',
    'inventory:read',
    'inventory:adjust',
    'inventory:manage',
    'supplier:read',
    'customer:read',
    'report:inventory',
  ],
  SALES_MANAGER: [
    'product:read',
    'inventory:read',
    'supplier:read',
    'customer:read',
    'customer:manage',
    'sales:read',
    'sales:create',
    'sales:approve',
    'invoice:read',
    'invoice:create',
    'report:sales',
  ],
  PURCHASE_MANAGER: [
    'product:read',
    'inventory:read',
    'supplier:read',
    'supplier:manage',
    'customer:read',
    'purchase:read',
    'purchase:create',
    'purchase:approve',
    'report:purchases',
  ],
  VIEWER: [
    'product:read',
    'inventory:read',
    'supplier:read',
    'customer:read',
    'sales:read',
    'purchase:read',
    'report:read',
  ],
};

export class RoleService {
  /**
   * Check if a specific role is allowed to perform a given action.
   */
  static can(role: UserRole, action: string): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    if (permissions.includes('*')) {
      return true;
    }
    return permissions.includes(action);
  }

  /**
   * Check if a user is permitted to perform a given action.
   */
  static canUser(user: { role: UserRole }, action: string): boolean {
    if (!user || !user.role) return false;
    return this.can(user.role, action);
  }

  /**
   * Retrieve list of permission action strings for a given role.
   */
  static getPermissions(role: UserRole): string[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Retrieve all roles from the database.
   */
  static getAllRoles(): IRole[] {
    return RoleModel.findAll();
  }

  /**
   * Find role by name.
   */
  static getRoleByName(name: UserRole): IRole | null {
    return RoleModel.findByName(name);
  }
}
