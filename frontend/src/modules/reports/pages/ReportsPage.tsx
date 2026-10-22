import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  TrendingUp,
  ShoppingBag,
  History,
  Download,
  Printer,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  IInventoryValuationReport,
  IPurchaseReport,
  IReportFilterParams,
  ISalesReport,
  IStockMovementReport,
  ReportType,
} from '../types/report.types';
import { reportService } from '../services/reportService';
import { ReportFilters } from '../components/ReportFilters';
import { InventoryValuationTable } from '../components/InventoryValuationTable';
import { SalesReportTable } from '../components/SalesReportTable';
import { PurchasesReportTable } from '../components/PurchasesReportTable';
import { StockMovementTable } from '../components/StockMovementTable';
import { PrintReportModal } from '../components/PrintReportModal';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportType>('inventory');
  const [filters, setFilters] = useState<IReportFilterParams>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Report Data States
  const [inventoryData, setInventoryData] = useState<IInventoryValuationReport | null>(null);
  const [salesData, setSalesData] = useState<ISalesReport | null>(null);
  const [purchasesData, setPurchasesData] = useState<IPurchaseReport | null>(null);
  const [movementData, setMovementData] = useState<IStockMovementReport | null>(null);

  // Print Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'inventory') {
        const data = await reportService.getInventoryValuation(filters);
        setInventoryData(data);
      } else if (activeTab === 'sales') {
        const data = await reportService.getSalesReport(filters);
        setSalesData(data);
      } else if (activeTab === 'purchases') {
        const data = await reportService.getPurchasesReport(filters);
        setPurchasesData(data);
      } else if (activeTab === 'movement') {
        const data = await reportService.getStockMovementReport(filters);
        setMovementData(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load report dataset.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleTabChange = (tab: ReportType) => {
    setActiveTab(tab);
    setFilters({}); // Reset filters on tab switch
  };

  const handleDownloadCsv = async () => {
    try {
      setDownloading(true);
      await reportService.downloadCsv(activeTab, filters);
    } catch (err: any) {
      alert(`Export failed: ${err?.message || 'Unable to download CSV'}`);
    } finally {
      setDownloading(false);
    }
  };

  const tabs: { id: ReportType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'inventory', label: 'Inventory Valuation', icon: Boxes },
    { id: 'sales', label: 'Sales Analytics', icon: TrendingUp },
    { id: 'purchases', label: 'Purchase Analytics', icon: ShoppingBag },
    { id: 'movement', label: 'Stock Movement Ledger', icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Reports &amp; Analytics</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative valuation, audit trails, and multi-dimensional operational intelligence.
          </p>
        </div>

        {/* Global Export & Print Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print View</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            disabled={loading || downloading}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-2 overflow-x-auto pb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-white border-t border-x border-slate-200 -mb-px'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar */}
      <ReportFilters
        reportType={activeTab}
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters({})}
      />

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchReport}
            className="font-semibold underline hover:text-rose-950 ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <div className="text-sm font-semibold text-slate-700">Aggregating Report Data...</div>
          <div className="text-xs text-slate-400">Querying authoritative ledgers and calculating metrics.</div>
        </div>
      ) : (
        <>
          {activeTab === 'inventory' && inventoryData && (
            <InventoryValuationTable data={inventoryData} />
          )}

          {activeTab === 'sales' && salesData && (
            <SalesReportTable data={salesData} />
          )}

          {activeTab === 'purchases' && purchasesData && (
            <PurchasesReportTable data={purchasesData} />
          )}

          {activeTab === 'movement' && movementData && (
            <StockMovementTable data={movementData} />
          )}
        </>
      )}

      {/* Print Preview Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reportType={activeTab}
        inventoryData={inventoryData}
        salesData={salesData}
        purchasesData={purchasesData}
        movementData={movementData}
      />
    </div>
  );
};

export default ReportsPage;
