import crypto from 'crypto';
import { ProductModel } from '../models/Product';
import { CategoryModel } from '../models/Category';
import { ProductValidator } from '../validators/productValidators';
import { AppError } from '../../authentication/services/AuthService';
import { AuditService } from '../../audit/services/AuditService';
import {
  ICreateProductDto,
  IProduct,
  IProductFilterQuery,
  IPaginatedResult,
  IUpdateProductDto,
} from '../types/product.types';

export class ProductService {
  /**
   * Query filtered, searched, and paginated products
   */
  static getProducts(query: IProductFilterQuery): IPaginatedResult<IProduct> {
    return ProductModel.findFiltered(query);
  }

  /**
   * Get single product by ID
   */
  static getProductById(id: string): IProduct {
    const product = ProductModel.findById(id);
    if (!product) {
      throw new AppError(`Product with ID '${id}' not found`, 404);
    }
    return product;
  }

  /**
   * Create a new product in the catalog
   */
  static createProduct(data: ICreateProductDto, userId?: string): IProduct {
    const validation = ProductValidator.validateCreate(data);
    if (!validation.isValid) {
      throw new AppError('Product validation failed', 400, validation.errors);
    }

    // Verify category exists
    const category = CategoryModel.findById(data.category_id);
    if (!category) {
      throw new AppError(`Selected category does not exist`, 400, {
        category_id: 'Category not found',
      });
    }

    // Verify SKU uniqueness
    const existingSku = ProductModel.findBySku(data.sku);
    if (existingSku) {
      throw new AppError(`Product with SKU '${data.sku.toUpperCase()}' already exists`, 409, {
        sku: 'SKU is already in use by another product',
      });
    }

    const openingStock = data.opening_stock !== undefined ? Math.max(0, Math.floor(Number(data.opening_stock))) : 0;
    const reorderLevel = data.reorder_level !== undefined ? Math.max(0, Math.floor(Number(data.reorder_level))) : 10;
    const purchasePrice = Number(data.purchase_price);
    const sellingPrice = Number(data.selling_price);

    const productId = `prd_${crypto.randomBytes(6).toString('hex')}`;

    const product = ProductModel.create({
      id: productId,
      name: data.name,
      sku: data.sku,
      category_id: data.category_id,
      description: data.description,
      unit: data.unit || 'pcs',
      purchase_price: purchasePrice,
      selling_price: sellingPrice,
      opening_stock: openingStock,
      current_stock: openingStock, // Initial stock baseline
      reorder_level: reorderLevel,
      status: data.status || 'ACTIVE',
    });

    AuditService.recordActivity({
      user_id: userId,
      action: 'CREATE',
      module: 'PRODUCT',
      entity_type: 'PRODUCT',
      entity_id: product.id,
      description: `Created product "${product.name}" (SKU: ${product.sku})`,
      new_value: {
        name: product.name,
        sku: product.sku,
        selling_price: product.selling_price,
        current_stock: product.current_stock,
      },
    });

    return product;

  }

  /**
   * Update master product attributes.
   * NOTE: Does not manipulate inventory balances directly, maintaining low coupling
   * with the future Inventory management module.
   */
  static updateProduct(id: string, data: IUpdateProductDto, userId?: string): IProduct {
    const validation = ProductValidator.validateUpdate(data);
    if (!validation.isValid) {
      throw new AppError('Product update validation failed', 400, validation.errors);
    }

    const existing = ProductModel.findById(id);
    if (!existing) {
      throw new AppError(`Product with ID '${id}' not found`, 404);
    }

    // If updating category, check category existence
    if (data.category_id && data.category_id !== existing.category_id) {
      const category = CategoryModel.findById(data.category_id);
      if (!category) {
        throw new AppError(`Category '${data.category_id}' not found`, 400, {
          category_id: 'Invalid category selected',
        });
      }
    }

    // If updating SKU, check SKU uniqueness
    if (data.sku && data.sku.trim().toUpperCase() !== existing.sku.toUpperCase()) {
      const duplicateSku = ProductModel.findBySku(data.sku);
      if (duplicateSku && duplicateSku.id !== id) {
        throw new AppError(`SKU '${data.sku.toUpperCase()}' is already in use`, 409, {
          sku: 'SKU is already registered to another product',
        });
      }
    }

    const updated = ProductModel.update(id, data);
    if (!updated) {
      throw new AppError('Failed to update product', 500);
    }
    AuditService.recordActivity({
      user_id: userId,
      action: 'UPDATE',
      module: 'PRODUCT',
      entity_type: 'PRODUCT',
      entity_id: updated.id,
      description: `Updated product "${updated.name}" (SKU: ${updated.sku})`,
      old_value: { name: existing.name, sku: existing.sku, purchase_price: existing.purchase_price, selling_price: existing.selling_price, status: existing.status },
      new_value: { name: updated.name, sku: updated.sku, purchase_price: updated.purchase_price, selling_price: updated.selling_price, status: updated.status },
    });

    return updated;
  }

  /**
   * Soft-deactivate product to preserve historical transaction relationships.
   */
  static deactivateProduct(id: string, userId?: string): IProduct {
    const existing = ProductModel.findById(id);
    if (!existing) {
      throw new AppError(`Product with ID '${id}' not found`, 404);
    }

    const deactivated = ProductModel.deactivate(id);
    if (!deactivated) {
      throw new AppError('Failed to deactivate product', 500);
    }
    AuditService.recordActivity({
      user_id: userId,
      action: 'DEACTIVATE',
      module: 'PRODUCT',
      entity_type: 'PRODUCT',
      entity_id: deactivated.id,
      description: `Deactivated product "${deactivated.name}" (SKU: ${deactivated.sku})`,
      old_value: { status: existing.status },
      new_value: { status: 'INACTIVE' },
    });

    return deactivated;
  }
}
