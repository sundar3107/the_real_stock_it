import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Package,
  Layers,
  Truck,
  Building,
  ShoppingBag,
  TrendingUp,
  Receipt,
  Server,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Database,
  Bell,
} from 'lucide-react';
import { IAdminSummary } from '../types/administration.types';

interface AdminSummaryCardsProps {
  summary: IAdminSummary | null;
  isLoading: boolean;
}

export const AdminSummaryCards: React.FC<AdminSummaryCardsProps> = ({ summary, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 h-32"></div>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      {/* Top 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* User Accounts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Users
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{summary.users.total}</span>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <UserCheck className="w-3.5 h-3.5" />
                {summary.users.active} Active
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <UserX className="w-3.5 h-3.5" />
                {summary.users.inactive} Inactive
              </span>
            </div>
          </div>
        </div>

        {/* Catalog Entities */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Product Catalog
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{summary.catalog.total_products}</span>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                {summary.catalog.total_categories} Categories
              </span>
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-slate-400" />
                {summary.catalog.total_suppliers} Suppliers
              </span>
            </div>
          </div>
        </div>

        {/* Commercial Operations */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Transactions
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              {summary.transactions.total_purchase_orders +
                summary.transactions.total_sales_orders +
                summary.transactions.total_invoices}
            </span>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <span>{summary.transactions.total_sales_orders} Sales</span>
              <span>&bull;</span>
              <span>{summary.transactions.total_purchase_orders} Purchases</span>
              <span>&bull;</span>
              <span>{summary.transactions.total_invoices} Invoices</span>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              System Health
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-lg font-bold text-emerald-700">{summary.system.status}</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Uptime: {formatUptime(summary.system.uptime_seconds)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Technical & Governance Telemetry Box */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Server className="w-4 h-4 text-blue-600" />
          <span>System Environment &amp; Governance Telemetry</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block font-medium">Application Version</span>
            <span className="font-bold text-slate-800 text-sm font-mono mt-0.5 block">
              v{summary.system.version}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block font-medium">Node.js Runtime</span>
            <span className="font-bold text-slate-800 text-sm font-mono mt-0.5 block">
              {summary.system.node_version}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block font-medium">Database Storage</span>
            <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate" title={summary.system.database_driver}>
              {summary.system.database_driver}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block font-medium">Audit Trail Ledger</span>
            <span className="font-bold text-slate-800 text-sm font-mono mt-0.5 block flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {summary.system.total_audit_logs} Records
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block font-medium">Active Settings</span>
            <span className="font-bold text-slate-800 text-sm font-mono mt-0.5 block">
              {summary.system.active_settings_count} Keys
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block font-medium">Alert Notifications</span>
            <span className="font-bold text-slate-800 text-sm font-mono mt-0.5 block flex items-center gap-1">
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              {summary.system.unread_notifications} Unread
            </span>
          </div>
        </div>

        {/* Roles Distribution Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 block mb-2">
            User Distribution by Role:
          </span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.users.by_role).map(([role, count]) => (
              <span
                key={role}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
              >
                <span className="font-semibold text-slate-900">{role}:</span>
                <span className="px-1.5 py-0.2 bg-white rounded font-mono font-bold text-blue-600 border border-slate-200">
                  {count}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
