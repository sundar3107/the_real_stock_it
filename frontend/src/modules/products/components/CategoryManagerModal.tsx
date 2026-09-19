import React, { useState, FormEvent } from 'react';
import { ICategory, ICategoryFormData } from '../types/product.types';
import { categoryService } from '../services/categoryService';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { ErrorMessage } from '../../../components/common/ErrorMessage';
import { Layers, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ICategory[];
  onCategoriesUpdated: () => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCategoriesUpdated,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleStartAdd = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setIsAdding(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleStartEdit = (category: ICategory) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || '');
    setIsAdding(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingCategory(null);
    setName('');
    setDescription('');
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
        setSuccessMessage('Category updated successfully');
      } else {
        await categoryService.createCategory({
          name: name.trim(),
          description: description.trim() || undefined,
        });
        setSuccessMessage('Category created successfully');
      }
      setIsAdding(false);
      setEditingCategory(null);
      setName('');
      setDescription('');
      onCategoriesUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this category?')) return;

    setIsLoading(true);
    setError(null);
    try {
      await categoryService.deactivateCategory(id);
      setSuccessMessage('Category deactivated successfully');
      onCategoriesUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate category');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Product Categories Management" maxWidth="xl">
      <div className="space-y-4">
        <ErrorMessage message={error} onDismiss={() => setError(null)} />

        {successMessage && (
          <div className="flex items-center gap-2 p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {isAdding ? (
          <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-bold text-slate-800">
              {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add New Category'}
            </h4>

            <Input
              label="Category Name *"
              placeholder="e.g., Audio Equipment"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Optional description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={handleCancelForm} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
                {editingCategory ? 'Update Category' : 'Save Category'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Existing Categories ({categories.length})
            </span>
            <Button type="button" variant="primary" size="sm" onClick={handleStartAdd}>
              <Plus className="w-4 h-4 mr-1" />
              Add Category
            </Button>
          </div>
        )}

        {/* Category List */}
        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
          {categories.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No categories found</div>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{cat.name}</div>
                  {cat.description && <div className="text-xs text-slate-500 mt-0.5">{cat.description}</div>}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(cat)}
                    className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit Category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {cat.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => handleDeactivate(cat.id)}
                      className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Deactivate Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
