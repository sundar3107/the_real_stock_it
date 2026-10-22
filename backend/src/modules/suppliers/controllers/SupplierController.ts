import { Request, Response, NextFunction } from 'express';
import { SupplierService } from '../services/SupplierService';
import { ISupplierFilterQuery } from '../types/supplier.types';

export class SupplierController {
  static getAll(req: Request, res: Response, next: NextFunction): void {
    try {
      const query: ISupplierFilterQuery = {
        search: req.query.search as string | undefined,
        status: req.query.status as any,
        city: req.query.city as string | undefined,
        state: req.query.state as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sort_by: req.query.sort_by as any,
        sort_order: req.query.sort_order as any,
      };

      const result = SupplierService.getSuppliers(query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static getMetrics(req: Request, res: Response, next: NextFunction): void {
    try {
      const metrics = SupplierService.getMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  static getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const supplierId = req.params.id as string;
      const supplier = SupplierService.getSupplierById(supplierId);
      res.status(200).json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  static create(req: Request, res: Response, next: NextFunction): void {
    try {
      const supplier = SupplierService.createSupplier(req.body, req.user?.userId);
      res.status(201).json({
        success: true,
        message: 'Supplier registered successfully.',
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  static update(req: Request, res: Response, next: NextFunction): void {
    try {
      const supplierId = req.params.id as string;
      const supplier = SupplierService.updateSupplier(supplierId, req.body, req.user?.userId);
      res.status(200).json({
        success: true,
        message: 'Supplier updated successfully.',
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  static updateStatus(req: Request, res: Response, next: NextFunction): void {
    try {
      const supplierId = req.params.id as string;
      const { status } = req.body;
      const supplier = SupplierService.updateStatus(supplierId, status);
      res.status(200).json({
        success: true,
        message: `Supplier status changed to '${status}'.`,
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  static delete(req: Request, res: Response, next: NextFunction): void {
    try {
      const supplierId = req.params.id as string;
      const result = SupplierService.deleteSupplier(supplierId);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  static getProducts(req: Request, res: Response, next: NextFunction): void {
    try {
      const supplierId = req.params.id as string;
      const products = SupplierService.getSupplierProducts(supplierId);
      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  static associateProducts(req: Request, res: Response, next: NextFunction): void {
    try {
      const supplierId = req.params.id as string;
      const { product_ids } = req.body;
      const products = SupplierService.associateProducts(supplierId, product_ids);
      res.status(200).json({
        success: true,
        message: 'Products associated with supplier successfully.',
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  static disassociateProduct(req: Request, res: Response, next: NextFunction): void {
    try {
      const supplierId = req.params.id as string;
      const productId = req.params.productId as string;
      const result = SupplierService.disassociateProduct(supplierId, productId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
