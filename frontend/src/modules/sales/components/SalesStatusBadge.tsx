import React from 'react';
import { SalesStatus } from '../types/sales.types';

interface SalesStatusBadgeProps {
  status: SalesStatus;
  size?: 'sm' | 'md';
}

export const SalesStatusBadge: React.FC<SalesStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const getBadgeConfig = (st: SalesStatus) => {
    switch (st) {
      case 'DRAFT':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
          dot: 'bg-slate-400',
          label: 'Draft',
        };
      case 'CONFIRMED':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
          dot: 'bg-blue-500',
          label: 'Confirmed',
        };
      case 'PROCESSING':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
          dot: 'bg-amber-500 animate-pulse',
          label: 'Processing',
        };
      case 'COMPLETED':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
          dot: 'bg-emerald-500',
          label: 'Completed',
        };
      case 'CANCELLED':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
          dot: 'bg-rose-500',
          label: 'Cancelled',
        };
      default:
        return {
          bg: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
          dot: 'bg-gray-400',
          label: st,
        };
    }
  };

  const config = getBadgeConfig(status);
  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${sizeClasses} ${config.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};
