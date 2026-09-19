import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/ProductService';
import { IProductFilterQuery } from '../types/product.types';

export class ProductController {
  static getAll(req: Request, res: Response, next: NextFunction): void {
    try {
      const query: IProductFilterQuery = {
        search: req.query.search as string | undefined,
        category_id: req.query.category_id as string | undefined,
        status: req.query.status as any,
        stock_status: req.query.stock_status as any,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sort_by: req.query.sort_by as any,
        sort_order: req.query.sort_order as any,
      };

      const result = ProductService.getProducts(query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const productId = req.params.id as string;
      const product = ProductService.getProductById(productId);
      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static create(req: Request, res: Response, next: NextFunction): void {
    try {
      const product = ProductService.createProduct(req.body);
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static update(req: Request, res: Response, next: NextFunction): void {
    try {
      const productId = req.params.id as string;
      const product = ProductService.updateProduct(productId, req.body);
      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static delete(req: Request, res: Response, next: NextFunction): void {
    try {
      const productId = req.params.id as string;
      const product = ProductService.deactivateProduct(productId);
      res.status(200).json({
        success: true,
        message: 'Product deactivated successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
}
