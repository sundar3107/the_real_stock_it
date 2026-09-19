import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/CategoryService';

export class CategoryController {
  static getAll(req: Request, res: Response, next: NextFunction): void {
    try {
      const includeInactive = req.query.include_inactive === 'true';
      const categories = CategoryService.getAllCategories(includeInactive);
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  static getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const categoryId = req.params.id as string;
      const category = CategoryService.getCategoryById(categoryId);
      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  static create(req: Request, res: Response, next: NextFunction): void {
    try {
      const category = CategoryService.createCategory(req.body);
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  static update(req: Request, res: Response, next: NextFunction): void {
    try {
      const categoryId = req.params.id as string;
      const category = CategoryService.updateCategory(categoryId, req.body);
      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  static delete(req: Request, res: Response, next: NextFunction): void {
    try {
      const categoryId = req.params.id as string;
      const category = CategoryService.deactivateCategory(categoryId);
      res.status(200).json({
        success: true,
        message: 'Category deactivated successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }
}
