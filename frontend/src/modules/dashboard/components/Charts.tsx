import React from 'react';
import { IChartData } from '../types/dashboard.types';
import { TrendingUp, ShoppingBag, PieChart, Layers } from 'lucide-react';

interface ChartsProps {
  data: IChartData;
}

export const Charts: React.FC<ChartsProps> = ({ data }) => {
  // Max value calculation for bar chart scaling
  const maxFinancial = Math.max(
    ...data.sales_vs_purchases.map((d) => Math.max(d.sales, d.purchases)),
    100
  );

  const maxCategoryUnits = Math.max(
    ...data.category_distribution.map((c) => c.total_units),
    10
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Sales vs Purchase Spend Trend Chart */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">Sales vs. Purchases Trend</h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span>
                <span className="text-slate-600 font-medium">Sales Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-purple-500 inline-block"></span>
                <span className="text-slate-600 font-medium">Purchases Spend</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          {data.sales_vs_purchases.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 italic">
              No sales or purchase data recorded yet.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="h-48 flex items-end justify-between gap-4 pt-4 border-b border-slate-100">
                {data.sales_vs_purchases.map((item, idx) => {
                  const salesHeight = Math.max(8, Math.round((item.sales / maxFinancial) * 160));
                  const purchasesHeight = Math.max(8, Math.round((item.purchases / maxFinancial) * 160));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1.5 h-40">
                        {/* Sales Bar */}
                        <div
                          style={{ height: `${salesHeight}px` }}
                          className="w-1/2 max-w-[28px] bg-emerald-500 hover:bg-emerald-600 rounded-t transition-all relative"
                          title={`Sales: $${item.sales.toFixed(2)}`}
                        >
                          <span className="opacity-0 group-hover:opacity-100 transition absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-10">
                            ${item.sales.toFixed(0)}
                          </span>
                        </div>

                        {/* Purchase Bar */}
                        <div
                          style={{ height: `${purchasesHeight}px` }}
                          className="w-1/2 max-w-[28px] bg-purple-500 hover:bg-purple-600 rounded-t transition-all relative"
                          title={`Purchases: $${item.purchases.toFixed(2)}`}
                        >
                          <span className="opacity-0 group-hover:opacity-100 transition absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-10">
                            ${item.purchases.toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 mt-1">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Commercial cash flow comparison</span>
          <span className="font-semibold text-slate-700">Authoritative data</span>
        </div>
      </div>

      {/* 2. Stock Health Distribution */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">Inventory Stock Health</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Real-time status</span>
          </div>

          {/* Segmented Multi-Color Progress Bar */}
          <div className="space-y-4 mt-2">
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              {data.stock_status_distribution.map((segment) => {
                let bgColor = 'bg-emerald-500';
                if (segment.status === 'LOW_STOCK') bgColor = 'bg-amber-500';
                if (segment.status === 'OUT_OF_STOCK') bgColor = 'bg-rose-500';

                if (segment.count === 0) return null;

                return (
                  <div
                    key={segment.status}
                    style={{ width: `${Math.max(5, segment.percentage)}%` }}
                    className={`${bgColor} h-full transition-all`}
                    title={`${segment.status}: ${segment.count} (${segment.percentage}%)`}
                  />
                );
              })}
            </div>

            {/* Breakdown Cards */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {data.stock_status_distribution.map((segment) => {
                let label = 'In Stock';
                let textColor = 'text-emerald-700';
                let borderColor = 'border-emerald-200';
                let bgColor = 'bg-emerald-50/60';

                if (segment.status === 'LOW_STOCK') {
                  label = 'Low Stock';
                  textColor = 'text-amber-700';
                  borderColor = 'border-amber-200';
                  bgColor = 'bg-amber-50/60';
                } else if (segment.status === 'OUT_OF_STOCK') {
                  label = 'Out of Stock';
                  textColor = 'text-rose-700';
                  borderColor = 'border-rose-200';
                  bgColor = 'bg-rose-50/60';
                }

                return (
                  <div
                    key={segment.status}
                    className={`p-3 rounded-lg border ${borderColor} ${bgColor} text-center`}
                  >
                    <div className={`text-xl font-bold ${textColor}`}>{segment.count}</div>
                    <div className="text-xs font-medium text-slate-600 mt-0.5">{label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{segment.percentage}% of catalog</div>
                  </div>
                );
              })}
            </div>

            {/* Category Units Breakdown */}
            {data.category_distribution.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Stock Distribution by Category</span>
                </div>
                <div className="space-y-2">
                  {data.category_distribution.slice(0, 4).map((cat, i) => {
                    const pct = Math.round((cat.total_units / maxCategoryUnits) * 100);
                    return (
                      <div key={i} className="text-xs space-y-1">
                        <div className="flex justify-between text-slate-600">
                          <span className="font-medium text-slate-800">{cat.category_name}</span>
                          <span>{cat.total_units} units ({cat.product_count} products)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.max(5, pct)}%` }}
                            className="h-full bg-blue-500 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Safety buffer: Reorder point monitoring</span>
          <span className="font-semibold text-indigo-600">Inventory module</span>
        </div>
      </div>
    </div>
  );
};
