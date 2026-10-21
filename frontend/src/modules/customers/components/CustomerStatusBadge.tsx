import React from 'react';
import { CustomerStatus } from '../types/customer.types';
import { CheckCircle2, XCircle } from 'lucide-react';

interface CustomerStatusBadgeProps {
  status: CustomerStatus;
  size?: 'sm' | 'md';
}

export const CustomerStatusBadge: React.FC<CustomerStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  if (status === 'ACTIVE') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}
      >
        <CheckCircle2 className={isSm ? 'w-3 h-3 text-emerald-500' : 'w-3.5 h-3.5 text-emerald-500'} />
        <span>Active</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}
    >
      <XCircle className={isSm ? 'w-3 h-3 text-slate-400' : 'w-3.5 h-3.5 text-slate-400'} />
      <span>Inactive</span>
    </span>
  );
};
