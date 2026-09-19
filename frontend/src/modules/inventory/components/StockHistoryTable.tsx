import React from 'react';
import { IStockTransaction, TransactionType } from '../types/inventory.types';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ArrowDownLeft, ArrowUpRight, SlidersHorizontal, ChevronLeft, ChevronRight, History } from 'lucide-react';

interface StockHistoryTableProps {
  transactions: IStockTransaction[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
}

export const StockHistoryTable: React.FC<StockHistoryTableProps> = ({
  transactions,
  isLoading,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}) => {
  const getBadge = (type: TransactionType) => {
    switch (type) {
      case 'STOCK_IN':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            Stock IN
          </span>
        );
      case 'STOCK_OUT':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
            Stock OUT
          </span>
        );
      case 'ADJUSTMENT':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
            Adjustment
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto min-h-[300px]">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <LoadingSpinner size="lg" className="text-blue-600 mb-3" />
            <p className="text-sm font-medium">Loading transaction audit trail...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-700">No stock transactions recorded</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No stock movements have occurred yet. Receive or issue stock to generate transaction records.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Date & Time</th>
                <th className="px-6 py-3.5">Product / SKU</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Movement Qty</th>
                <th className="px-6 py-3.5">Stock Shift</th>
                <th className="px-6 py-3.5">Reason & Reference</th>
                <th className="px-6 py-3.5">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => {
                const isPositive = tx.new_quantity > tx.previous_quantity;
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(tx.created_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{tx.product_name}</div>
                      <div className="font-mono text-xs text-slate-400">{tx.sku}</div>
                    </td>
                    <td className="px-6 py-4">{getBadge(tx.transaction_type)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-bold font-mono text-sm ${
                          isPositive ? 'text-emerald-600' : 'text-blue-600'
                        }`}
                      >
                        {isPositive ? `+${tx.quantity}` : `-${tx.quantity}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-700">
                      <span className="text-slate-400">{tx.previous_quantity}</span>
                      <span className="mx-1 text-slate-400">&rarr;</span>
                      <span className="font-bold text-slate-900">{tx.new_quantity}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-800 font-medium">{tx.reason}</div>
                      {tx.reference && (
                        <div className="text-[11px] font-mono text-blue-600 mt-0.5">
                          Ref: {tx.reference}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                      {tx.performer_name || 'System Admin'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!isLoading && total > 0 && (
        <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-slate-800">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-semibold text-slate-800">{total}</span> audit records
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="p-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="p-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
