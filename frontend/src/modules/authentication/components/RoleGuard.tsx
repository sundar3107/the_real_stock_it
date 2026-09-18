import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/auth.types';
import { can, hasRole } from '../utils/permissionUtils';

interface RoleGuardProps {
  action?: string;
  roles?: UserRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Reusable authorization component.
 * Allows components across future modules to check capabilities declaratively:
 * <RoleGuard action="inventory:adjust">
 *    <StockAdjustmentModal />
 * </RoleGuard>
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  action,
  roles,
  fallback = null,
  children,
}) => {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  // Check action-based capability
  if (action && !can(user, action)) {
    return <>{fallback}</>;
  }

  // Check role-based capability
  if (roles && roles.length > 0 && !hasRole(user, roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
