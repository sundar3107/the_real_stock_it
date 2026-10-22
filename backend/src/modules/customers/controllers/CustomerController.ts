import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/CustomerService';
import { ICustomerFilterQuery } from '../types/customer.types';

export class CustomerController {
  static getAll(req: Request, res: Response, next: NextFunction): void {
    try {
      const query: ICustomerFilterQuery = {
        search: req.query.search as string | undefined,
        status: req.query.status as any,
        city: req.query.city as string | undefined,
        state: req.query.state as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sort_by: req.query.sort_by as any,
        sort_order: req.query.sort_order as any,
      };

      const result = CustomerService.getCustomers(query);
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
      const metrics = CustomerService.getMetrics();
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
      const customerId = req.params.id as string;
      const customer = CustomerService.getCustomerById(customerId);
      res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  static create(req: Request, res: Response, next: NextFunction): void {
    try {
      const customer = CustomerService.createCustomer(req.body, req.user?.userId);
      res.status(201).json({
        success: true,
        message: 'Customer registered successfully.',
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  static update(req: Request, res: Response, next: NextFunction): void {
    try {
      const customerId = req.params.id as string;
      const customer = CustomerService.updateCustomer(customerId, req.body, req.user?.userId);
      res.status(200).json({
        success: true,
        message: 'Customer updated successfully.',
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  static updateStatus(req: Request, res: Response, next: NextFunction): void {
    try {
      const customerId = req.params.id as string;
      const { status } = req.body;
      const customer = CustomerService.updateStatus(customerId, status);
      res.status(200).json({
        success: true,
        message: `Customer status changed to '${status}'.`,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  static delete(req: Request, res: Response, next: NextFunction): void {
    try {
      const customerId = req.params.id as string;
      const result = CustomerService.deleteCustomer(customerId);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.customer,
      });
    } catch (error) {
      next(error);
    }
  }
}
