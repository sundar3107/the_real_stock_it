import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { RoleGuard } from '../components/RoleGuard';
import { ShieldCheck, User, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const WelcomeDashboardPage: React.FC = () => {
  const { user, permissions } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 rounded-2xl p-8 text-white shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-sm mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Authenticated Session Active</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome to Stock Management System
          </h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Hello, <span className="font-semibold text-white">{user?.full_name}</span>. You are
            currently logged in with role{' '}
            <span className="font-semibold text-blue-300">{user?.role.replace('_', ' ')}</span>.
            The User Authentication & Management module is active and guarding application routes.
          </p>
        </div>
      </div>

      {/* Module 1 Baseline Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Authentication State</h2>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified
            </span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">User ID</span>
              <span className="font-mono text-xs text-slate-800">{user?.id}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Email</span>
              <span className="font-medium text-slate-800">{user?.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Role</span>
              <span className="font-semibold text-blue-600">{user?.role}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Account Status</span>
              <span className="font-semibold text-emerald-600">{user?.status}</span>
            </div>
          </div>
          <div className="mt-5">
            <Link
              to="/profile"
              className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 gap-1"
            >
              View and edit profile <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Reusable Role & Permissions Verification */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Authorization & Permissions</h2>
            <span className="text-xs font-medium text-slate-500">Centralized Matrix</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Permissions granted to your role for upcoming inventory, purchases, and sales modules:
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
            {permissions.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No explicit permissions assigned</span>
            ) : (
              permissions.map((perm) => (
                <span
                  key={perm}
                  className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                >
                  {perm}
                </span>
              ))
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <RoleGuard
              action="*"
              fallback={
                <p className="text-xs text-slate-400 italic">
                  Standard user view: Administrative controls are restricted to administrators.
                </p>
              }
            >
              <div className="text-xs bg-purple-50 text-purple-800 p-2.5 rounded-lg border border-purple-200 font-medium">
                Admin Privilege: You have full administrative authority across all modules.
              </div>
            </RoleGuard>
          </div>
        </div>
      </div>
    </div>
  );
};
