import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  Layers,
  History,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../authentication/hooks/useAuth';
import {
  IInventoryItem,
  IInventoryFilterState,
  IInventoryMetrics,
  IStockTransaction,
  ITransactionFilterState,
} from '../types/inventory.types';
import { inventoryService } from '../services/inventoryService';
import { categoryService } from '../../products/services/categoryService';
import { ICategory } from '../../products/types/product.types';
import { InventoryFilters } from '../components/InventoryFilters';
import { InventoryOverviewTable } from '../components/InventoryOverviewTable';
import { StockHistoryFilters } from '../components/StockHistoryFilters';
import { StockHistoryTable } from '../components/StockHistoryTable';
import { StockInModal } from '../components/StockInModal';
import { StockOutModal } from '../components/StockOutModal';
import { StockAdjustmentModal } from '../components/StockAdjustmentModal';

const INITIAL_INVENTORY_FILTERS: IInventoryFilterState = {
  search: '',
  category_id: 'ALL',
  stock_status: 'ALL',
  product_status: 'ALL',
  page: 1,
  limit: 10,
  sort_by: 'current_quantity',
  sort_order: 'asc',
};

const INITIAL_HISTORY_FILTERS: ITransactionFilterState = {
  product_id: '',
  transaction_type: 'ALL',
  date_from: '',
  date_to: '',
  page: 1,
  limit: 10,
  sort_order: 'desc',
};

