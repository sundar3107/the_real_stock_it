import crypto from 'crypto';
import { db } from '../../../database/connection';
import { UserModel } from '../../authentication/models/User';
import { RoleModel } from '../../authentication/models/Role';
import { RoleService } from '../../authentication/services/RoleService';
import { hashPassword } from '../../../utils/passwordUtils';
import { AuditService } from '../../audit/services/AuditService';
import { SystemSettingModel } from '../models/SystemSetting';
import { AdministrationValidator } from '../validators/administrationValidators';
import {
  IAdminSummary,
  ICreateUserDto,
  IRoleWithPermissions,
  ISystemSetting,
  ISystemSettingsMap,
  IUpdateUserDto,
  IUserFilterQuery,
  IUserListResponse,
} from '../types/administration.types';
import { IUserResponse, UserRole, UserStatus } from '../../authentication/types/auth.types';

export class AdminError extends Error {
  statusCode: number;
  errors?: Record<string, string>;

  constructor(message: string, statusCode: number = 400, errors?: Record<string, string>) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, AdminError.prototype);
  }
}

export class AdministrationService {
  /**
   * Retrieve filtered, searched, and paginated user list
   */
  static getUsers(query: IUserFilterQuery = {}): IUserListResponse {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));

    const { users, total } = UserModel.findFiltered({
      ...query,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      users,
      total,
      page,
      limit,
      total_pages: totalPages,
    };
  }

  /**
   * Retrieve single user details by ID
   */
  static getUserById(id: string): IUserResponse {
    const user = UserModel.findById(id);
    if (!user) {
      throw new AdminError(`User with ID '${id}' not found.`, 404);
    }

    const role = RoleModel.findById(user.role_id);
    const roleName: UserRole = (role ? role.name : 'VIEWER') as UserRole;

    return UserModel.toResponse(user, roleName);
  }

  /**
   * Administrative User Creation
   */
  static async createUser(dto: ICreateUserDto, adminUserId?: string): Promise<IUserResponse> {
    const validation = AdministrationValidator.validateCreateUser(dto);
    if (!validation.isValid) {
      throw new AdminError('User creation validation failed.', 400, validation.errors);
    }

    const cleanEmail = dto.email.trim().toLowerCase();
    const existing = UserModel.findByEmail(cleanEmail);
    if (existing) {
      throw new AdminError(`A user with email '${cleanEmail}' already exists.`, 409, {
        email: 'Email address is already registered to another account.',
      });
    }

    const role = RoleModel.findByName(dto.role);
    if (!role) {
      throw new AdminError(`Role '${dto.role}' is invalid or does not exist.`, 400, {
        role: 'Invalid role specified.',
      });
    }

    const passwordHash = await hashPassword(dto.password);
    const userId = `usr_${crypto.randomBytes(6).toString('hex')}`;
    const status: UserStatus = dto.status || 'ACTIVE';

    const created = UserModel.create({
      id: userId,
      full_name: dto.full_name.trim(),
      email: cleanEmail,
      password_hash: passwordHash,
      role_id: role.id,
      status,
    });

    // Record Immutable Audit Log
    AuditService.recordActivity({
      user_id: adminUserId,
      action: 'USER_CREATE',
      module: 'ADMIN',
      entity_type: 'USER',
      entity_id: created.id,
      description: `Administrator created user "${created.full_name}" (${created.email}) with role ${dto.role}`,
      new_value: {
        id: created.id,
        full_name: created.full_name,
        email: created.email,
        role: dto.role,
        status,
      },
    });

    return UserModel.toResponse(created, dto.role);
  }

  /**
   * Administrative User Modification
   */
  static async updateUser(
    id: string,
    dto: IUpdateUserDto,
    adminUserId?: string
  ): Promise<IUserResponse> {
    const existing = UserModel.findById(id);
    if (!existing) {
      throw new AdminError(`User with ID '${id}' not found.`, 404);
    }

    const validation = AdministrationValidator.validateUpdateUser(dto);
    if (!validation.isValid) {
      throw new AdminError('User update validation failed.', 400, validation.errors);
    }

    let cleanEmail: string | undefined = undefined;
    if (dto.email && dto.email.trim().toLowerCase() !== existing.email.toLowerCase()) {
      cleanEmail = dto.email.trim().toLowerCase();
      const duplicate = UserModel.findByEmail(cleanEmail);
      if (duplicate && duplicate.id !== id) {
        throw new AdminError(`Email '${cleanEmail}' is already registered to another user.`, 409, {
          email: 'Email address is in use by another account.',
        });
      }
    }

    let roleId: string | undefined = undefined;
    let targetRole: UserRole | undefined = undefined;
    if (dto.role) {
      const currentRole = RoleModel.findById(existing.role_id);
      if (currentRole?.name === 'ADMIN' && dto.role !== 'ADMIN') {
        const activeAdmins = UserModel.countActiveAdmins();
        if (activeAdmins <= 1 && existing.status === 'ACTIVE') {
          throw new AdminError(
            'Cannot change role of the last active administrator. At least one active ADMIN is required.',
            400
          );
        }
      }

      const role = RoleModel.findByName(dto.role);
      if (!role) {
        throw new AdminError(`Role '${dto.role}' is invalid.`, 400);
      }
      roleId = role.id;
      targetRole = dto.role;
    }

    let passwordHash: string | undefined = undefined;
    if (dto.password && dto.password.trim()) {
      passwordHash = await hashPassword(dto.password.trim());
    }

    if (dto.status === 'INACTIVE' && existing.status === 'ACTIVE') {
      const currentRole = RoleModel.findById(existing.role_id);
      if (currentRole?.name === 'ADMIN') {
        const activeAdmins = UserModel.countActiveAdmins();
        if (activeAdmins <= 1) {
          throw new AdminError(
            'Cannot deactivate the last active administrator account.',
            400
          );
        }
      }
    }

    const updated = UserModel.adminUpdate(id, {
      full_name: dto.full_name,
      email: cleanEmail,
      password_hash: passwordHash,
      role_id: roleId,
      status: dto.status,
    });

    if (!updated) {
      throw new AdminError('Failed to update user.', 500);
    }

    const finalRole = targetRole || (RoleModel.findById(updated.role_id)?.name as UserRole) || 'VIEWER';

    // Record Immutable Audit Log
    AuditService.recordActivity({
      user_id: adminUserId,
      action: 'USER_UPDATE',
      module: 'ADMIN',
      entity_type: 'USER',
      entity_id: updated.id,
      description: `Administrator updated user profile for "${updated.full_name}" (${updated.email})`,
      old_value: {
        full_name: existing.full_name,
        email: existing.email,
        status: existing.status,
      },
      new_value: {
        full_name: updated.full_name,
        email: updated.email,
        status: updated.status,
        role: finalRole,
      },
    });

    return UserModel.toResponse(updated, finalRole);
  }

  /**
   * Administrative User Status Toggle / Update
   */
  static updateUserStatus(
    id: string,
    status: UserStatus,
    adminUserId?: string
  ): IUserResponse {
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      throw new AdminError("Status must be 'ACTIVE' or 'INACTIVE'.", 400);
    }

    const existing = UserModel.findById(id);
    if (!existing) {
      throw new AdminError(`User with ID '${id}' not found.`, 404);
    }

    if (adminUserId && id === adminUserId && status === 'INACTIVE') {
      throw new AdminError('You cannot deactivate your own administrative account.', 400);
    }

    const currentRole = RoleModel.findById(existing.role_id);
    if (currentRole?.name === 'ADMIN' && status === 'INACTIVE' && existing.status === 'ACTIVE') {
      const activeAdmins = UserModel.countActiveAdmins();
      if (activeAdmins <= 1) {
        throw new AdminError(
          'Cannot deactivate the last active administrator in the system.',
          400
        );
      }
    }

    const updated = UserModel.updateStatus(id, status);
    if (!updated) {
      throw new AdminError('Failed to update user status.', 500);
    }

    const roleName = (currentRole ? currentRole.name : 'VIEWER') as UserRole;

    // Record Immutable Audit Log
    AuditService.recordActivity({
      user_id: adminUserId,
      action: 'USER_STATUS_CHANGE',
      module: 'ADMIN',
      entity_type: 'USER',
      entity_id: updated.id,
      description: `User status changed for "${updated.full_name}": ${existing.status} -> ${status}`,
      old_value: { status: existing.status },
      new_value: { status: updated.status },
    });

    return UserModel.toResponse(updated, roleName);
  }

  /**
   * Administrative User Role Change
   */
  static updateUserRole(
    id: string,
    newRole: UserRole,
    adminUserId?: string
  ): IUserResponse {
    const existing = UserModel.findById(id);
    if (!existing) {
      throw new AdminError(`User with ID '${id}' not found.`, 404);
    }

    const role = RoleModel.findByName(newRole);
    if (!role) {
      throw new AdminError(`Role '${newRole}' is invalid.`, 400);
    }

    const currentRole = RoleModel.findById(existing.role_id);
    const oldRoleName = (currentRole ? currentRole.name : 'VIEWER') as UserRole;

    if (oldRoleName === 'ADMIN' && newRole !== 'ADMIN') {
      const activeAdmins = UserModel.countActiveAdmins();
      if (activeAdmins <= 1 && existing.status === 'ACTIVE') {
        throw new AdminError(
          'Cannot demote the last active administrator. System must have at least one active ADMIN.',
          400
        );
      }
    }

    const updated = UserModel.updateRole(id, role.id);
    if (!updated) {
      throw new AdminError('Failed to change user role.', 500);
    }

    // Record Immutable Audit Log
    AuditService.recordActivity({
      user_id: adminUserId,
      action: 'USER_ROLE_CHANGE',
      module: 'ADMIN',
      entity_type: 'USER',
      entity_id: updated.id,
      description: `Role changed for "${updated.full_name}": ${oldRoleName} -> ${newRole}`,
      old_value: { role: oldRoleName },
      new_value: { role: newRole },
    });

    return UserModel.toResponse(updated, newRole);
  }

  /**
   * Retrieve defined roles with full permission mappings
   */
  static getRolesWithPermissions(): IRoleWithPermissions[] {
    const roles = RoleModel.findAll();
    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      created_at: r.created_at,
      permissions: RoleService.getPermissions(r.name),
    }));
  }

  /**
   * Retrieve all system configuration settings
   */
  static getSettings(): { settings: ISystemSetting[]; map: ISystemSettingsMap } {
    const settings = SystemSettingModel.findAll();
    const map = SystemSettingModel.findMap();
    return { settings, map };
  }

  /**
   * Batch update system configuration settings
   */
  static updateSettings(
    settingsMap: Record<string, string>,
    adminUserId?: string
  ): ISystemSettingsMap {
    const validation = AdministrationValidator.validateSettings(settingsMap);
    if (!validation.isValid) {
      throw new AdminError('System settings validation failed.', 400, validation.errors);
    }

    const previousMap = SystemSettingModel.findMap();
    const updatedMap = SystemSettingModel.updateBatch(settingsMap, adminUserId);

    // Record Immutable Audit Log
    AuditService.recordActivity({
      user_id: adminUserId,
      action: 'SETTING_UPDATE',
      module: 'SYSTEM',
      entity_type: 'SETTING',
      entity_id: 'system_settings',
      description: `Administrator updated system configuration (${Object.keys(settingsMap).join(', ')})`,
      old_value: previousMap,
      new_value: updatedMap,
    });

    return updatedMap;
  }

  /**
   * Executive / Administrative Telemetry Summary
   */
  static getAdminSummary(): IAdminSummary {
    // Users Aggregation
    const userStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN u.status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN u.status = 'INACTIVE' THEN 1 ELSE 0 END) as inactive
      FROM users u
    `).get() as any;

    const roleStats = db.prepare(`
      SELECT r.name, COUNT(u.id) as count
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id
      GROUP BY r.name
    `).all() as any[];

    const byRole: Record<string, number> = {};
    for (const r of roleStats) {
      byRole[r.name] = Number(r.count) || 0;
    }

    // Catalog Aggregation
    const productCount = (db.prepare('SELECT COUNT(*) as c FROM products').get() as any)?.c || 0;
    const categoryCount = (db.prepare('SELECT COUNT(*) as c FROM categories').get() as any)?.c || 0;
    const supplierCount = (db.prepare('SELECT COUNT(*) as c FROM suppliers').get() as any)?.c || 0;
    const customerCount = (db.prepare('SELECT COUNT(*) as c FROM customers').get() as any)?.c || 0;

    // Transactions Aggregation
    const poCount = (db.prepare('SELECT COUNT(*) as c FROM purchase_orders').get() as any)?.c || 0;
    const soCount = (db.prepare('SELECT COUNT(*) as c FROM sales_orders').get() as any)?.c || 0;
    const invCount = (db.prepare('SELECT COUNT(*) as c FROM invoices').get() as any)?.c || 0;

    // System Telemetry
    const auditLogsCount = (db.prepare('SELECT COUNT(*) as c FROM activity_logs').get() as any)?.c || 0;
    const unreadNotifsCount = (db.prepare('SELECT COUNT(*) as c FROM notifications WHERE is_read = 0').get() as any)?.c || 0;
    const settingsCount = (db.prepare('SELECT COUNT(*) as c FROM system_settings').get() as any)?.c || 0;

    return {
      users: {
        total: Number(userStats?.total) || 0,
        active: Number(userStats?.active) || 0,
        inactive: Number(userStats?.inactive) || 0,
        by_role: byRole,
      },
      catalog: {
        total_products: Number(productCount),
        total_categories: Number(categoryCount),
        total_suppliers: Number(supplierCount),
        total_customers: Number(customerCount),
      },
      transactions: {
        total_purchase_orders: Number(poCount),
        total_sales_orders: Number(soCount),
        total_invoices: Number(invCount),
      },
      system: {
        status: 'HEALTHY',
        version: '2.3.0',
        uptime_seconds: Math.floor(process.uptime()),
        node_version: process.version,
        database_driver: 'Node.js SQLite (node:sqlite Native)',
        active_settings_count: Number(settingsCount),
        total_audit_logs: Number(auditLogsCount),
        unread_notifications: Number(unreadNotifsCount),
      },
    };
  }
}
