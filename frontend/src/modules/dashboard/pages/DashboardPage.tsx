import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../authentication/hooks/useAuth';
import {
  IChartData,
  IDashboardSummary,
  IInventorySummary,
  IPurchaseSummary,
  IRecentActivityItem,
  ISalesSummary,
} from '../types/dashboard.types';
import { dashboardService } from '../services/dashboardService';
import { SummaryCards } from '../components/SummaryCards';
import { Charts } from '../components/Charts';
import { InventorySummary } from '../components/InventorySummary';
import { SalesSummary } from '../components/SalesSummary';
import { PurchaseSummary } from '../components/PurchaseSummary';
import { RecentActivity } from '../components/RecentActivity';
import {
  LayoutDashboard,
  Boxes,
  TrendingUp,
  ShoppingBag,
  Activity,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';

type DashboardTab = 'OVERVIEW' | 'INVENTORY' | 'SALES' | 'PURCHASES' | 'ACTIVITY';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'ADMIN';

  // Smart default tab based on user's role
  const getDefaultTab = (): DashboardTab => {
    if (userRole === 'INVENTORY_MANAGER') return 'INVENTORY';
    if (userRole === 'SALES_MANAGER') return 'SALES';
    if (userRole === 'PURCHASE_MANAGER') return 'PURCHASES';
    return 'OVERVIEW';
  };

  const [activeTab, setActiveTab] = useState<DashboardTab>(getDefaultTab());

  // Dashboard Data State
  const [summary, setSummary] = useState<IDashboardSummary | null>(null);
  const [inventory, setInventory] = useState<IInventorySummary | null>(null);
  const [sales, setSales] = useState<ISalesSummary | null>(null);
  const [purchases, setPurchases] = useState<IPurchaseSummary | null>(null);
  const [activities, setActivities] = useState<IRecentActivityItem[]>([]);
  const [charts, setCharts] = useState<IChartData | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [summaryRes, invRes, salesRes, purchasesRes, recentRes, chartsRes] =
        await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getInventory(),
          dashboardService.getSales(),
          dashboardService.getPurchases(),
          dashboardService.getRecent(12),
          dashboardService.getCharts(),
        ]);

      setSummary(summaryRes);
      setInventory(invRes);
      setSales(salesRes);
      setPurchases(purchasesRes);
      setActivities(recentRes);
      setCharts(chartsRes);
    } catch (err: any) {
      setError(err.message || 'Failed to aggregate dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Aggregating live stock management telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome & Telemetry Bar */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-sm mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Role: {userRole.replace('_', ' ')}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Executive Operations Dashboard
          </h1>
          <p className="mt-1 text-slate-300 text-xs md:text-sm">
            Welcome back, <span className="font-semibold text-white">{user?.full_name}</span>. High-level telemetry across catalog, stock, procurement, and sales.
          </p>
        </div>

        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-sm border border-white/20 transition disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Primary KPI Summary Cards */}
      {summary && <SummaryCards summary={summary} userRole={userRole} />}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition ${
            activeTab === 'OVERVIEW'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Full Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition ${
            activeTab === 'INVENTORY'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Inventory & Stock</span>
        </button>

        <button
          onClick={() => setActiveTab('SALES')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition ${
            activeTab === 'SALES'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Sales & Billing</span>
        </button>

        <button
          onClick={() => setActiveTab('PURCHASES')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition ${
            activeTab === 'PURCHASES'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Procurement</span>
        </button>

        <button
          onClick={() => setActiveTab('ACTIVITY')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition ${
            activeTab === 'ACTIVITY'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System Activity</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {charts && <Charts data={charts} />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {inventory && <InventorySummary summary={inventory} />}
            {sales && <SalesSummary summary={sales} />}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {purchases && <PurchaseSummary summary={purchases} />}
            <RecentActivity activities={activities} />
          </div>
        </div>
      )}

      {activeTab === 'INVENTORY' && inventory && (
        <div className="space-y-6">
          {charts && <Charts data={charts} />}
          <InventorySummary summary={inventory} />
        </div>
      )}

      {activeTab === 'SALES' && sales && (
        <div className="space-y-6">
          {charts && <Charts data={charts} />}
          <SalesSummary summary={sales} />
        </div>
      )}

      {activeTab === 'PURCHASES' && purchases && (
        <div className="space-y-6">
          {charts && <Charts data={charts} />}
          <PurchaseSummary summary={purchases} />
        </div>
      )}

      {activeTab === 'ACTIVITY' && (
        <div className="max-w-4xl mx-auto">
          <RecentActivity activities={activities} />
        </div>
      )}
    </div>
  );
};
