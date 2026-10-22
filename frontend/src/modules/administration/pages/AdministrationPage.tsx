import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Users,
  Sliders,
  Shield,
  LayoutDashboard,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../authentication/hooks/useAuth';
import {
  IAdminSummary,
  ICreateUserFormData,
  IRoleWithPermissions,
  ISystemSetting,
  ISystemSettingsMap,
  IUpdateUserFormData,
  IUserFilterQuery,
  IUserItem,
  UserRole,
  UserStatus,
} from '../types/administration.types';
import { administrationService } from '../services/administrationService';
import { AdminSummaryCards } from '../components/AdminSummaryCards';
import { UserTable } from '../components/UserTable';
import { UserModal } from '../components/UserModal';
import { RoleMatrixTable } from '../components/RoleMatrixTable';
import { SystemSettingsForm } from '../components/SystemSettingsForm';

type AdminTab = 'overview' | 'users' | 'roles' | 'settings';

export const AdministrationPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Summary State
  const [summary, setSummary] = useState<IAdminSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(true);

  // Users State
  const [users, setUsers] = useState<IUserItem[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isUsersLoading, setIsUsersLoading] = useState<boolean>(true);
  const [userFilters, setUserFilters] = useState<IUserFilterQuery>({
    page: 1,
    limit: 10,
    search: '',
    role: '',
    status: '',
  });

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<IUserItem | null>(null);

  // Roles State
  const [roles, setRoles] = useState<IRoleWithPermissions[]>([]);
  const [isRolesLoading, setIsRolesLoading] = useState<boolean>(true);

  // Settings State
  const [settings, setSettings] = useState<ISystemSetting[]>([]);
  const [settingsMap, setSettingsMap] = useState<ISystemSettingsMap>({});
  const [isSettingsLoading, setIsSettingsLoading] = useState<boolean>(true);

  // Data fetchers
  const fetchSummary = useCallback(async () => {
    try {
      setIsSummaryLoading(true);
      const data = await administrationService.getSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setIsSummaryLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setIsUsersLoading(true);
      const res = await administrationService.getUsers(userFilters);
      setUsers(res.users);
      setTotalUsers(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsUsersLoading(false);
    }
  }, [userFilters]);

  const fetchRoles = useCallback(async () => {
    try {
      setIsRolesLoading(true);
      const data = await administrationService.getRoles();
      setRoles(data);
    } catch (err) {
      console.error('Failed to load roles:', err);
    } finally {
      setIsRolesLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      setIsSettingsLoading(true);
      const data = await administrationService.getSettings();
      setSettings(data.settings);
      setSettingsMap(data.map);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === 'overview') fetchSummary();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'roles') fetchRoles();
    if (activeTab === 'settings') fetchSettings();
  }, [isAdmin, activeTab, fetchSummary, fetchUsers, fetchRoles, fetchSettings]);

  const handleRefresh = () => {
    if (activeTab === 'overview') fetchSummary();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'roles') fetchRoles();
    if (activeTab === 'settings') fetchSettings();
  };

  // User Actions
  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (targetUser: IUserItem) => {
    setSelectedUser(targetUser);
    setIsUserModalOpen(true);
  };

  const handleUserModalSubmit = async (data: ICreateUserFormData | IUpdateUserFormData) => {
    if (selectedUser) {
      await administrationService.updateUser(selectedUser.id, data as IUpdateUserFormData);
    } else {
      await administrationService.createUser(data as ICreateUserFormData);
    }
    fetchUsers();
    fetchSummary();
  };

  const handleToggleStatus = async (userId: string, currentStatus: UserStatus) => {
    const nextStatus: UserStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await administrationService.updateUserStatus(userId, nextStatus);
      fetchUsers();
      fetchSummary();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    try {
      await administrationService.updateUserRole(userId, newRole);
      fetchUsers();
      fetchSummary();
    } catch (err: any) {
      alert(err.message || 'Failed to change user role.');
    }
  };

  // Settings Actions
  const handleSaveSettings = async (updatedMap: Record<string, string>) => {
    const res = await administrationService.updateSettings(updatedMap);
    setSettingsMap(res);
    fetchSettings();
  };

  // Authorization Guard
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center max-w-lg mx-auto mt-12">
          <div className="p-3 bg-rose-100 rounded-full text-rose-600 inline-block mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Access Restricted
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            System Administration controls critical enterprise governance, user accounts, and system configuration. Only accounts with the <strong className="text-slate-700">ADMIN</strong> role are permitted.
          </p>
          <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
            Current Authenticated Role: <span className="font-bold text-slate-700">{user?.role || 'VIEWER'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">
              System Administration
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
              <ShieldAlert className="w-3 h-3" />
              Administrative Governance
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Centralized administrative management for user accounts, role-based access capabilities, and global application parameters.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg border border-slate-200 shadow-sm transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 shadow-sm">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm transition ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Admin Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm transition ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Accounts</span>
            {totalUsers > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
                {totalUsers}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm transition ${
              activeTab === 'roles'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Roles &amp; Permissions</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm transition ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>System Settings</span>
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <AdminSummaryCards summary={summary} isLoading={isSummaryLoading} />
      )}

      {activeTab === 'users' && (
        <UserTable
          users={users}
          total={totalUsers}
          page={userFilters.page || 1}
          totalPages={totalPages}
          isLoading={isUsersLoading}
          filters={userFilters}
          onFilterChange={(upd) => setUserFilters((prev) => ({ ...prev, ...upd }))}
          onPageChange={(p) => setUserFilters((prev) => ({ ...prev, page: p }))}
          onEditUser={handleEditUser}
          onToggleStatus={handleToggleStatus}
          onChangeRole={handleChangeRole}
          onCreateUserClick={handleCreateUser}
        />
      )}

      {activeTab === 'roles' && (
        <RoleMatrixTable roles={roles} isLoading={isRolesLoading} />
      )}

      {activeTab === 'settings' && (
        <SystemSettingsForm
          settings={settings}
          map={settingsMap}
          isLoading={isSettingsLoading}
          onSave={handleSaveSettings}
        />
      )}

      {/* User Create/Edit Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        user={selectedUser}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={handleUserModalSubmit}
      />
    </div>
  );
};
