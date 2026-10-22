import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Shield, CheckCircle } from 'lucide-react';
import {
  ICreateUserFormData,
  IUpdateUserFormData,
  IUserItem,
  UserRole,
  UserStatus,
} from '../types/administration.types';

interface UserModalProps {
  isOpen: boolean;
  user: IUserItem | null;
  onClose: () => void;
  onSubmit: (data: ICreateUserFormData | IUpdateUserFormData) => Promise<void>;
}

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: 'ADMIN', label: 'Administrator', desc: 'Full uncontrolled access to all application modules and governance.' },
  { value: 'INVENTORY_MANAGER', label: 'Inventory Manager', desc: 'Catalog master, stock inbound/outbound adjustments, and valuation reports.' },
  { value: 'SALES_MANAGER', label: 'Sales Manager', desc: 'Customer management, sales orders, invoice generation, and revenue reports.' },
  { value: 'PURCHASE_MANAGER', label: 'Purchase Manager', desc: 'Supplier management, procurement orders, and receiving verification.' },
  { value: 'VIEWER', label: 'Viewer (Read-Only)', desc: 'Auditing, viewing stock, orders, and reports without mutation capability.' },
];

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  user,
  onClose,
  onSubmit,
}) => {
  const isEditing = Boolean(user);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('VIEWER');
  const [status, setStatus] = useState<UserStatus>('ACTIVE');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setEmail(user.email);
      setPassword('');
      setRole(user.role);
      setStatus(user.status);
    } else {
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('VIEWER');
      setStatus('ACTIVE');
    }
    setErrors({});
  }, [user, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.full_name = 'Full name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errs.email = 'Please provide a valid email address.';
    }

    if (!isEditing && (!password || password.length < 8)) {
      errs.password = 'Password is required and must be at least 8 characters.';
    } else if (isEditing && password && password.length < 8) {
      errs.password = 'Password must be at least 8 characters if provided.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      if (isEditing) {
        const updatePayload: IUpdateUserFormData = {
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          role,
          status,
        };
        if (password.trim()) {
          updatePayload.password = password.trim();
        }
        await onSubmit(updatePayload);
      } else {
        await onSubmit({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role,
          status,
        });
      }
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Operation failed. Please verify your inputs.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isEditing ? 'Edit User Account' : 'Register New System User'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? `Modifying profile: ${user?.id}` : 'Create credentials and assign access role'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.form && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {errors.form}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.full_name && (
              <span className="text-xs text-rose-600 mt-1 block">{errors.full_name}</span>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.doe@company.local"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.email && (
              <span className="text-xs text-rose-600 mt-1 block">{errors.email}</span>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {isEditing ? 'New Password (leave empty to keep unchanged)' : 'Initial Password *'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? '••••••••' : 'Min 8 characters'}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.password && (
              <span className="text-xs text-rose-600 mt-1 block">{errors.password}</span>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Assigned Role *
            </label>
            <div className="relative">
              <Shield className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label} ({r.value})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 italic">
              {ROLES.find((r) => r.value === role)?.desc}
            </p>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Account Status *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm font-medium transition ${
                  status === 'ACTIVE'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="user_status"
                  value="ACTIVE"
                  checked={status === 'ACTIVE'}
                  onChange={() => setStatus('ACTIVE')}
                  className="hidden"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Active</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm font-medium transition ${
                  status === 'INACTIVE'
                    ? 'border-rose-500 bg-rose-50 text-rose-800'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="user_status"
                  value="INACTIVE"
                  checked={status === 'INACTIVE'}
                  onChange={() => setStatus('INACTIVE')}
                  className="hidden"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Inactive</span>
              </label>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
