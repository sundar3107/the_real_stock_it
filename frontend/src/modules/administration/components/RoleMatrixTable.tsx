import React from 'react';
import { Shield, Check, Minus } from 'lucide-react';
import { IRoleWithPermissions, UserRole } from '../types/administration.types';

interface RoleMatrixTableProps {
  roles: IRoleWithPermissions[];
  isLoading: boolean;
}

const MODULE_CAPABILITIES: {
  module: string;
  permissions: Record<UserRole, 'FULL' | 'MANAGE' | 'READ' | 'NONE'>;
}[] = [
  {
    module: 'Authentication & Profile',
    permissions: {
      ADMIN: 'FULL',
      INVENTORY_MANAGER: 'FULL',
      SALES_MANAGER: 'FULL',
      PURCHASE_MANAGER: 'FULL',
      VIEWER: 'READ',
    },
  },
  {
    module: 'Product Catalog Management',
    permissions: {
      ADMIN: 'FULL',
      INVENTORY_MANAGER: 'FULL',
      SALES_MANAGER: 'READ',
      PURCHASE_MANAGER: 'READ',
      VIEWER: 'READ',
    },
  },
  {
    module: 'Inventory Movements & Adjustments',
    permissions: {
      ADMIN: 'FULL',
      INVENTORY_MANAGER: 'FULL',
      SALES_MANAGER: 'READ',
      PURCHASE_MANAGER: 'READ',
      VIEWER: 'READ',
    },
  },
  {
    module: 'Supplier Directory & Management',
    permissions: {
      ADMIN: 'FULL',
      INVENTORY_MANAGER: 'READ',
      SALES_MANAGER: 'READ',
      PURCHASE_MANAGER: 'FULL',
      VIEWER: 'READ',
    },
  },
  {
    module: 'Customer Directory & Accounts',
    permissions: {
      ADMIN: 'FULL',
      INVENTORY_MANAGER: 'READ',
      SALES_MANAGER: 'FULL',
      PURCHASE_MANAGER: 'READ',
      VIEWER: 'READ',
    },
  },
  {
    module: 'Purchase Orders & Inbound Receiving',
    permissions: {
      ADMIN: 'FULL',
      INVENTORY_MANAGER: 'READ',
      SALES_MANAGER: 'READ',
      PURCHASE_MANAGER: 'FULL',
      VIEWER: 'READ',
    },
  },
  {
    module: 'Sales Orders & Stock Deduction',
    permissions: {
      ADMIN: 'FULL',
      INVENTORY_MANAGER: 'READ',
      SALES_MANAGER: 'FULL',
      PURCHASE_MANAGER: 'READ',
      VIEWER: 'READ',
    },
  },
  {
    module: 'Invoices & Financial Status',
    permissions: {
      ADMIN: 'FULL',
      INVENTORY_MANAGER: 'READ',
      SALES_MANAGER: 'FULL',
      PURCHASE_MANAGER: 'READ',
      VIEWER: 'READ',
    },
  },
  {
    module: 'Executive Dashboard & Telemetry',
    permissions: {
      ADMIN: 'FULL',
      INVENTORY_MANAGER: 'FULL',
      SALES_MANAGER: 'FULL',
      PURCHASE_MANAGER: 'FULL',
      VIEWER: 'READ',
    },
  },
  {
    module: 'Reports & Analytics Engine',
    permissions: {
      ADMIN: 'FULL',
      INVENTORY_MANAGER: 'READ',
      SALES_MANAGER: 'READ',
      PURCHASE_MANAGER: 'READ',
      VIEWER: 'READ',
    },
  },
  {
    module: 'Notifications & Alert Center',
    permissions: {
      ADMIN: 'FULL',
      INVENTORY_MANAGER: 'FULL',
      SALES_MANAGER: 'FULL',
      PURCHASE_MANAGER: 'FULL',
      VIEWER: 'READ',
    },
  },
  {
    module: 'Activity & Audit Log Ledger',
    permissions: {
      ADMIN: 'FULL',
      INVENTORY_MANAGER: 'NONE',
      SALES_MANAGER: 'NONE',
      PURCHASE_MANAGER: 'NONE',
      VIEWER: 'NONE',
    },
  },
  {
    module: 'System Administration & Governance',
    permissions: {
      ADMIN: 'FULL',
      INVENTORY_MANAGER: 'NONE',
      SALES_MANAGER: 'NONE',
      PURCHASE_MANAGER: 'NONE',
      VIEWER: 'NONE',
    },
  },
];

export const RoleMatrixTable: React.FC<RoleMatrixTableProps> = ({ roles, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center animate-pulse">
        <p className="text-sm text-slate-500">Loading role permissions matrix...</p>
      </div>
    );
  }

  const renderBadge = (cap: 'FULL' | 'MANAGE' | 'READ' | 'NONE') => {
    switch (cap) {
      case 'FULL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
            <Check className="w-3 h-3 text-emerald-600" /> Full Access
          </span>
        );
      case 'MANAGE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
            <Check className="w-3 h-3 text-blue-600" /> Manage
          </span>
        );
      case 'READ':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
            Read Only
          </span>
        );
      case 'NONE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-slate-400">
            <Minus className="w-3 h-3" /> No Access
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Defined Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-base">{role.name}</span>
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs text-slate-500 min-h-[36px]">{role.description}</p>
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block mb-1.5">
                Configured Permissions ({role.permissions.length})
              </span>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                {role.permissions.map((p) => (
                  <span
                    key={p}
                    className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-[10px]"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cross-Module Permission Matrix Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">
            Cross-Module Role Capability Matrix
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of enforcement rules evaluated by <code className="font-mono text-blue-600">RoleService.can(role, action)</code> across backend modules.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <th className="py-3 px-4">Application Module</th>
                <th className="py-3 px-3">ADMIN</th>
                <th className="py-3 px-3">INVENTORY_MGR</th>
                <th className="py-3 px-3">SALES_MGR</th>
                <th className="py-3 px-3">PURCHASE_MGR</th>
                <th className="py-3 px-3">VIEWER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MODULE_CAPABILITIES.map((item) => (
                <tr key={item.module} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {item.module}
                  </td>
                  <td className="py-3 px-3">{renderBadge(item.permissions.ADMIN)}</td>
                  <td className="py-3 px-3">{renderBadge(item.permissions.INVENTORY_MANAGER)}</td>
                  <td className="py-3 px-3">{renderBadge(item.permissions.SALES_MANAGER)}</td>
                  <td className="py-3 px-3">{renderBadge(item.permissions.PURCHASE_MANAGER)}</td>
                  <td className="py-3 px-3">{renderBadge(item.permissions.VIEWER)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
