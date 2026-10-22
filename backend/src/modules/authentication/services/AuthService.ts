import crypto from 'crypto';
import { UserModel } from '../models/User';
import { RoleModel } from '../models/Role';
import { AuthValidator } from '../validators/authValidators';
import { hashPassword, comparePassword } from '../../../utils/passwordUtils';
import { generateToken } from '../../../utils/tokenUtils';
import { AuditService } from '../../audit/services/AuditService';
import {
  IAuthResponse,
  ILoginRequest,
  IRegisterRequest,
  IUpdateProfileRequest,
  IUserResponse,
  UserRole,
} from '../types/auth.types';

export class AppError extends Error {
  statusCode: number;
  errors?: Record<string, string>;

  constructor(message: string, statusCode: number = 400, errors?: Record<string, string>) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class AuthService {
  /**
   * Authenticate an existing user with email and password
   */
  static async login(credentials: ILoginRequest): Promise<IAuthResponse> {
    const validation = AuthValidator.validateLogin(credentials);
    if (!validation.isValid) {
      throw new AppError('Validation failed', 400, validation.errors);
    }

    const email = credentials.email!.trim().toLowerCase();
    const user = UserModel.findByEmail(email);
    if (!user) {
      // Return generic error message to prevent user enumeration
      throw new AppError('Invalid email or password', 401);
    }

    // Verify user account status
    if (user.status !== 'ACTIVE') {
      throw new AppError(`Account is ${user.status.toLowerCase()}. Please contact an administrator.`, 403);
    }

    // Compare provided password with securely stored hash
    const isPasswordValid = await comparePassword(credentials.password!, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Retrieve role information
    const role = RoleModel.findById(user.role_id);
    const roleName: UserRole = (role ? role.name : 'VIEWER') as UserRole;

    AuditService.recordActivity({
      user_id: user.id,
      action: 'LOGIN',
      module: 'AUTH',
      entity_type: 'USER',
      entity_id: user.id,
      description: `User ${user.email} successfully logged in`,
      metadata: { email: user.email, role: roleName },
    });

    // Issue JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: roleName,
    });

    return {
      token,
      user: UserModel.toResponse(user, roleName),
    };
  }

  /**
   * Register a new user
   */
  static async register(payload: IRegisterRequest): Promise<IAuthResponse> {
    const validation = AuthValidator.validateRegister(payload);
    if (!validation.isValid) {
      throw new AppError('Validation failed', 400, validation.errors);
    }

    const email = payload.email!.trim().toLowerCase();

    // Check for duplicate email
    const existingUser = UserModel.findByEmail(email);
    if (existingUser) {
      throw new AppError('An account with this email address already exists', 409, {
        email: 'Email is already registered',
      });
    }

    // Verify role existence
    const role = RoleModel.findByName(payload.role!);
    if (!role) {
      throw new AppError(`Selected role '${payload.role}' does not exist`, 400, {
        role: 'Invalid role selected',
      });
    }

    // Securely hash the password
    const password_hash = await hashPassword(payload.password!);

    // Generate unique user identifier
    const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;

    // Create user record in database
    const newUser = UserModel.create({
      id: userId,
      full_name: payload.full_name!.trim(),
      email,
      password_hash,
      role_id: role.id,
      status: 'ACTIVE',
    });

    // Record audit log for registration
    AuditService.recordActivity({
      user_id: newUser.id,
      action: 'REGISTER',
      module: 'AUTH',
      entity_type: 'USER',
      entity_id: newUser.id,
      description: `New user registered: ${newUser.email}`,
      new_value: { email: newUser.email, full_name: newUser.full_name, role: role.name },
    });

    // Issue initial JWT token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: role.name,
    });

    return {
      token,
      user: UserModel.toResponse(newUser, role.name),
    };
  }

  /**
   * Retrieve profile for the currently authenticated user
   */
  static async getCurrentUser(userId: string): Promise<IUserResponse> {
    const user = UserModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const role = RoleModel.findById(user.role_id);
    const roleName = (role ? role.name : 'VIEWER') as UserRole;

    return UserModel.toResponse(user, roleName);
  }

  /**
   * Update authenticated user's profile
   */
  static async updateProfile(userId: string, updates: IUpdateProfileRequest): Promise<IUserResponse> {
    const validation = AuthValidator.validateUpdateProfile(updates);
    if (!validation.isValid) {
      throw new AppError('Validation failed', 400, validation.errors);
    }

    const user = UserModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // If changing email, check for duplicate
    if (updates.email && updates.email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const existing = UserModel.findByEmail(updates.email.trim().toLowerCase());
      if (existing && existing.id !== userId) {
        throw new AppError('Email is already taken by another account', 409, {
          email: 'Email address already in use',
        });
      }
    }

    const updatedUser = UserModel.update(userId, updates);
    if (!updatedUser) {
      throw new AppError('Failed to update profile', 500);
    }

    const role = RoleModel.findById(updatedUser.role_id);
    const roleName = (role ? role.name : 'VIEWER') as UserRole;

    return UserModel.toResponse(updatedUser, roleName);
  }
}
