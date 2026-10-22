import React, { useState, useEffect } from 'react';
import {
  Save,
  Building,
  Mail,
  Phone,
  DollarSign,
  Percent,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sliders,
} from 'lucide-react';
import { ISystemSetting, ISystemSettingsMap } from '../types/administration.types';

interface SystemSettingsFormProps {
  settings: ISystemSetting[];
  map: ISystemSettingsMap;
  isLoading: boolean;
  onSave: (updatedMap: Record<string, string>) => Promise<void>;
}

export const SystemSettingsForm: React.FC<SystemSettingsFormProps> = ({
  settings,
  map,
  isLoading,
  onSave,
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (map) {
      setFormData({ ...map });
    }
  }, [map]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setErrorMsg(null);
      await onSave(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save system settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center animate-pulse">
        <p className="text-sm text-slate-500">Loading system settings...</p>
      </div>
    );
  }

  // Find latest update timestamp
  const latestSetting = settings.slice().sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Banner Status */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              System Configuration Parameters
            </h3>
            <p className="text-xs text-slate-500">
              Global business defaults applied across Invoices, Purchasing, Sales, and Inventory.
            </p>
          </div>
        </div>

        {latestSetting && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Last Updated: {new Date(latestSetting.updated_at).toLocaleString()}</span>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-sm font-semibold text-emerald-800 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>System configuration parameters saved and updated successfully.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-sm font-semibold text-rose-800 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Company Profile */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Company &amp; Legal Profile
            </h4>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Registered Company Name
            </label>
            <input
              type="text"
              value={formData.company_name || ''}
              onChange={(e) => handleChange('company_name', e.target.value)}
              placeholder="e.g. Acme Corp Ltd."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Headquarters / Operating Address
            </label>
            <textarea
              rows={2}
              value={formData.company_address || ''}
              onChange={(e) => handleChange('company_address', e.target.value)}
              placeholder="Full office or warehouse address..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Contact Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  value={formData.contact_email || ''}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  placeholder="contact@company.local"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={formData.contact_phone || ''}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: General & Financial Defaults */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Financial &amp; System Defaults
            </h4>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Application Brand Title
            </label>
            <input
              type="text"
              value={formData.app_name || ''}
              onChange={(e) => handleChange('app_name', e.target.value)}
              placeholder="StockIT SCM"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Default Currency Code
              </label>
              <select
                value={formData.default_currency || 'USD'}
                onChange={(e) => handleChange('default_currency', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Default Tax Rate (%)
              </label>
              <div className="relative">
                <Percent className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.default_tax_rate || '18'}
                  onChange={(e) => handleChange('default_tax_rate', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Date Display Format
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <select
                  value={formData.date_format || 'YYYY-MM-DD'}
                  onChange={(e) => handleChange('date_format', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (UK/IN)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Default Low Stock Alert Threshold
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  value={formData.low_stock_threshold_default || '10'}
                  onChange={(e) => handleChange('low_stock_threshold_default', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Settings...' : 'Save Configuration Settings'}</span>
        </button>
      </div>
    </form>
  );
};
