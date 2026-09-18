import { ILoginRequest, IRegisterRequest, IUpdateProfileRequest, UserRole } from '../types/auth.types';

export const VALID_ROLES: UserRole[] = [
  'ADMIN',
  'INVENTORY_MANAGER',
  'SALES_MANAGER',
  'PURCHASE_MANAGER',
  'VIEWER',
];

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export class AuthValidator {
  /**
   * Validate user login request
   */
  static validateLogin(payload: ILoginRequest): ValidationResult {
    const errors: Record<string, string> = {};

    if (!payload.email || typeof payload.email !== 'string' || payload.email.trim() === '') {
      errors.email = 'Email is required';
    } else if (!this.isValidEmail(payload.email.trim())) {
      errors.email = 'Invalid email address format';
    }

    if (!payload.password || typeof payload.password !== 'string' || payload.password === '') {
      errors.password = 'Password is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate user registration request
   */
  static validateRegister(payload: IRegisterRequest): ValidationResult {
    const errors: Record<string, string> = {};

    // Full Name
    if (!payload.full_name || typeof payload.full_name !== 'string' || payload.full_name.trim() === '') {
      errors.full_name = 'Full name cannot be empty';
    } else if (payload.full_name.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters';
    }

    // Email
    if (!payload.email || typeof payload.email !== 'string' || payload.email.trim() === '') {
      errors.email = 'Email cannot be empty';
    } else if (!this.isValidEmail(payload.email.trim())) {
      errors.email = 'Email must have a valid format';
    }

    // Password
    if (!payload.password || typeof payload.password !== 'string' || payload.password === '') {
      errors.password = 'Password cannot be empty';
    } else if (payload.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    // Confirm Password
    if (payload.password !== payload.confirm_password) {
      errors.confirm_password = 'Password and confirm password must match';
    }

    // Role
    if (!payload.role) {
      errors.role = 'Role is required';
    } else if (!VALID_ROLES.includes(payload.role)) {
      errors.role = `Invalid role. Allowed roles: ${VALID_ROLES.join(', ')}`;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate profile update request
   */
  static validateUpdateProfile(payload: IUpdateProfileRequest): ValidationResult {
    const errors: Record<string, string> = {};

    if (payload.full_name !== undefined) {
      if (typeof payload.full_name !== 'string' || payload.full_name.trim() === '') {
        errors.full_name = 'Full name cannot be empty';
      } else if (payload.full_name.trim().length < 2) {
        errors.full_name = 'Full name must be at least 2 characters';
      }
    }

    if (payload.email !== undefined) {
      if (typeof payload.email !== 'string' || payload.email.trim() === '') {
        errors.email = 'Email cannot be empty';
      } else if (!this.isValidEmail(payload.email.trim())) {
        errors.email = 'Email must have a valid format';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  private static isValidEmail(email: string): boolean {
    // Standard RFC-compliant email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
