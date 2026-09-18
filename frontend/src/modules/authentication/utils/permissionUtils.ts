import { IUser, UserRole } from '../types/auth.types';

/**
 * Role permissions mapping on frontend for declarative UI capability checks.
 */
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ['*'],
  INVENTORY_MANAGER: [
    'product:read',
    'product:create',
    'product:update',
    'product:delete',
    'inventory:read',
    'inventory:adjust',
    'inventory:manage',
    'report:inventory',
  ],
  SALES_MANAGER: [
    'product:read',
    'inventory:read',
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
    'purchase:read',
    'purchase:create',
    'purchase:approve',
    'report:purchases',
  ],
  VIEWER: [
    'product:read',
    'inventory:read',
    'sales:read',
    'purchase:read',
    'report:read',
  ],
};

/**
 * Check if a given user can perform an action.
 * Usage: can(user, 'inventory:adjust')
 */
export function can(user: IUser | null, action: string): boolean {
  if (!user || !user.role) return false;
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  if (permissions.includes('*')) {
    return true;
  }
  return permissions.includes(action);
}

/**
 * Check if a given user has any of the specified roles.
 * Usage: hasRole(user, ['ADMIN', 'INVENTORY_MANAGER'])
 */
export function hasRole(user: IUser | null, roles: UserRole[]): boolean {
  if (!user || !user.role) return false;
  return roles.includes(user.role);
}
