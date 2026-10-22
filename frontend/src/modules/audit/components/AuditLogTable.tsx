import React from 'react';
import { Eye, Clock, ShieldAlert } from 'lucide-react';
import { IActivityLog } from '../types/audit.types';
import { AuditActionBadge } from './AuditActionBadge';

interface AuditLogTableProps {
  logs: IActivityLog[];
  isLoading: boolean;
  onSelectLog: (log: IActivityLog) => void;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  logs,
  isLoading,
  onSelectLog,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
        <p className="text-sm text-slate-500">Loading audit trail records...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-slate-800">No Audit Logs Found</h4>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
          No system activity records matched your filter criteria. Try adjusting your search query or date range.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Module</th>
              <th className="py-3 px-4">Entity</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr
                key={log.id}
                className="hover:bg-slate-50/80 transition cursor-pointer"
                onClick={() => onSelectLog(log)}
              >
                {/* Timestamp */}
                <td className="py-3 px-4 text-xs font-mono text-slate-600 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </td>

                {/* User */}
                <td className="py-3 px-4">
                  <span className="font-semibold text-slate-800 block text-xs">
                    {log.user_name}
                  </span>
                  {log.user_email && (
                    <span className="text-[11px] text-slate-400 font-mono block">
                      {log.user_email}
                    </span>
                  )}
                </td>

                {/* Action Badge */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <AuditActionBadge action={log.action} />
                </td>

                {/* Module */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                    {log.module}
                  </span>
                </td>

                {/* Entity */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="text-xs text-slate-700 font-medium block">
                    {log.entity_type || '—'}
                  </span>
                  {log.entity_id && (
                    <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[120px]">
                      {log.entity_id}
                    </span>
                  )}
                </td>

                {/* Description */}
                <td className="py-3 px-4 text-xs text-slate-700 max-w-xs truncate">
                  {log.description}
                </td>

                {/* Action Details */}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLog(log);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
