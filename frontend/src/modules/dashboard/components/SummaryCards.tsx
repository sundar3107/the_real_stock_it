import React from 'react';
import { Link } from 'react-router-dom';
import { IDashboardSummary } from '../types/dashboard.types';
import { UserRole } from '../../authentication/types/auth.types';
import {
  Package,
  Boxes,
  AlertTriangle,
  XCircle,
  Truck,
  Users,
  ShoppingBag,
  TrendingUp,
  Receipt,
  ArrowUpRight,
} from 'lucide-react';

interface SummaryCardsProps {
  summary: IDashboardSummary;
  userRole?: UserRole;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, userRole = 'ADMIN' }) => {
  const showInventory = ['ADMIN', 'INVENTORY_MANAGER', 'VIEWER'].includes(userRole);
  const showPurchases = ['ADMIN', 'PURCHASE_MANAGER', 'VIEWER'].includes(userRole);
  const showSales = ['ADMIN', 'SALES_MANAGER', 'VIEWER'].includes(userRole);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {/* 1. Products */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition group flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Products</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.products.total}</div>
          <div className="text-xs text-slate-500 mt-1">
            <span className="text-emerald-600 font-medium">{summary.products.active} active</span> &bull; {summary.products.inactive} inactive
          </div>
        </div>
        <Link
          to="/products"
          className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          <span>View catalog</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* 2. Stock Health / Units */}
      {showInventory && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Stock</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.inventory.total_stock_units}</div>
            <div className="text-xs text-slate-500 mt-1">
              Units across {summary.inventory.total_items} product lines
            </div>
          </div>
          <Link
            to="/inventory"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>Stock balances</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      )}

      {/* 3. Low Stock Alert */}
      {showInventory && (
        <div className={`p-5 rounded-xl border shadow-sm transition flex flex-col justify-between ${
          summary.inventory.low_stock_items > 0
            ? 'bg-amber-50/60 border-amber-200'
            : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">Low Stock Alert</span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-900">{summary.inventory.low_stock_items}</div>
            <div className="text-xs text-amber-700 mt-1">
              {summary.inventory.out_of_stock_items > 0 ? (
                <span className="font-semibold text-rose-700">
                  + {summary.inventory.out_of_stock_items} out of stock
                </span>
              ) : (
                'Items below reorder point'
              )}
            </div>
          </div>
          <Link
            to="/inventory"
            className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs font-semibold text-amber-800 hover:text-amber-900"
          >
            <span>Reorder items</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 4. Sales Orders & Revenue */}
      {showSales && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Sales Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-700 font-mono">
              ${summary.sales.total_revenue.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              <span className="font-medium text-slate-800">{summary.sales.completed_orders} fulfilled</span> &bull; {summary.sales.pending_orders} pending
            </div>
          </div>
          <Link
            to="/sales"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            <span>Sales orders</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      )}

      {/* 5. Invoices & Billing */}
      {showSales && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Invoices</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.invoices.total_invoices}</div>
            <div className="text-xs text-slate-500 mt-1">
              <span className="text-blue-600 font-medium">{summary.invoices.issued_invoices} issued</span> &bull; ${summary.invoices.total_paid_value.toFixed(2)} paid
            </div>
          </div>
          <Link
            to="/invoices"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <span>Billing & Invoices</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      )}

      {/* 6. Purchases & Procurement */}
      {showPurchases && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Purchases</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.purchases.total_orders}</div>
            <div className="text-xs text-slate-500 mt-1">
              <span className="text-purple-600 font-medium">{summary.purchases.pending_orders} pending</span> &bull; ${summary.purchases.total_spend.toFixed(2)} spend
            </div>
          </div>
          <Link
            to="/purchases"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-600 hover:text-purple-700"
          >
            <span>Purchase orders</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      )}

      {/* 7. Suppliers */}
      {showPurchases && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Suppliers</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.suppliers.total}</div>
            <div className="text-xs text-slate-500 mt-1">
              <span className="text-emerald-600 font-medium">{summary.suppliers.active} active</span> suppliers
            </div>
          </div>
          <Link
            to="/suppliers"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <span>Supplier directory</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      )}

      {/* 8. Customers */}
      {showSales && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Customers</span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.customers.total}</div>
            <div className="text-xs text-slate-500 mt-1">
              <span className="text-emerald-600 font-medium">{summary.customers.active} active</span> customer accounts
            </div>
          </div>
          <Link
            to="/customers"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-600 hover:text-teal-700"
          >
            <span>Customer accounts</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  );
};
