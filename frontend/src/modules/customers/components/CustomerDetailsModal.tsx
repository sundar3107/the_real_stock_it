import React, { useState, useEffect } from 'react';
import { ICustomer, ICustomerDetail } from '../types/customer.types';
import { customerService } from '../services/customerService';
import { CustomerStatusBadge } from './CustomerStatusBadge';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { RoleGuard } from '../../authentication/components/RoleGuard';
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Clock,
  Edit2,
  Power,
  ShoppingCart,
  Receipt,
  History,
} from 'lucide-react';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string | null;
  onEdit: (customer: ICustomer) => void;
  onToggleStatus: (customer: ICustomer) => void;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  customerId,
  onEdit,
  onToggleStatus,
}) => {
  const [customer, setCustomer] = useState<ICustomerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'sales' | 'orders' | 'invoices'>('profile');

  useEffect(() => {
    if (isOpen && customerId) {
      setActiveTab('profile');
      fetchDetails();
    } else {
      setCustomer(null);
    }
  }, [isOpen, customerId]);

  const fetchDetails = async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await customerService.getCustomerById(customerId);
      setCustomer(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customer profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customer Profile" maxWidth="xl">
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-500">
          <LoadingSpinner size="lg" className="text-blue-600 mb-3" />
          <p className="text-sm font-medium">Loading customer profile...</p>
        </div>
      ) : error ? (
        <div className="py-10 text-center">
          <p className="text-sm text-red-600 font-medium mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchDetails}>
            Retry
          </Button>
        </div>
      ) : customer ? (
        <div className="space-y-5">
          {/* Top Header Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{customer.customer_name}</h3>
                  <CustomerStatusBadge status={customer.status} size="sm" />
                </div>
                {customer.company_name && (
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span>{customer.company_name}</span>
                  </div>
                )}
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  ID: {customer.id}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <RoleGuard action="customer:manage">
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onEdit(customer);
                  }}
                  className="flex items-center gap-1.5 text-xs text-slate-700"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </Button>
                <Button
                  variant={customer.status === 'ACTIVE' ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => {
                    onClose();
                    onToggleStatus(customer);
                  }}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Power className="w-3.5 h-3.5" />
                  {customer.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </RoleGuard>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'profile'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Customer Details
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
                activeTab === 'orders'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
              <span>Orders</span>
              <span className="text-[10px] bg-slate-100 text-slate-500 rounded px-1 ml-0.5">Mod 7</span>
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
                activeTab === 'sales'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Sales History</span>
              <span className="text-[10px] bg-slate-100 text-slate-500 rounded px-1 ml-0.5">Mod 7</span>
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
                activeTab === 'invoices'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-slate-400" />
              <span>Invoices</span>
              <span className="text-[10px] bg-slate-100 text-slate-500 rounded px-1 ml-0.5">Mod 8</span>
            </button>
          </div>

          {/* Profile Details Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact Card */}
                <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Contact Information
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-800">
                    <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="font-medium">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-800">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.alternate_phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>Alt: {customer.alternate_phone}</span>
                    </div>
                  )}
                  {customer.tax_number && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>GST/Tax: <strong className="font-semibold">{customer.tax_number}</strong></span>
                    </div>
                  )}
                </div>

                {/* Address Card */}
                <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Shipping & Billing Location
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-800">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-800">{customer.address}</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {customer.city}, {customer.state} - {customer.postal_code}
                      </p>
                      <p className="text-xs text-slate-500">{customer.country}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes / Special Instructions */}
              {customer.notes && (
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Customer Notes & Terms
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{customer.notes}</p>
                </div>
              )}

              {/* Timestamp Audit Trail */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Registered: {new Date(customer.created_at).toLocaleString()}
                </span>
                <span>Last Updated: {new Date(customer.updated_at).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Placeholders for Future Modules */}
          {activeTab === 'orders' && (
            <div className="py-12 text-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50">
              <ShoppingCart className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-800">Customer Orders (Upcoming Module 7)</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Sales orders and order tracking associated with {customer.customer_name} will automatically link here upon completing Module 7: Sales Management.
              </p>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="py-12 text-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50">
              <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-800">Sales History (Upcoming Module 7)</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Historical sales volume, outbound fulfillment, and product transactions will be aggregated here in Module 7.
              </p>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="py-12 text-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50">
              <Receipt className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-800">Invoices & Billing (Upcoming Module 8)</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Customer invoices, payment statuses, and accounts receivable (AR) records will appear here upon implementing Module 8.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
};
