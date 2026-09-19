import React from 'react';
import { StockStatus } from '../types/inventory.types';

interface StockStatusBadgeProps {
  status: StockStatus;
  quantity?: number;
  unit?: string;
  showQuantity?: boolean;
}

export const StockStatusBadge: React.FC<StockStatusBadgeProps> = ({
  status,
  quantity = 0,
  unit = 'pcs',
  showQuantity = true,
}) => {
  switch (status) {
    case 'OUT_OF_STOCK':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {showQuantity ? `0 ${unit} (Out of Stock)` : 'Out of Stock'}
        </span>
      );
    case 'LOW_STOCK':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          {showQuantity ? `${quantity} ${unit} (Low Stock)` : 'Low Stock'}
        </span>
      );
    case 'IN_STOCK':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {showQuantity ? `${quantity} ${unit}` : 'In Stock'}
        </span>
      );
  }
};
