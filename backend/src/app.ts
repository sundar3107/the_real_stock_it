import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env';
import authRoutes from './modules/authentication/routes/authRoutes';
import productRoutes from './modules/products/routes/productRoutes';
import categoryRoutes from './modules/products/routes/categoryRoutes';
import inventoryRoutes from './modules/inventory/routes/inventoryRoutes';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Application {
  const app = express();

  // Middleware configuration
  app.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // System Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Stock Management System API',
      module: 'Module 1: User Authentication, Module 2: Products & Module 3: Inventory',
    });
  });

  // Module Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/inventory', inventoryRoutes);

  // Catch-all 404 handler for unrecognized routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `API endpoint '${req.method} ${req.originalUrl}' not found.`,
    });
  });

  // Centralized error handling
  app.use(errorHandler);

  return app;
}

export default createApp;
