import crypto from 'crypto';
import { CategoryModel } from '../models/Category';
import { ProductValidator } from '../validators/productValidators';
import { AppError } from '../../authentication/services/AuthService';
import { ICategory, ICreateCategoryDto, IUpdateCategoryDto } from '../types/product.types';

export class CategoryService {
  /**
   * Retrieve all categories
   */
  static getAllCategories(includeInactive: boolean = false): ICategory[] {
    return CategoryModel.findAll(includeInactive);
  }

  /**
   * Get category by unique ID
   */
  static getCategoryById(id: string): ICategory {
    const category = CategoryModel.findById(id);
    if (!category) {
      throw new AppError(`Category with ID '${id}' not found`, 404);
    }
    return category;
  }

  /**
   * Create a new category with duplicate name check
   */
  static createCategory(data: ICreateCategoryDto): ICategory {
    const validation = ProductValidator.validateCategoryCreate(data);
    if (!validation.isValid) {
      throw new AppError('Category validation failed', 400, validation.errors);
    }

    const existing = CategoryModel.findByName(data.name);
    if (existing) {
      throw new AppError(`Category '${data.name}' already exists`, 409, {
        name: 'A category with this name already exists',
      });
    }

    const categoryId = `cat_${crypto.randomBytes(6).toString('hex')}`;
    return CategoryModel.create({
      id: categoryId,
      name: data.name,
      description: data.description,
    });
  }

  /**
   * Update category
   */
  static updateCategory(id: string, data: IUpdateCategoryDto): ICategory {
    const validation = ProductValidator.validateCategoryUpdate(data);
    if (!validation.isValid) {
      throw new AppError('Category validation failed', 400, validation.errors);
    }

    const existing = CategoryModel.findById(id);
    if (!existing) {
      throw new AppError(`Category with ID '${id}' not found`, 404);
    }

    if (data.name && data.name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = CategoryModel.findByName(data.name);
      if (duplicate && duplicate.id !== id) {
        throw new AppError(`Category '${data.name}' already exists`, 409, {
          name: 'Another category with this name already exists',
        });
      }
    }

    const updated = CategoryModel.update(id, data);
    if (!updated) {
      throw new AppError('Failed to update category', 500);
    }
    return updated;
  }

  /**
   * Soft-deactivate a category
   */
  static deactivateCategory(id: string): ICategory {
    const existing = CategoryModel.findById(id);
    if (!existing) {
      throw new AppError(`Category with ID '${id}' not found`, 404);
    }

    // Check if active products are linked to this category
    const activeProducts = CategoryModel.countProductsByCategoryId(id);
    if (activeProducts > 0) {
      throw new AppError(
        `Cannot deactivate category: ${activeProducts} product(s) are currently categorized under it.`,
        400
      );
    }

    const deactivated = CategoryModel.deactivate(id);
    if (!deactivated) {
      throw new AppError('Failed to deactivate category', 500);
    }
    return deactivated;
  }
}
