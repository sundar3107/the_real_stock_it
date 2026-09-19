import { apiRequest } from '../../../services/apiClient';
import { ICategory, ICategoryFormData } from '../types/product.types';

export const categoryService = {
  async getCategories(includeInactive: boolean = false): Promise<ICategory[]> {
    const endpoint = includeInactive ? '/categories?include_inactive=true' : '/categories';
    const response = await apiRequest<ICategory[]>(endpoint, {
      method: 'GET',
    });
    return response.data || [];
  },

  async getCategoryById(id: string): Promise<ICategory> {
    const response = await apiRequest<ICategory>(`/categories/${id}`, {
      method: 'GET',
    });
    return response.data!;
  },

  async createCategory(data: ICategoryFormData): Promise<ICategory> {
    const response = await apiRequest<ICategory>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  async updateCategory(id: string, data: Partial<ICategoryFormData>): Promise<ICategory> {
    const response = await apiRequest<ICategory>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  async deactivateCategory(id: string): Promise<ICategory> {
    const response = await apiRequest<ICategory>(`/categories/${id}`, {
      method: 'DELETE',
    });
    return response.data!;
  },
};
