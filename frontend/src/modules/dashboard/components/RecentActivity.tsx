import React from 'react';
import { IRecentActivityItem } from '../types/dashboard.types';
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingBag,
  TrendingUp,
  Receipt,
  Package,
  Sliders,
  Clock,
} from 'lucide-react';

interface RecentActivityProps {
  activities: IRecentActivityItem[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getIcon = (type: IRecentActivityItem['type']) => {
    switch (type) {
      case 'STOCK_IN':
        return <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />;
      case 'STOCK_OUT':
        return <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />;
      case 'STOCK_ADJUST':
        return <Sliders className="w-3.5 h-3.5 text-amber-600" />;
      case 'SALE_CREATED':
      case 'SALE_COMPLETED':
        return <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />;
      case 'PURCHASE_CREATED':
      case 'PURCHASE_RECEIVED':
        return <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />;
      case 'INVOICE_CREATED':
      case 'INVOICE_PAID':
        return <Receipt className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <Package className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getBadgeStyle = (color: IRecentActivityItem['badge_color']) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent System Activity</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Cross-module events</span>
        </div>

        {activities.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 italic">
            No system activity recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((act) => (
              <div key={act.id} className="py-3 flex items-start gap-3 group hover:bg-slate-50/60 rounded-lg px-2 -mx-2 transition">
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 ${getBadgeStyle(act.badge_color)}`}>
                  {getIcon(act.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {act.title}
                    </span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {act.timestamp.slice(0, 16).replace('T', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
        Live telemetry aggregated from Inventory, Purchases, Sales & Invoicing
      </div>
    </div>
  );
};
