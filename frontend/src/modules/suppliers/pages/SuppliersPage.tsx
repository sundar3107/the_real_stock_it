import React, { useState, useEffect, useCallback } from 'react';
import {
  ISupplier,
  ISupplierFilterState,
  ISupplierMetrics,
} from '../types/supplier.types';
import { supplierService } from '../services/supplierService';
import { SupplierFilters } from '../components/SupplierFilters';
import { SupplierTable } from '../components/SupplierTable';
import { SupplierFormModal } from '../components/SupplierFormModal';
import { SupplierDetailsModal } from '../components/SupplierDetailsModal';
import { RoleGuard } from '../../authentication/components/RoleGuard';
import {
  Building2,
  Plus,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
} from 'lucide-react';

const INITIAL_FILTERS: ISupplierFilterState = {
  search: '',
  status: 'ALL',
  city: '',
  state: '',
  page: 1,
  limit: 10,
  sort_by: 'created_at',
  sort_order: 'desc',
};

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [metrics, setMetrics] = useState<ISupplierMetrics | null>(null);
  const [filters, setFilters] = useState<ISupplierFilterState>(INITIAL_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<ISupplier | null>(null);
  const [detailsSupplierId, setDetailsSupplierId] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchMetrics = async () => {
    try {
      const data = await supplierService.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch supplier metrics', err);
    }
  };

  const fetchSuppliers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await supplierService.getSuppliers(filters);
      setSuppliers(res.items);
      setTotalPages(res.total_pages);
      setTotal(res.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to load suppliers', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleRefresh = () => {
    fetchMetrics();
    fetchSuppliers();
    showToast('Supplier data refreshed.');
  };

  const handleOpenAdd = () => {
    setSupplierToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (supplier: ISupplier) => {
    setSupplierToEdit(supplier);
    setIsFormOpen(true);
  };

  const handleView = (supplier: ISupplier) => {
    setDetailsSupplierId(supplier.id);
  };

  const handleToggleStatus = async (supplier: ISupplier) => {
    const newStatus = supplier.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionWord = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';

    if (!window.confirm(`Are you sure you want to ${actionWord} supplier '${supplier.supplier_name}'?`)) {
      return;
    }

    try {
      await supplierService.updateStatus(supplier.id, newStatus);
      showToast(`Supplier '${supplier.supplier_name}' is now ${newStatus}.`);
      fetchMetrics();
      fetchSuppliers();
    } catch (err: any) {
      showToast(err.message || `Failed to ${actionWord} supplier`, 'error');
    }
  };

  const handleFormSuccess = () => {
    showToast(`Supplier ${supplierToEdit ? 'updated' : 'created'} successfully.`);
    fetchMetrics();
    fetchSuppliers();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Supplier Management</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage vendor registry, authorized contact details, and catalog product associations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition"
            title="Refresh Supplier Data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <RoleGuard roles={['ADMIN', 'PURCHASE_MANAGER']}>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Supplier
            </button>
          </RoleGuard>
        </div>
      </div>

      {/* KPI Cards / Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setFilters((prev) => ({ ...prev, status: 'ALL', page: 1 }))}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-300 transition"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Registered Vendors</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics?.total_suppliers || 0}</h3>
            <p className="text-xs text-slate-400 mt-1">Authorized vendor database</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setFilters((prev) => ({ ...prev, status: 'ACTIVE', page: 1 }))}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-300 transition"
        >
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Active Suppliers</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">{metrics?.active_suppliers || 0}</h3>
            <p className="text-xs text-emerald-600/70 mt-1">Approved for Purchase Orders</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setFilters((prev) => ({ ...prev, status: 'INACTIVE', page: 1 }))}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-slate-400 transition"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inactive Suppliers</p>
            <h3 className="text-2xl font-bold text-slate-700 mt-1">{metrics?.inactive_suppliers || 0}</h3>
            <p className="text-xs text-slate-400 mt-1">Deactivated / Suspended</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <SupplierFilters
        filters={filters}
        onFilterChange={(updates) => setFilters((prev) => ({ ...prev, ...updates, page: updates.page || 1 }))}
        onReset={() => setFilters(INITIAL_FILTERS)}
      />

      {/* Supplier Data Table */}
      <SupplierTable
        suppliers={suppliers}
        isLoading={isLoading}
        page={filters.page}
        totalPages={totalPages}
        total={total}
        limit={filters.limit}
        onPageChange={(newPage) => setFilters((prev) => ({ ...prev, page: newPage }))}
        onView={handleView}
        onEdit={handleOpenEdit}
        onToggleStatus={handleToggleStatus}
      />

      {/* Add / Edit Modal */}
      <SupplierFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        supplierToEdit={supplierToEdit}
      />

      {/* Details View Modal */}
      <SupplierDetailsModal
        isOpen={!!detailsSupplierId}
        supplierId={detailsSupplierId}
        onClose={() => setDetailsSupplierId(null)}
        onEdit={handleOpenEdit}
        onToggleStatus={handleToggleStatus}
        onSupplierUpdated={() => {
          fetchMetrics();
          fetchSuppliers();
        }}
      />
    </div>
  );
};
