import React from 'react';
import {
  Edit2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  UserPlus,
  Shield,
} from 'lucide-react';
import {
  IUserFilterQuery,
  IUserItem,
  UserRole,
  UserStatus,
} from '../types/administration.types';

interface UserTableProps {
  users: IUserItem[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  filters: IUserFilterQuery;
  onFilterChange: (updates: Partial<IUserFilterQuery>) => void;
  onPageChange: (newPage: number) => void;
  onEditUser: (user: IUserItem) => void;
  onToggleStatus: (userId: string, currentStatus: UserStatus) => void;
  onChangeRole: (userId: string, newRole: UserRole) => void;
  onCreateUserClick: () => void;
}

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  INVENTORY_MANAGER: 'bg-teal-100 text-teal-800 border-teal-200',
  SALES_MANAGER: 'bg-blue-100 text-blue-800 border-blue-200',
  PURCHASE_MANAGER: 'bg-amber-100 text-amber-800 border-amber-200',
  VIEWER: 'bg-slate-100 text-slate-700 border-slate-200',
};

const ALL_ROLES: UserRole[] = [
  'ADMIN',
  'INVENTORY_MANAGER',
  'SALES_MANAGER',
  'PURCHASE_MANAGER',
  'VIEWER',
];

export const UserTable: React.FC<UserTableProps> = ({
  users,
  total,
  page,
  totalPages,
  isLoading,
  filters,
  onFilterChange,
  onPageChange,
  onEditUser,
  onToggleStatus,
  onChangeRole,
  onCreateUserClick,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden space-y-4">
      {/* Top Filter & Action Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, ID..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filters.role || ''}
            onChange={(e) => onFilterChange({ role: e.target.value, page: 1 })}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ status: e.target.value, page: 1 })}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <button
          onClick={onCreateUserClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-sm text-slate-500">Loading user accounts...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="p-12 text-center">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h4 className="text-base font-semibold text-slate-700">No Users Found</h4>
          <p className="text-sm text-slate-500 mt-1">
            No accounts matched your query. Adjust search terms or role filter.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  {/* User details */}
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800 block text-sm">
                      {u.full_name}
                    </span>
                    <span className="text-xs text-slate-500 font-mono block">
                      {u.email}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      ID: {u.id}
                    </span>
                  </td>

                  {/* Role */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <select
                      value={u.role}
                      onChange={(e) => onChangeRole(u.id, e.target.value as UserRole)}
                      className={`text-xs font-semibold px-2 py-1 rounded-md border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        ROLE_COLORS[u.role]
                      }`}
                    >
                      {ALL_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      ></span>
                      {u.status}
                    </span>
                  </td>

                  {/* Created Date */}
                  <td className="py-3 px-4 text-xs font-mono text-slate-600 whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onEditUser(u)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit User Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onToggleStatus(u.id, u.status)}
                        className={`p-1.5 rounded-lg transition ${
                          u.status === 'ACTIVE'
                            ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={u.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
                      >
                        {u.status === 'ACTIVE' ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing Page <strong className="text-slate-700">{page}</strong> of{' '}
            <strong className="text-slate-700">{totalPages}</strong> ({total} total users)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
