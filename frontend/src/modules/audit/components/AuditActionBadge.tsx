import React from 'react';

interface AuditActionBadgeProps {
  action: string;
}

export const AuditActionBadge: React.FC<AuditActionBadgeProps> = ({ action }) => {
  const norm = (action || '').toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (norm === 'LOGIN') {
    colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (norm === 'REGISTER') {
    colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (norm === 'CREATE') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (norm === 'UPDATE') {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (norm === 'DEACTIVATE') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (norm === 'STOCK_IN') {
    colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
  } else if (norm === 'STOCK_OUT') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (norm === 'STOCK_ADJUSTMENT') {
    colorClasses = 'bg-violet-50 text-violet-700 border-violet-200';
  } else if (norm === 'STATUS_CHANGE') {
    colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
  } else if (norm === 'RECEIVE') {
    colorClasses = 'bg-cyan-50 text-cyan-700 border-cyan-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${colorClasses}`}
    >
      {norm}
    </span>
  );
};
