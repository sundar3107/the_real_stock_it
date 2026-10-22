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
    'supplier:read',
    'customer:read',
    'purchase:read',
    'purchase:receive',
    'sales:read',
    'invoice:read',
    'report:inventory',
  ],
  SALES_MANAGER: [
    'product:read',
    'inventory:read',
    'supplier:read',
    'customer:read',
    'customer:manage',
    'purchase:read',
    'sales:read',
    'sales:create',
    'sales:update',
    'sales:approve',
    'sales:complete',
    'sales:manage',
    'invoice:read',
    'invoice:create',
    'invoice:update',
    'invoice:manage',
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
    'purchase:update',
    'purchase:approve',
    'purchase:receive',
    'purchase:manage',
    'sales:read',
    'invoice:read',
    'report:purchases',
  ],
  VIEWER: [
    'product:read',
    'inventory:read',
    'supplier:read',
    'customer:read',
    'purchase:read',
    'sales:read',
    'invoice:read',
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
