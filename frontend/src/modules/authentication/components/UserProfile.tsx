import React, { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { ErrorMessage } from '../../../components/common/ErrorMessage';
import { Shield, User, Mail, Activity, CheckCircle2, Edit2 } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user, updateProfile, isLoading, error, clearError } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!user) return null;

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage(null);

    try {
      await updateProfile({
        full_name: fullName.trim(),
        email: email.trim(),
      });
      setSuccessMessage('Profile updated successfully.');
      setIsEditing(false);
    } catch {
      // Error handled via AuthContext
    }
  };

  const handleCancel = () => {
    setFullName(user.full_name);
    setEmail(user.email);
    setIsEditing(false);
    clearError();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'INVENTORY_MANAGER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SALES_MANAGER':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PURCHASE_MANAGER':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 text-white flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">User Profile</h2>
          <p className="text-xs text-slate-400 mt-0.5">Account configuration and security details</p>
        </div>
        {!isEditing && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setFullName(user.full_name);
              setEmail(user.email);
              setIsEditing(true);
            }}
            className="bg-white/10 hover:bg-white/20 text-white border-transparent"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="p-6">
        <ErrorMessage message={error} onDismiss={clearError} className="mb-4" />

        {successMessage && (
          <div className="flex items-center gap-2 p-3.5 mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading}>
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-500">Full Name</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{user.full_name}</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-500">Email Address</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{user.email}</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-500">Assigned Role</span>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getRoleBadgeColor(
                  user.role
                )}`}
              >
                {user.role.replace('_', ' ')}
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-500">Account Status</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {user.status}
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">Account Created</span>
              <span className="text-xs text-slate-500">
                {new Date(user.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
