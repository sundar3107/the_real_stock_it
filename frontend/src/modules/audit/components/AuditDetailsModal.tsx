import React from 'react';
import { X, ShieldCheck, User, Calendar, Tag, Database, Activity } from 'lucide-react';
import { IActivityLog } from '../types/audit.types';
import { AuditActionBadge } from './AuditActionBadge';

interface AuditDetailsModalProps {
  log: IActivityLog | null;
  onClose: () => void;
}

export const AuditDetailsModal: React.FC<AuditDetailsModalProps> = ({ log, onClose }) => {
  if (!log) return null;

  const hasOldValue = log.old_value && Object.keys(log.old_value).length > 0;
  const hasNewValue = log.new_value && Object.keys(log.new_value).length > 0;
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Audit Event Record Details
              </h3>
              <p className="text-xs text-slate-500 font-mono">ID: {log.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Top Attributes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
            <div className="flex items-start gap-2.5">
              <User className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase">
                  User Attribution
                </span>
                <span className="font-semibold text-slate-800">{log.user_name}</span>
                {log.user_email && (
                  <span className="block text-xs text-slate-500 font-mono">
                    {log.user_email}
                  </span>
                )}
                {log.user_id && (
                  <span className="block text-xs text-slate-400 font-mono">
                    User ID: {log.user_id}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase">
                  Timestamp (UTC / Local)
                </span>
                <span className="font-semibold text-slate-800 font-mono">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
                <span className="block text-xs text-slate-400 font-mono">
                  Raw: {log.timestamp}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Activity className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase">
                  Action &amp; Module
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <AuditActionBadge action={log.action} />
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-800 text-xs font-medium rounded">
                    {log.module}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Database className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase">
                  Target Entity
                </span>
                <span className="font-medium text-slate-700">
                  {log.entity_type || 'N/A'}
                </span>
                {log.entity_id && (
                  <span className="block text-xs text-slate-500 font-mono">
                    ID: {log.entity_id}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Event Description
            </label>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 font-medium">
              {log.description}
            </div>
          </div>

          {/* Old Value vs New Value Diff */}
          {(hasOldValue || hasNewValue) && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                State Transition (Old vs New Values)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Old Value */}
                <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3">
                  <span className="text-xs font-bold text-rose-700 block mb-2">
                    Previous State (Old Value)
                  </span>
                  {hasOldValue ? (
                    <pre className="text-xs font-mono text-slate-700 bg-white p-3 rounded-lg border border-rose-100 overflow-x-auto max-h-48">
                      {JSON.stringify(log.old_value, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-xs text-slate-400 italic">None recorded</span>
                  )}
                </div>

                {/* New Value */}
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3">
                  <span className="text-xs font-bold text-emerald-700 block mb-2">
                    Updated State (New Value)
                  </span>
                  {hasNewValue ? (
                    <pre className="text-xs font-mono text-slate-700 bg-white p-3 rounded-lg border border-emerald-100 overflow-x-auto max-h-48">
                      {JSON.stringify(log.new_value, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-xs text-slate-400 italic">None recorded</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          {hasMetadata && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Contextual Metadata
              </label>
              <pre className="text-xs font-mono text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 overflow-x-auto max-h-36">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}

          {/* Immutability Notice */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5 text-xs text-blue-700">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-blue-600" />
            <span>
              This audit record is strictly append-only and cryptographically immutable. Modification or deletion of audit logs is forbidden by system policy.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
