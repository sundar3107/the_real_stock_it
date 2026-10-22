import { UserRole } from '../../authentication/types/auth.types';
import { ICreateUserDto, IUpdateUserDto } from '../types/administration.types';

const VALID_ROLES: UserRole[] = [
  'ADMIN',
  'INVENTORY_MANAGER',
  'SALES_MANAGER',
  'PURCHASE_MANAGER',
  'VIEWER',
];

export class AdministrationValidator {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  static validateCreateUser(dto: ICreateUserDto): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    if (!dto.full_name || !dto.full_name.trim()) {
      errors.full_name = 'Full name is required.';
    } else if (dto.full_name.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters.';
    }

    if (!dto.email || !dto.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!this.validateEmail(dto.email)) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!dto.password) {
      errors.password = 'Password is required.';
    } else if (dto.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    if (!dto.role) {
      errors.role = 'User role is required.';
    } else if (!VALID_ROLES.includes(dto.role)) {
      errors.role = `Invalid role. Allowed roles are: ${VALID_ROLES.join(', ')}`;
    }

    if (dto.status && !['ACTIVE', 'INACTIVE'].includes(dto.status)) {
      errors.status = "Status must be 'ACTIVE' or 'INACTIVE'.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  static validateUpdateUser(dto: IUpdateUserDto): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    if (dto.full_name !== undefined) {
      if (!dto.full_name.trim()) {
        errors.full_name = 'Full name cannot be blank.';
      } else if (dto.full_name.trim().length < 2) {
        errors.full_name = 'Full name must be at least 2 characters.';
      }
    }

    if (dto.email !== undefined) {
      if (!dto.email.trim()) {
        errors.email = 'Email cannot be blank.';
      } else if (!this.validateEmail(dto.email)) {
        errors.email = 'Please provide a valid email address.';
      }
    }

    if (dto.password !== undefined && dto.password !== '') {
      if (dto.password.length < 8) {
        errors.password = 'New password must be at least 8 characters long.';
      }
    }

    if (dto.role !== undefined) {
      if (!VALID_ROLES.includes(dto.role)) {
        errors.role = `Invalid role. Allowed roles are: ${VALID_ROLES.join(', ')}`;
      }
    }

    if (dto.status !== undefined && !['ACTIVE', 'INACTIVE'].includes(dto.status)) {
      errors.status = "Status must be 'ACTIVE' or 'INACTIVE'.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  static validateSettings(settings: Record<string, any>): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      errors.settings = 'Settings payload must be a key-value object.';
      return { isValid: false, errors };
    }

    const forbiddenKeys = ['password', 'secret', 'token', 'database_url', 'jwt_secret'];
    for (const key of Object.keys(settings)) {
      if (forbiddenKeys.includes(key.toLowerCase())) {
        errors[key] = `Setting key '${key}' contains sensitive security terms and cannot be configured.`;
      }
    }

    if (settings.default_tax_rate !== undefined) {
      const taxNum = Number(settings.default_tax_rate);
      if (isNaN(taxNum) || taxNum < 0 || taxNum > 100) {
        errors.default_tax_rate = 'Default tax rate must be a percentage between 0 and 100.';
      }
    }

    if (settings.low_stock_threshold_default !== undefined) {
      const threshNum = Number(settings.low_stock_threshold_default);
      if (isNaN(threshNum) || threshNum < 0) {
        errors.low_stock_threshold_default = 'Low stock threshold must be a non-negative number.';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}
