import React, { useState, useEffect, useCallback } from 'react';
import {
  ICustomer,
  ICustomerFilterState,
  ICustomerMetrics,
} from '../types/customer.types';
import { customerService } from '../services/customerService';
import { CustomerFilters } from '../components/CustomerFilters';
import { CustomerTable } from '../components/CustomerTable';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { CustomerDetailsModal } from '../components/CustomerDetailsModal';
import { ConfirmationDialog } from '../../../components/common/ConfirmationDialog';
import { RoleGuard } from '../../authentication/components/RoleGuard';
import { Button } from '../../../components/common/Button';
import {
  Users,
  Plus,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

const INITIAL_FILTERS: ICustomerFilterState = {
  search: '',
  status: 'ALL',
  city: '',
  state: '',
  page: 1,
  limit: 10,
  sort_by: 'created_at',
  sort_order: 'desc',
};

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [metrics, setMetrics] = useState<ICustomerMetrics | null>(null);
  const [filters, setFilters] = useState<ICustomerFilterState>(INITIAL_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<ICustomer | null>(null);
  const [detailsCustomerId, setDetailsCustomerId] = useState<string | null>(null);

  // Status Confirmation Dialog state
  const [statusConfirmCustomer, setStatusConfirmCustomer] = useState<ICustomer | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchMetrics = async () => {
    try {
      const data = await customerService.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch customer metrics', err);
    }
  };

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await customerService.getCustomers(filters);
      setCustomers(res.items);
      setTotalPages(res.total_pages);
      setTotal(res.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to load customers', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleRefresh = () => {
    fetchMetrics();
    fetchCustomers();
    showToast('Customer data refreshed.');
  };

  const handleOpenAdd = () => {
    setCustomerToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer: ICustomer) => {
    setCustomerToEdit(customer);
    setIsFormOpen(true);
  };

  const handleView = (customer: ICustomer) => {
    setDetailsCustomerId(customer.id);
  };

  const handleTriggerStatusToggle = (customer: ICustomer) => {
    setStatusConfirmCustomer(customer);
  };

  const handleConfirmStatusToggle = async () => {
    if (!statusConfirmCustomer) return;
    try {
      setIsUpdatingStatus(true);
      const newStatus = statusConfirmCustomer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await customerService.updateStatus(statusConfirmCustomer.id, newStatus);
      showToast(
        `Customer '${statusConfirmCustomer.customer_name}' ${
          newStatus === 'ACTIVE' ? 'activated' : 'deactivated'
        } successfully.`
      );
      setStatusConfirmCustomer(null);
      fetchMetrics();
      fetchCustomers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update customer status.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<ICustomerFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform translate-y-0 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" />
            <span>Customer Management</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain customer directories, contact profiles, delivery locations, and sales account records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>

          <RoleGuard action="customer:manage">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Register Customer</span>
            </Button>
          </RoleGuard>
        </div>
      </div>

      {/* KPI Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Customers */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Customers
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {metrics ? metrics.total_customers : '-'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Commercial & Retail Accounts</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Accounts
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {metrics ? metrics.active_customers : '-'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Eligible for sales orders</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Inactive Customers */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Inactive / Archived
            </div>
            <div className="text-2xl font-bold text-slate-600 mt-1">
              {metrics ? metrics.inactive_customers : '-'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Soft-deactivated customers</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <CustomerFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Customer Registry Table */}
      <CustomerTable
        customers={customers}
        isLoading={isLoading}
        page={filters.page}
        totalPages={totalPages}
        total={total}
        limit={filters.limit}
        onPageChange={(newPage) => handleFilterChange({ page: newPage })}
        onView={handleView}
        onEdit={handleOpenEdit}
        onToggleStatus={handleTriggerStatusToggle}
      />

      {/* Add / Edit Form Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          fetchMetrics();
          fetchCustomers();
        }}
        customerToEdit={customerToEdit}
      />

      {/* Customer Details Modal with Future Placeholders */}
      <CustomerDetailsModal
        isOpen={!!detailsCustomerId}
        onClose={() => setDetailsCustomerId(null)}
        customerId={detailsCustomerId}
        onEdit={handleOpenEdit}
        onToggleStatus={handleTriggerStatusToggle}
      />

      {/* Status Change Confirmation Dialog */}
      {statusConfirmCustomer && (
        <ConfirmationDialog
          isOpen={!!statusConfirmCustomer}
          onClose={() => setStatusConfirmCustomer(null)}
          onConfirm={handleConfirmStatusToggle}
          title={
            statusConfirmCustomer.status === 'ACTIVE'
              ? 'Deactivate Customer'
              : 'Reactivate Customer'
          }
          message={
            statusConfirmCustomer.status === 'ACTIVE'
              ? `Are you sure you want to deactivate customer '${statusConfirmCustomer.customer_name}'? Inactive customers cannot be selected for new sales orders, but historical orders will be preserved.`
              : `Are you sure you want to reactivate customer '${statusConfirmCustomer.customer_name}'? The customer will become available again for new sales orders.`
          }
          confirmText={
            statusConfirmCustomer.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'
          }
          variant={statusConfirmCustomer.status === 'ACTIVE' ? 'danger' : 'primary'}
          isLoading={isUpdatingStatus}
        />
      )}
    </div>
  );
};
