import React, { useState, useEffect, useCallback } from 'react';
import { ICategory, IProduct, IProductFilterState, IProductFormData } from '../types/product.types';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { ProductFilters } from '../components/ProductFilters';
import { ProductTable } from '../components/ProductTable';
import { ProductFormModal } from '../components/ProductFormModal';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { CategoryManagerModal } from '../components/CategoryManagerModal';
import { ConfirmationDialog } from '../../../components/common/ConfirmationDialog';
import { RoleGuard } from '../../authentication/components/RoleGuard';
import { Button } from '../../../components/common/Button';
import { ErrorMessage } from '../../../components/common/ErrorMessage';
import { Package, Plus, FolderTree, CheckCircle2 } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Pagination State
  const [filters, setFilters] = useState<IProductFilterState>({
    search: '',
    category_id: 'ALL',
    status: 'ALL',
    stock_status: 'ALL',
    page: 1,
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Deactivation Confirmation State
  const [deactivatingProduct, setDeactivatingProduct] = useState<IProduct | null>(null);
  const [isDeactivateLoading, setIsDeactivateLoading] = useState(false);

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Failed to load categories', err);
    }
  };

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await productService.getProducts(filters);
      setProducts(result.items);
      setTotal(result.total);
      setTotalPages(result.total_pages);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleFilterChange = (newFilters: Partial<IProductFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category_id: 'ALL',
      status: 'ALL',
      stock_status: 'ALL',
      page: 1,
      limit: 10,
      sort_by: 'created_at',
      sort_order: 'desc',
    });
  };

  // Add Product Flow
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  // Edit Product Flow
  const handleOpenEdit = (product: IProduct) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  // View Details Flow
  const handleOpenView = (product: IProduct) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };

  // Form Submission (Add or Edit)
  const handleFormSubmit = async (formData: IProductFormData) => {
    if (editingProduct) {
      await productService.updateProduct(editingProduct.id, formData);
      setSuccessMessage(`Product '${formData.name}' updated successfully.`);
    } else {
      await productService.createProduct(formData);
      setSuccessMessage(`Product '${formData.name}' created successfully.`);
    }
    fetchProducts();
  };

  // Deactivate Flow
  const handleDeactivateConfirm = async () => {
    if (!deactivatingProduct) return;
    setIsDeactivateLoading(true);
    setError(null);

    try {
      await productService.deactivateProduct(deactivatingProduct.id);
      setSuccessMessage(`Product '${deactivatingProduct.name}' deactivated successfully.`);
      setDeactivatingProduct(null);
      fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate product');
    } finally {
      setIsDeactivateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Package className="w-7 h-7 text-blue-600" />
            <span>Product Catalog</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage product items, SKU identifiers, category classifications, and pricing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <FolderTree className="w-4 h-4 text-slate-500" />
            <span>Categories</span>
          </Button>

          <RoleGuard action="product:create">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </Button>
          </RoleGuard>
        </div>
      </div>

      {/* Alert Banners */}
      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {successMessage && (
        <div className="flex items-center justify-between p-3.5 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <ProductFilters
        filters={filters}
        categories={categories}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Product Table */}
      <ProductTable
        products={products}
        isLoading={isLoading}
        page={filters.page}
        totalPages={totalPages}
        total={total}
        limit={filters.limit}
        onPageChange={(page) => handleFilterChange({ page })}
        onView={handleOpenView}
        onEdit={handleOpenEdit}
        onDeactivate={(product) => setDeactivatingProduct(product)}
      />

      {/* Add / Edit Product Modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        product={editingProduct}
        categories={categories}
        isLoading={isLoading}
        onOpenCategoryManager={() => {
          setIsFormOpen(false);
          setIsCategoryModalOpen(true);
        }}
      />

      {/* Product Details Modal */}
      <ProductDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        product={selectedProduct}
        onEdit={(prod) => handleOpenEdit(prod)}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onCategoriesUpdated={() => {
          fetchCategories();
          fetchProducts();
        }}
      />

      {/* Deactivate Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deactivatingProduct}
        onClose={() => setDeactivatingProduct(null)}
        onConfirm={handleDeactivateConfirm}
        title="Deactivate Product"
        message={`Are you sure you want to deactivate '${deactivatingProduct?.name}' (SKU: ${deactivatingProduct?.sku})? Deactivated products will be preserved for historical records but unavailable for new orders.`}
        confirmText="Deactivate"
        variant="danger"
        isLoading={isDeactivateLoading}
      />
    </div>
  );
};