export const InventoryPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  // Master data
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [metrics, setMetrics] = useState<IInventoryMetrics | null>(null);

  // Overview Tab State
  const [inventoryItems, setInventoryItems] = useState<IInventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryTotal, setInventoryTotal] = useState(0);
  const [inventoryPages, setInventoryPages] = useState(1);
  const [inventoryFilters, setInventoryFilters] = useState<IInventoryFilterState>(INITIAL_INVENTORY_FILTERS);

  // History Tab State
  const [transactions, setTransactions] = useState<IStockTransaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPages, setHistoryPages] = useState(1);
  const [historyFilters, setHistoryFilters] = useState<ITransactionFilterState>(INITIAL_HISTORY_FILTERS);

  // Modal State
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isStockOutOpen, setIsStockOutOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedProductForAction, setSelectedProductForAction] = useState<IInventoryItem | null>(null);

  // Notifications
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Permissions check
  const canManageStockIn = user?.role === 'ADMIN' || user?.role === 'INVENTORY_MANAGER' || user?.role === 'PURCHASE_MANAGER';
  const canManageStockOut = user?.role === 'ADMIN' || user?.role === 'INVENTORY_MANAGER' || user?.role === 'SALES_MANAGER';
  const canAdjustStock = user?.role === 'ADMIN' || user?.role === 'INVENTORY_MANAGER';

  // Load Categories
  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  // Load Inventory Metrics
  const fetchMetrics = async () => {
    try {
      const data = await inventoryService.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load inventory metrics', err);
    }
  };

  // Load Current Stock Overview
  const fetchInventoryItems = useCallback(async () => {
    try {
      setInventoryLoading(true);
      const res = await inventoryService.getOverview(inventoryFilters);
      setInventoryItems(res.items);
      setInventoryTotal(res.total);
      setInventoryPages(res.total_pages);
    } catch (err: any) {
      showToast(err.message || 'Failed to load stock data', 'error');
    } finally {
      setInventoryLoading(false);
    }
  }, [inventoryFilters]);

  // Load Transaction History
  const fetchTransactions = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await inventoryService.getTransactionHistory(historyFilters);
      setTransactions(res.items);
      setHistoryTotal(res.total);
      setHistoryPages(res.total_pages);
    } catch (err: any) {
      showToast(err.message || 'Failed to load transaction history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  }, [historyFilters]);

  useEffect(() => {
    fetchCategories();
    fetchMetrics();
  }, []);

  useEffect(() => {
    fetchInventoryItems();
  }, [fetchInventoryItems]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchTransactions();
    }
  }, [activeTab, fetchTransactions]);

  const handleRefreshAll = () => {
    fetchMetrics();
    fetchInventoryItems();
    if (activeTab === 'history') {
      fetchTransactions();
    }
    showToast('Inventory data refreshed.');
  };

  const handleOpenStockIn = (item?: IInventoryItem) => {
    setSelectedProductForAction(item || null);
    setIsStockInOpen(true);
  };

  const handleOpenStockOut = (item?: IInventoryItem) => {
    setSelectedProductForAction(item || null);
    setIsStockOutOpen(true);
  };

  const handleOpenAdjust = (item?: IInventoryItem) => {
    setSelectedProductForAction(item || null);
    setIsAdjustOpen(true);
  };

  const handleActionSuccess = (actionName: string) => {
    showToast(`Successfully completed ${actionName} transaction.`);
    fetchMetrics();
    fetchInventoryItems();
    if (activeTab === 'history') {
      fetchTransactions();
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 text-sm text-white ${
            toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Boxes className="w-7 h-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real-time stock monitoring, inventory adjustments, and immutable transaction audit ledger
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefreshAll}
            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 rounded-lg transition-colors"
            title="Refresh Stock Data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {canManageStockIn && (
            <button
              onClick={() => handleOpenStockIn()}
              className="inline-flex items-center px-3.5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <ArrowDownRight className="w-4 h-4 mr-1.5" />
              Stock IN
            </button>
          )}

          {canManageStockOut && (
            <button
              onClick={() => handleOpenStockOut()}
              className="inline-flex items-center px-3.5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              <ArrowUpRight className="w-4 h-4 mr-1.5" />
              Stock OUT
            </button>
          )}

          {canAdjustStock && (
            <button
              onClick={() => handleOpenAdjust()}
              className="inline-flex items-center px-3.5 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Adjust Stock
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards / Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Products</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics?.total_items || 0}</h3>
            <p className="text-xs text-gray-400 mt-1">{metrics?.total_stock_units || 0} total units in warehouse</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => {
            setInventoryFilters((prev) => ({ ...prev, stock_status: 'IN_STOCK', page: 1 }));
            setActiveTab('overview');
          }}
          className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-colors"
        >
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">In Stock</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">{metrics?.in_stock_items || 0}</h3>
            <p className="text-xs text-emerald-600/70 mt-1">Healthy stock levels</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => {
            setInventoryFilters((prev) => ({ ...prev, stock_status: 'LOW_STOCK', page: 1 }));
            setActiveTab('overview');
          }}
          className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Low Stock</p>
            <h3 className="text-2xl font-bold text-amber-700 mt-1">{metrics?.low_stock_items || 0}</h3>
            <p className="text-xs text-amber-600/70 mt-1">At or below reorder level</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => {
            setInventoryFilters((prev) => ({ ...prev, stock_status: 'OUT_OF_STOCK', page: 1 }));
            setActiveTab('overview');
          }}
          className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-rose-300 transition-colors"
        >
          <div>
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Out of Stock</p>
            <h3 className="text-2xl font-bold text-rose-700 mt-1">{metrics?.out_of_stock_items || 0}</h3>
            <p className="text-xs text-rose-600/70 mt-1">Zero quantity available</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 pt-4 flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Current Stock Levels ({inventoryTotal})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-4 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Stock Movement & Audit Ledger</span>
          </button>
        </div>

        {/* Tab 1: Current Stock Overview */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            <InventoryFilters
              filters={inventoryFilters}
              categories={categories}
              onFilterChange={(updates) => setInventoryFilters((prev) => ({ ...prev, ...updates, page: updates.page || 1 }))}
              onReset={() => setInventoryFilters(INITIAL_INVENTORY_FILTERS)}
            />

            <InventoryOverviewTable
              items={inventoryItems}
              isLoading={inventoryLoading}
              page={inventoryFilters.page}
              totalPages={inventoryPages}
              total={inventoryTotal}
              limit={inventoryFilters.limit}
              onPageChange={(newPage) => setInventoryFilters((prev) => ({ ...prev, page: newPage }))}
              onStockIn={(item) => handleOpenStockIn(item)}
              onStockOut={(item) => handleOpenStockOut(item)}
              onAdjust={(item) => handleOpenAdjust(item)}
            />
          </div>
        )}

        {/* Tab 2: Stock History & Audit Trail */}
        {activeTab === 'history' && (
          <div className="p-6 space-y-6">
            <StockHistoryFilters
              filters={historyFilters}
              onFilterChange={(updates) => setHistoryFilters((prev) => ({ ...prev, ...updates, page: updates.page || 1 }))}
              onReset={() => setHistoryFilters(INITIAL_HISTORY_FILTERS)}
            />

            <StockHistoryTable
              transactions={transactions}
              isLoading={historyLoading}
              page={historyFilters.page}
              totalPages={historyPages}
              total={historyTotal}
              limit={historyFilters.limit}
              onPageChange={(newPage) => setHistoryFilters((prev) => ({ ...prev, page: newPage }))}
            />
          </div>
        )}
      </div>

      {/* Stock In Modal */}
      <StockInModal
        isOpen={isStockInOpen}
        onClose={() => setIsStockInOpen(false)}
        onSuccess={() => handleActionSuccess('Stock IN')}
        inventoryItems={inventoryItems}
        preselectedProduct={selectedProductForAction}
      />

      {/* Stock Out Modal */}
      <StockOutModal
        isOpen={isStockOutOpen}
        onClose={() => setIsStockOutOpen(false)}
        onSuccess={() => handleActionSuccess('Stock OUT')}
        inventoryItems={inventoryItems}
        preselectedProduct={selectedProductForAction}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        onSuccess={() => handleActionSuccess('Stock Adjustment')}
        inventoryItems={inventoryItems}
        preselectedProduct={selectedProductForAction}
      />
    </div>
  );
};
