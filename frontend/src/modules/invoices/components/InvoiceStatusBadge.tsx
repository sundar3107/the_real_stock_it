import React from 'react';
import { InvoiceStatus } from '../types/invoice.types';
import { FileEdit, Send, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  size?: 'sm' | 'md';
}

export const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'DRAFT':
        return {
          label: 'Draft',
          icon: FileEdit,
          className: 'bg-slate-100 text-slate-700 border-slate-300',
        };
      case 'ISSUED':
        return {
          label: 'Issued',
          icon: Send,
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'PARTIALLY_PAID':
        return {
          label: 'Partially Paid',
          icon: AlertCircle,
          className: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'PAID':
        return {
          label: 'Paid',
          icon: CheckCircle2,
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          icon: XCircle,
          className: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      default:
        return {
          label: status,
          icon: FileEdit,
          className: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;
  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${paddingClass} ${config.className}`}
    >
      <Icon className={iconSize} />
      <span>{config.label}</span>
    </span>
  );
};
