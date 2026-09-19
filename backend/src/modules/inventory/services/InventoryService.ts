import crypto from 'crypto';
import { db } from '../../../database/connection';
import { InventoryModel } from '../models/Inventory';
import { StockTransactionModel } from '../models/StockTransaction';
import { ProductModel } from '../../products/models/Product';
import { InventoryValidator } from '../validators/inventoryValidators';
import { AppError } from '../../authentication/services/AuthService';
import {
  IInventoryFilterQuery,
  IInventoryItem,
  IInventoryMetrics,
  IStockAdjustmentDto,
  IStockInDto,
  IStockOutDto,
  IStockTransaction,
  ITransactionFilterQuery,
} from '../types/inventory.types';
import { IPaginatedResult } from '../../products/types/product.types';

export class InventoryService {
  /**
   * Retrieve paginated inventory overview
   */
  static getStockOverview(query: IInventoryFilterQuery): IPaginatedResult<IInventoryItem> {
    return InventoryModel.findFiltered(query);
  }

  /**
   * Retrieve current inventory for a specific product
   */
  static getItemStock(productId: string): IInventoryItem {
    const product = ProductModel.findById(productId);
    if (!product) {
      throw new AppError(`Product with ID '${productId}' not found`, 404);
    }
    return InventoryModel.ensureInventoryRecord(productId);
  }

  /**
   * Perform Stock IN: Atomically increases stock and records immutable transaction
   */
  static stockIn(
    dto: IStockInDto,
    userId: string
  ): { inventory: IInventoryItem; transaction: IStockTransaction } {
    const validation = InventoryValidator.validateStockIn(dto);
    if (!validation.isValid) {
      throw new AppError('Stock IN validation failed', 400, validation.errors);
    }

    const product = ProductModel.findById(dto.product_id);
    if (!product) {
      throw new AppError(`Product with ID '${dto.product_id}' not found`, 404);
    }

    if (product.status !== 'ACTIVE') {
      throw new AppError(`Cannot receive stock for inactive product '${product.name}'`, 400);
    }

    const currentInventory = InventoryModel.ensureInventoryRecord(dto.product_id);
    const previousQuantity = currentInventory.current_quantity;
    const addQuantity = Math.floor(Number(dto.quantity));
    const newQuantity = previousQuantity + addQuantity;

    const transactionId = `tx_in_${crypto.randomBytes(6).toString('hex')}`;
    const reason = dto.reason?.trim() || 'Stock received / Inbound shipment';

    // Execute atomic balance update and audit logging
    const executeStockIn = () => {
      db.exec('BEGIN TRANSACTION;');
      try {
        InventoryModel.updateQuantity(dto.product_id, newQuantity);
        const transaction = StockTransactionModel.create({
          id: transactionId,
          product_id: dto.product_id,
          transaction_type: 'STOCK_IN',
          quantity: addQuantity,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          reason,
          reference: dto.reference || null,
          performed_by: userId,
        });
        db.exec('COMMIT;');
        const updatedInventory = InventoryModel.findByProductId(dto.product_id)!;
        return { inventory: updatedInventory, transaction };
      } catch (err) {
        db.exec('ROLLBACK;');
        throw err;
      }
    };

    return executeStockIn();
  }

  /**
   * Perform Stock OUT: Atomically checks stock sufficiency, deducts inventory, and records transaction
   */
  static stockOut(
    dto: IStockOutDto,
    userId: string
  ): { inventory: IInventoryItem; transaction: IStockTransaction } {
    const validation = InventoryValidator.validateStockOut(dto);
    if (!validation.isValid) {
      throw new AppError('Stock OUT validation failed', 400, validation.errors);
    }

    const product = ProductModel.findById(dto.product_id);
    if (!product) {
      throw new AppError(`Product with ID '${dto.product_id}' not found`, 404);
    }

    if (product.status !== 'ACTIVE') {
      throw new AppError(`Cannot issue stock for inactive product '${product.name}'`, 400);
    }

    const currentInventory = InventoryModel.ensureInventoryRecord(dto.product_id);
    const previousQuantity = currentInventory.current_quantity;
    const deductQuantity = Math.floor(Number(dto.quantity));

    // Enforce business rule: stock cannot become negative
    if (deductQuantity > previousQuantity) {
      throw new AppError(
        `Insufficient stock for '${product.name}'. Requested ${deductQuantity} ${product.unit}, but only ${previousQuantity} ${product.unit} available.`,
        400,
        { quantity: `Available stock is only ${previousQuantity}` }
      );
    }

    const newQuantity = previousQuantity - deductQuantity;
    const transactionId = `tx_out_${crypto.randomBytes(6).toString('hex')}`;
    const reason = dto.reason?.trim() || 'Stock issued / Outbound shipment';

    // Execute atomic balance update and audit logging
    const executeStockOut = () => {
      db.exec('BEGIN TRANSACTION;');
      try {
        InventoryModel.updateQuantity(dto.product_id, newQuantity);
        const transaction = StockTransactionModel.create({
          id: transactionId,
          product_id: dto.product_id,
          transaction_type: 'STOCK_OUT',
          quantity: deductQuantity,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          reason,
          reference: dto.reference || null,
          performed_by: userId,
        });
        db.exec('COMMIT;');
        const updatedInventory = InventoryModel.findByProductId(dto.product_id)!;
        return { inventory: updatedInventory, transaction };
      } catch (err) {
        db.exec('ROLLBACK;');
        throw err;
      }
    };

    return executeStockOut();
  }

