import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../authentication/hooks/useAuth';
import { can } from '../../authentication/utils/permissionUtils';
import {
  IInvoice,
  IInvoiceDetail,
  IInvoiceFilterState,
  IInvoiceMetrics,
  InvoiceStatus,
} from '../types/invoice.types';
import { invoiceService } from '../services/invoiceService';
import { InvoiceTable } from '../components/InvoiceTable';
import { InvoiceFilters } from '../components/InvoiceFilters';
import { InvoiceFormModal } from '../components/InvoiceFormModal';
import { InvoiceDetailsModal } from '../components/InvoiceDetailsModal';
import {
  Receipt,
  Plus,
  FileEdit,
  Send,
  CheckCircle2,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const canManage = can(user, 'invoice:create') || can(user, 'invoice:manage');

  // List & Metrics State
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [metrics, setMetrics] = useState<IInvoiceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<IInvoiceFilterState>({
    search: '',
    status: 'ALL',
    customer_id: '',
    sales_order_id: '',
    from_date: '',
    to_date: '',
    page: 1,
    limit: 10,
    sort_by: 'invoice_date',
    sort_order: 'desc',
  });

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<IInvoiceDetail | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<IInvoiceDetail | null>(null);

  // Fetch Invoices and Metrics
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [invRes, metricRes] = await Promise.all([
        invoiceService.getInvoices(filters),
        invoiceService.getMetrics(),
      ]);

      setInvoices(invRes.items);
      setPage(invRes.page);
      setTotalPages(invRes.total_pages);
      setTotalItems(invRes.total);
      setMetrics(metricRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle viewing full details
  const handleViewInvoice = async (inv: IInvoice) => {
    try {
      const detail = await invoiceService.getInvoiceById(inv.id);
      setSelectedInvoice(detail);
      setIsDetailsOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve invoice details.');
    }
  };

  // Handle editing a draft invoice
  const handleEditInvoice = async (inv: IInvoice) => {
    try {
      const detail = await invoiceService.getInvoiceById(inv.id);
      setInvoiceToEdit(detail);
      setIsFormOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve invoice for editing.');
    }
  };

  // Handle quick status updates from table or details modal
  const handleStatusChange = async (id: string, newStatus: InvoiceStatus) => {
    try {
      const updated = await invoiceService.updateStatus(id, newStatus);
      setSuccessMessage(`Invoice #${updated.invoice_number} marked as '${newStatus}'.`);
      if (selectedInvoice && selectedInvoice.id === id) {
        setSelectedInvoice(updated);
      }
      fetchData();
    } catch (err: any) {
      setError(err.message || `Failed to update invoice status.`);
    }
  };

  const handleFilterChange = (updated: Partial<IInvoiceFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      customer_id: '',
      sales_order_id: '',
      from_date: '',
      to_date: '',
      page: 1,
      limit: 10,
      sort_by: 'invoice_date',
      sort_order: 'desc',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-blue-600" />
            <span>Commercial Invoices</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage customer billing, view generated sales invoices, and print receipts
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              setInvoiceToEdit(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Banner */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase">Total Invoices</span>
              <Receipt className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{metrics.total_invoices}</div>
            <div className="text-xs text-slate-400 mt-1">Across all accounts</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase">Draft</span>
              <FileEdit className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-700">{metrics.draft_invoices}</div>
            <div className="text-xs text-slate-400 mt-1">Unfinalized drafts</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase">Issued / Due</span>
              <Send className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-700">{metrics.issued_invoices}</div>
            <div className="text-xs text-slate-400 mt-1">Awaiting customer payment</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase">Paid Invoices</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-700">{metrics.paid_invoices}</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">
              ${metrics.total_paid_value.toFixed(2)} paid
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase">Total Invoiced</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              ${metrics.total_invoiced_value.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 mt-1">Net non-cancelled value</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <InvoiceFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Invoices List Table */}
      <InvoiceTable
        invoices={invoices}
        loading={loading}
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={(p) => handleFilterChange({ page: p })}
        onView={handleViewInvoice}
        onEdit={handleEditInvoice}
        onStatusChange={handleStatusChange}
        canManage={canManage}
      />

      {/* Create / Edit Form Modal */}
      <InvoiceFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setInvoiceToEdit(null);
        }}
        onSuccess={(saved) => {
          setSuccessMessage(`Invoice #${saved.invoice_number} saved successfully.`);
          fetchData();
        }}
        invoiceToEdit={invoiceToEdit}
      />

      {/* Invoice Full Details & Printable Modal */}
      <InvoiceDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onStatusChange={(updated) => {
          setSelectedInvoice(updated);
          setSuccessMessage(`Invoice #${updated.invoice_number} status updated to ${updated.status}.`);
          fetchData();
        }}
        onEdit={(inv) => {
          setInvoiceToEdit(inv);
          setIsFormOpen(true);
        }}
        canManage={canManage}
      />
    </div>
  );
};
