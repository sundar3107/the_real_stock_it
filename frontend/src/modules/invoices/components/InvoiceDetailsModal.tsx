import React, { useState } from 'react';
import { IInvoiceDetail, InvoiceStatus } from '../types/invoice.types';
import { InvoicePrintView } from './InvoicePrintView';
import { invoiceService } from '../services/invoiceService';
import {
  X,
  Printer,
  CheckCircle2,
  Send,
  AlertCircle,
  XCircle,
  Loader2,
  FileEdit,
} from 'lucide-react';

interface InvoiceDetailsModalProps {
  invoice: IInvoiceDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (updatedInvoice: IInvoiceDetail) => void;
  onEdit?: (invoice: IInvoiceDetail) => void;
  canManage?: boolean;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onStatusChange,
  onEdit,
  canManage = false,
}) => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !invoice) return null;

  const handleStatusUpdate = async (newStatus: InvoiceStatus) => {
    try {
      setUpdating(true);
      setError(null);
      const updated = await invoiceService.updateStatus(invoice.id, newStatus);
      if (onStatusChange) {
        onStatusChange(updated);
      }
    } catch (err: any) {
      setError(err.message || `Failed to transition invoice status to ${newStatus}`);
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Top Bar - Hidden during print */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-800">
              Invoice #{invoice.invoice_number}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition"
              title="Print Invoice"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print</span>
            </button>

            {canManage && invoice.status === 'DRAFT' && onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(invoice);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>Edit Draft</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2 print:hidden">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Printable Invoice Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <InvoicePrintView invoice={invoice} />
        </div>

        {/* Status Actions Bottom Bar - Hidden during print */}
        {canManage && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="text-xs text-slate-500 font-medium">
              Current Workflow Status: <span className="font-bold text-slate-800">{invoice.status}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {invoice.status === 'DRAFT' && (
                <button
                  disabled={updating}
                  onClick={() => handleStatusUpdate('ISSUED')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Issue Invoice</span>
                </button>
              )}

              {invoice.status === 'ISSUED' && (
                <>
                  <button
                    disabled={updating}
                    onClick={() => handleStatusUpdate('PARTIALLY_PAID')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
                  >
                    {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>Mark Partially Paid</span>
                  </button>
                  <button
                    disabled={updating}
                    onClick={() => handleStatusUpdate('PAID')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Mark as Paid</span>
                  </button>
                </>
              )}

              {invoice.status === 'PARTIALLY_PAID' && (
                <button
                  disabled={updating}
                  onClick={() => handleStatusUpdate('PAID')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Mark Fully Paid</span>
                </button>
              )}

              {['DRAFT', 'ISSUED', 'PARTIALLY_PAID'].includes(invoice.status) && (
                <button
                  disabled={updating}
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to cancel invoice #${invoice.invoice_number}?`)) {
                      handleStatusUpdate('CANCELLED');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 text-rose-700 text-xs font-medium rounded-lg hover:bg-rose-50 transition disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Cancel Invoice</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