  /**
   * Perform Stock Adjustment: Reconciles physical count with mandatory audit reason
   */
  static adjustStock(
    dto: IStockAdjustmentDto,
    userId: string
  ): { inventory: IInventoryItem; transaction: IStockTransaction } {
    const validation = InventoryValidator.validateAdjustment(dto);
    if (!validation.isValid) {
      throw new AppError('Stock adjustment validation failed', 400, validation.errors);
    }

    const product = ProductModel.findById(dto.product_id);
    if (!product) {
      throw new AppError(`Product with ID '${dto.product_id}' not found`, 404);
    }

    const currentInventory = InventoryModel.ensureInventoryRecord(dto.product_id);
    const previousQuantity = currentInventory.current_quantity;
    const inputQty = Math.floor(Number(dto.quantity));

    let newQuantity = previousQuantity;
    let deltaQuantity = 0;

    if (dto.adjustment_type === 'INCREASE') {
      newQuantity = previousQuantity + inputQty;
      deltaQuantity = inputQty;
    } else if (dto.adjustment_type === 'DECREASE') {
      if (inputQty > previousQuantity) {
        throw new AppError(
          `Cannot decrease stock by ${inputQty} units because current stock is only ${previousQuantity} units.`,
          400,
          { quantity: `Current stock is only ${previousQuantity}` }
        );
      }
      newQuantity = previousQuantity - inputQty;
      deltaQuantity = inputQty;
    } else if (dto.adjustment_type === 'SET_QUANTITY') {
      newQuantity = inputQty;
      deltaQuantity = Math.abs(newQuantity - previousQuantity);
    }

    const transactionId = `tx_adj_${crypto.randomBytes(6).toString('hex')}`;

    // Execute atomic balance update and audit logging
    const executeAdjustment = () => {
      db.exec('BEGIN TRANSACTION;');
      try {
        InventoryModel.updateQuantity(dto.product_id, newQuantity);
        const transaction = StockTransactionModel.create({
          id: transactionId,
          product_id: dto.product_id,
          transaction_type: 'ADJUSTMENT',
          quantity: deltaQuantity,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          reason: `[Adjustment: ${dto.adjustment_type}] ${dto.reason.trim()}`,
          reference: dto.reference || null,
          performed_by: userId,
        });
        db.exec('COMMIT;');
        const updatedInventory = InventoryModel.findByProductId(dto.product_id)!;
        return { inventory: updatedInventory, transaction };
      } catch (err) {
        db.exec('ROLLBACK;');
        throw err;
      }
    };

    return executeAdjustment();
  }

  /**
   * Retrieve append-only transaction history
   */
  static getTransactionHistory(query: ITransactionFilterQuery): IPaginatedResult<IStockTransaction> {
    return StockTransactionModel.findFiltered(query);
  }

  /**
   * Retrieve single transaction record
   */
  static getTransactionById(id: string): IStockTransaction {
    const tx = StockTransactionModel.findById(id);
    if (!tx) {
      throw new AppError(`Transaction record with ID '${id}' not found`, 404);
    }
    return tx;
  }

  /**
   * Retrieve inventory summary metrics
   */
  static getMetrics(): IInventoryMetrics {
    return InventoryModel.getMetrics();
  }
}
