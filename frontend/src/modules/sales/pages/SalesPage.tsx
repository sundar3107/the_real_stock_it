import React, { useState, useEffect, useCallback } from 'react';
import {
  ISalesOrder,
  ISalesFilterState,
  ISalesMetrics,
  SalesStatus,
} from '../types/sales.types';
import { salesService } from '../services/salesService';
import { SalesFilters } from '../components/SalesFilters';
import { SalesTable } from '../components/SalesTable';
import { SalesFormModal } from '../components/SalesFormModal';
import { SalesDetailsModal } from '../components/SalesDetailsModal';
import { ConfirmationDialog } from '../../../components/common/ConfirmationDialog';
import { RoleGuard } from '../../authentication/components/RoleGuard';
import { Button } from '../../../components/common/Button';
import {
  TrendingUp,
  Plus,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BadgeDollarSign,
  PackageCheck,
  Send,
} from 'lucide-react';

const INITIAL_FILTERS: ISalesFilterState = {
  search: '',
  status: 'ALL',
  customer_id: '',
  from_date: '',
  to_date: '',
  page: 1,
  limit: 10,
  sort_by: 'order_date',
  sort_order: 'desc',
};

export const SalesPage: React.FC = () => {
  const [sales, setSales] = useState<ISalesOrder[]>([]);
  const [metrics, setMetrics] = useState<ISalesMetrics | null>(null);
  const [filters, setFilters] = useState<ISalesFilterState>(INITIAL_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<ISalesOrder | null>(null);
  const [detailsOrderId, setDetailsOrderId] = useState<string | null>(null);

  // Status Action state
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [completeOrderId, setCompleteOrderId] = useState<string | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchMetrics = async () => {
    try {
      const data = await salesService.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch sales metrics', err);
    }
  };

  const fetchSales = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await salesService.getSales(filters);
      setSales(res.items);
      setTotalPages(res.total_pages);
      setTotal(res.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to load sales orders', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleRefresh = () => {
    fetchMetrics();
    fetchSales();
    showToast('Sales data refreshed.');
  };

  const handleOpenAdd = () => {
    setOrderToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (order: ISalesOrder) => {
    setOrderToEdit(order);
    setIsFormOpen(true);
  };

  const handleConfirmOrder = async (orderId: string) => {
    try {
      await salesService.updateStatus(orderId, 'CONFIRMED');
      showToast(`Sales order ${orderId} confirmed.`);
      fetchMetrics();
      fetchSales();
    } catch (err: any) {
      showToast(err.message || 'Failed to confirm sales order', 'error');
    }
  };

  const handleExecuteComplete = async () => {
    if (!completeOrderId) return;
    try {
      setIsActionPending(true);
      const result = await salesService.completeSale(completeOrderId);
      showToast(
        `Sales order #${result.order_number} completed successfully! Inventory deducted via Stock OUT.`
      );
      setCompleteOrderId(null);
      fetchMetrics();
      fetchSales();
    } catch (err: any) {
      showToast(err.message || 'Failed to complete sales order', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleExecuteCancel = async () => {
    if (!cancelOrderId) return;
    try {
      setIsActionPending(true);
      await salesService.updateStatus(cancelOrderId, 'CANCELLED');
      showToast(`Sales order #${cancelOrderId} has been cancelled.`);
      setCancelOrderId(null);
      fetchMetrics();
      fetchSales();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel sales order', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm animate-in slide-in-from-top-3 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Sales Management
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Customer sales orders, pricing, and authoritative stock depletion
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh list"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <RoleGuard roles={['ADMIN', 'SALES_MANAGER']}>
            <Button
              onClick={handleOpenAdd}
              variant="primary"
              className="flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Sales Order</span>
            </Button>
          </RoleGuard>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Sales Orders */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total Orders
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {metrics.total_orders}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* Draft Orders */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Draft Orders
              </p>
              <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
                {metrics.draft_orders}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* In-Flight Orders (Confirmed + Processing) */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                In-Flight Orders
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {metrics.confirmed_orders + metrics.processing_orders}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Send className="w-5 h-5" />
            </div>
          </div>

          {/* Completed Sales */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Completed Sales
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {metrics.completed_orders}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total Revenue
              </p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 truncate max-w-[130px]">
                ${Number(metrics.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <BadgeDollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <SalesFilters
        filters={filters}
        onChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
        onReset={() => setFilters(INITIAL_FILTERS)}
      />

      {/* Sales Orders Table */}
      <SalesTable
        sales={sales}
        isLoading={isLoading}
        page={filters.page}
        totalPages={totalPages}
        total={total}
        limit={filters.limit}
        onPageChange={(newPage) => setFilters((prev) => ({ ...prev, page: newPage }))}
        onView={(order) => setDetailsOrderId(order.id)}
        onEdit={(order) => handleOpenEdit(order)}
        onConfirmOrder={(order) => handleConfirmOrder(order.id)}
        onCompleteOrder={(order) => setCompleteOrderId(order.id)}
        onCancelOrder={(order) => setCancelOrderId(order.id)}
      />

      {/* Create / Edit Form Modal */}
      <SalesFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          fetchMetrics();
          fetchSales();
        }}
        orderToEdit={orderToEdit}
      />

      {/* Order Details Modal */}
      <SalesDetailsModal
        isOpen={Boolean(detailsOrderId)}
        onClose={() => setDetailsOrderId(null)}
        salesOrderId={detailsOrderId}
        onEdit={(order) => handleOpenEdit(order)}
        onConfirmOrder={(id) => handleConfirmOrder(id)}
        onCompleteOrder={(id) => setCompleteOrderId(id)}
        onCancelOrder={(id) => setCancelOrderId(id)}
      />

      {/* Complete Order Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(completeOrderId)}
        onClose={() => setCompleteOrderId(null)}
        onConfirm={handleExecuteComplete}
        title="Complete & Fulfill Sales Order"
        message="Completing this sales order will invoke the Inventory Service to deduct physical stock for all line items (Stock OUT) and create immutable audit transactions. This action cannot be undone."
        confirmText="Complete & Deduct Stock"
        variant="primary"
        isLoading={isActionPending}
      />

      {/* Cancel Order Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(cancelOrderId)}
        onClose={() => setCancelOrderId(null)}
        onConfirm={handleExecuteCancel}
        title="Cancel Sales Order"
        message={`Are you sure you want to cancel sales order #${cancelOrderId}? Cancelled orders cannot be fulfilled or completed.`}
        confirmText="Cancel Order"
        variant="danger"
        isLoading={isActionPending}
      />
    </div>
  );
};

export default SalesPage;
