import React, { useState, useEffect } from 'react';
import { ISupplier, ISupplierDetail } from '../types/supplier.types';
import { supplierService } from '../services/supplierService';
import { SupplierStatusBadge } from './SupplierStatusBadge';
import { RoleGuard } from '../../authentication/components/RoleGuard';
import { AssociateProductModal } from './AssociateProductModal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import {
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Package,
  ShoppingCart,
  Plus,
  Trash2,
  Clock,
  Edit2,
  Power,
} from 'lucide-react';

interface SupplierDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string | null;
  onEdit: (supplier: ISupplier) => void;
  onToggleStatus: (supplier: ISupplier) => void;
  onSupplierUpdated?: () => void;
}

export const SupplierDetailsModal: React.FC<SupplierDetailsModalProps> = ({
  isOpen,
  onClose,
  supplierId,
  onEdit,
  onToggleStatus,
  onSupplierUpdated,
}) => {
  const [supplier, setSupplier] = useState<ISupplierDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAssociateOpen, setIsAssociateOpen] = useState(false);

  const fetchDetails = async () => {
    if (!supplierId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await supplierService.getSupplierById(supplierId);
      setSupplier(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load supplier details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && supplierId) {
      fetchDetails();
    }
  }, [isOpen, supplierId]);

  if (!isOpen) return null;

  const handleDisassociate = async (productId: string) => {
    if (!supplier) return;
    if (!window.confirm('Remove this product association from the supplier?')) return;

    try {
      await supplierService.disassociateProduct(supplier.id, productId);
      fetchDetails();
      if (onSupplierUpdated) onSupplierUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to remove product association.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  {supplier?.supplier_name || 'Supplier Information'}
                </h3>
                {supplier && <SupplierStatusBadge status={supplier.status} size="sm" />}
              </div>
              <p className="text-xs text-slate-500">{supplier?.company_name || 'Vendor Profile'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <LoadingSpinner size="lg" className="text-blue-600 mb-3" />
            <p className="text-sm font-medium">Fetching supplier record...</p>
          </div>
        ) : error || !supplier ? (
          <div className="py-12 text-center text-rose-600 text-sm">
            {error || 'Supplier record could not be loaded.'}
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {/* Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              {/* Left Column: Contact & ID */}
              <div className="space-y-2.5">
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Supplier Reference ID</span>
                  <span className="font-mono font-medium text-slate-700 select-all">{supplier.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Primary Contact Person</span>
                  <span className="font-semibold text-slate-800 text-sm">{supplier.contact_person}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline">
                    {supplier.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{supplier.phone}</span>
                  {supplier.alternate_phone && (
                    <span className="text-slate-400">(Alt: {supplier.alternate_phone})</span>
                  )}
                </div>
              </div>

              {/* Right Column: Location & Tax */}
              <div className="space-y-2.5">
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Tax / GST Number</span>
                  <span className="font-medium text-slate-800">
                    {supplier.tax_number || 'Not registered / exempt'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Registered Facility Address</span>
                  <div className="flex items-start gap-1.5 text-slate-700 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>
                      {supplier.address}, {supplier.city}, {supplier.state}, {supplier.country} — {supplier.postal_code}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-500 pt-1 text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Created: {new Date(supplier.created_at).toLocaleDateString()}</span>
                  <span>&bull;</span>
                  <span>Updated: {new Date(supplier.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {supplier.notes && (
              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/70 text-xs text-amber-900">
                <div className="font-semibold flex items-center gap-1 mb-1 text-amber-800">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Vendor Notes & Terms</span>
                </div>
                <p className="leading-relaxed">{supplier.notes}</p>
              </div>
            )}

            {/* Products Supplied Section */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Associated Catalog Products ({supplier.products.length})</span>
                </div>
                <RoleGuard roles={['ADMIN', 'PURCHASE_MANAGER']}>
                  <button
                    onClick={() => setIsAssociateOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Link Product</span>
                  </button>
                </RoleGuard>
              </div>

              {supplier.products.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No catalog products linked to this supplier yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {supplier.products.map((p) => (
                    <div
                      key={p.product_id}
                      className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/50 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{p.product_name}</div>
                        <div className="text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>SKU: {p.sku}</span>
                          <span>&bull;</span>
                          <span>Category: {p.category_name || 'General'}</span>
                          <span>&bull;</span>
                          <span>Cost: ?{p.purchase_price} / {p.unit || 'pcs'}</span>
                        </div>
                      </div>

                      <RoleGuard roles={['ADMIN', 'PURCHASE_MANAGER']}>
                        <button
                          onClick={() => handleDisassociate(p.product_id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                          title="Remove product association"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </RoleGuard>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Future Integration Section: Purchase History Placeholder */}
            <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/40 text-xs text-slate-500">
              <div className="flex items-center gap-2 font-semibold text-slate-700 mb-1">
                <ShoppingCart className="w-4 h-4 text-slate-400" />
                <span>Purchase Orders & Historical Invoices</span>
              </div>
              <p className="text-slate-400 italic">
                Future Purchase Management module will link purchase orders, goods receipt notes (GRN), and delivery tracking here.
              </p>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <RoleGuard roles={['ADMIN', 'PURCHASE_MANAGER']}>
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(supplier);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      onToggleStatus(supplier);
                      onClose();
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                      supplier.status === 'ACTIVE'
                        ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{supplier.status === 'ACTIVE' ? 'Deactivate Supplier' : 'Activate Supplier'}</span>
                  </button>
                </RoleGuard>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Associate Product Sub-Modal */}
      <AssociateProductModal
        isOpen={isAssociateOpen}
        onClose={() => setIsAssociateOpen(false)}
        onSuccess={() => {
          fetchDetails();
          if (onSupplierUpdated) onSupplierUpdated();
        }}
        supplier={supplier}
      />
    </div>
  );
};
