import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Lock,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../authentication/hooks/useAuth';
import { IActivityLog, IAuditFilterQuery } from '../types/audit.types';
import { auditService } from '../services/auditService';
import { AuditFilters } from '../components/AuditFilters';
import { AuditLogTable } from '../components/AuditLogTable';
import { AuditDetailsModal } from '../components/AuditDetailsModal';

export const AuditLogsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [logs, setLogs] = useState<IActivityLog[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<IActivityLog | null>(null);

  const [filters, setFilters] = useState<IAuditFilterQuery>({
    page: 1,
    limit: 20,
    search: '',
    module: '',
    action: '',
    start_date: '',
    end_date: '',
  });

  const fetchLogs = useCallback(async () => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await auditService.getLogs(filters);
      setLogs(res.logs);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (updated: Partial<IAuditFilterQuery>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      search: '',
      module: '',
      action: '',
      start_date: '',
      end_date: '',
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  // If user is not ADMIN, show unauthorized card
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center max-w-lg mx-auto mt-12">
          <div className="p-3 bg-rose-100 rounded-full text-rose-600 inline-block mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Access Restricted
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            The Activity &amp; Audit Trail contains sensitive system governance data. Only users with the <span className="font-semibold text-slate-700">ADMIN</span> role are authorized to inspect audit logs.
          </p>
          <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
            Current Role: <span className="font-bold text-slate-700">{user?.role || 'VIEWER'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">
              Activity &amp; Audit Logs
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <FileCheck className="w-3 h-3" />
              Append-Only Ledger
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Tamper-resistant historical audit trail tracking system logins, inventory movements, procurement, sales, and configuration events.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg border border-slate-200 shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters Bar */}
      <AuditFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Audit Log Table */}
      <AuditLogTable
        logs={logs}
        isLoading={isLoading}
        onSelectLog={(log) => setSelectedLog(log)}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm text-sm">
          <span className="text-xs text-slate-500">
            Showing Page <span className="font-semibold text-slate-800">{filters.page}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalPages}</span> ({total} total records)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange((filters.page || 1) - 1)}
              disabled={(filters.page || 1) <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="text-xs font-semibold text-slate-700 px-2">
              {filters.page} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange((filters.page || 1) + 1)}
              disabled={(filters.page || 1) >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}

      {/* Audit Details Modal */}
      <AuditDetailsModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
};
