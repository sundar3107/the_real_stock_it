import React, { useState, useEffect, useCallback } from 'react';
import {
  IPurchaseOrder,
  IPurchaseFilterState,
  IPurchaseMetrics,
  PurchaseStatus,
} from '../types/purchase.types';
import { purchaseService } from '../services/purchaseService';
import { PurchaseFilters } from '../components/PurchaseFilters';
import { PurchaseTable } from '../components/PurchaseTable';
import { PurchaseFormModal } from '../components/PurchaseFormModal';
import { PurchaseDetailsModal } from '../components/PurchaseDetailsModal';
import { PurchaseReceiveModal } from '../components/PurchaseReceiveModal';
import { ConfirmationDialog } from '../../../components/common/ConfirmationDialog';
import { RoleGuard } from '../../authentication/components/RoleGuard';
import { Button } from '../../../components/common/Button';
import {
  ShoppingBag,
  Plus,
  RotateCcw,
  Clock,
  Truck,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

const INITIAL_FILTERS: IPurchaseFilterState = {
  search: '',
  status: 'ALL',
  supplier_id: '',
  from_date: '',
  to_date: '',
  page: 1,
  limit: 10,
  sort_by: 'order_date',
  sort_order: 'desc',
};

export const PurchasesPage: React.FC = () => {
  const [purchases, setPurchases] = useState<IPurchaseOrder[]>([]);
  const [metrics, setMetrics] = useState<IPurchaseMetrics | null>(null);
  const [filters, setFilters] = useState<IPurchaseFilterState>(INITIAL_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [poToEdit, setPoToEdit] = useState<IPurchaseOrder | null>(null);
  const [detailsPoId, setDetailsPoId] = useState<string | null>(null);
  const [receivePoId, setReceivePoId] = useState<string | null>(null);

  // Status Action state (e.g. Cancel Order)
  const [cancelPoId, setCancelPoId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchMetrics = async () => {
    try {
      const data = await purchaseService.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch purchase metrics', err);
    }
  };

  const fetchPurchases = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await purchaseService.getPurchases(filters);
      setPurchases(res.items);
      setTotalPages(res.total_pages);
      setTotal(res.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to load purchase orders', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleRefresh = () => {
    fetchMetrics();
    fetchPurchases();
    showToast('Purchase data refreshed.');
  };

  const handleOpenAdd = () => {
    setPoToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (po: IPurchaseOrder) => {
    setPoToEdit(po);
    setIsFormOpen(true);
  };

  const handleSubmitOrder = async (poId: string) => {
    try {
      await purchaseService.updateStatus(poId, 'ORDERED');
      showToast(`Purchase order ${poId} placed with supplier.`);
      fetchMetrics();
      fetchPurchases();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit order', 'error');
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelPoId) return;
    try {
      setIsCancelling(true);
      await purchaseService.updateStatus(cancelPoId, 'CANCELLED');
      showToast(`Purchase order ${cancelPoId} has been cancelled.`);
      setCancelPoId(null);
      fetchMetrics();
      fetchPurchases();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel order', 'error');
    } finally {
      setIsCancelling(false);
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
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Purchase Management
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Purchase orders, supplier procurement, and authoritative stock receipt
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

          <RoleGuard roles={['ADMIN', 'PURCHASE_MANAGER']}>
            <Button
              onClick={handleOpenAdd}
              variant="primary"
              className="flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Purchase Order</span>
            </Button>
          </RoleGuard>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total POs */}
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
              <ShoppingBag className="w-5 h-5" />
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

          {/* Pending Inbound (ORDERED + PARTIALLY_RECEIVED) */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Pending Inbound
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {metrics.ordered_orders + metrics.partially_received_orders}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          {/* Received */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Fully Received
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {metrics.received_orders}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Total Spend */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total Spend
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 truncate max-w-[130px]">
                ${Number(metrics.total_spend || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <PurchaseFilters
        filters={filters}
        onChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
        onReset={() => setFilters(INITIAL_FILTERS)}
      />

      {/* Orders Table */}
      <PurchaseTable
        purchases={purchases}
        isLoading={isLoading}
        page={filters.page}
        totalPages={totalPages}
        total={total}
        limit={filters.limit}
        onPageChange={(newPage) => setFilters((prev) => ({ ...prev, page: newPage }))}
        onView={(po) => setDetailsPoId(po.id)}
        onEdit={(po) => handleOpenEdit(po)}
        onReceive={(po) => setReceivePoId(po.id)}
        onSubmitOrder={(po) => handleSubmitOrder(po.id)}
        onCancelOrder={(po) => setCancelPoId(po.id)}
      />

      {/* Create / Edit Form Modal */}
      <PurchaseFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          fetchMetrics();
          fetchPurchases();
        }}
        poToEdit={poToEdit}
      />

      {/* PO Details Modal */}
      <PurchaseDetailsModal
        isOpen={Boolean(detailsPoId)}
        onClose={() => setDetailsPoId(null)}
        purchaseOrderId={detailsPoId}
        onEdit={(po) => handleOpenEdit(po)}
        onReceive={(id) => setReceivePoId(id)}
        onSubmitOrder={(id) => handleSubmitOrder(id)}
        onCancelOrder={(id) => setCancelPoId(id)}
      />

      {/* Inbound Goods Receiving Modal */}
      <PurchaseReceiveModal
        isOpen={Boolean(receivePoId)}
        onClose={() => setReceivePoId(null)}
        purchaseOrderId={receivePoId}
        onSuccess={(msg) => {
          showToast(msg);
          fetchMetrics();
          fetchPurchases();
        }}
      />

      {/* Cancel Order Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(cancelPoId)}
        onClose={() => setCancelPoId(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Purchase Order"
        message={`Are you sure you want to cancel purchase order #${cancelPoId}? This will prevent any future receiving against this order.`}
        confirmText="Cancel Order"
        variant="danger"
        isLoading={isCancelling}
      />
    </div>
  );
};

export default PurchasesPage;
