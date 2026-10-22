import { Request, Response, NextFunction } from 'express';

export function validateNotificationQuery(req: Request, res: Response, next: NextFunction): void {
  const { page, limit, is_read, type } = req.query;

  if (page !== undefined && (isNaN(Number(page)) || Number(page) < 1)) {
    res.status(400).json({
      success: false,
      message: 'Query parameter "page" must be a positive integer.',
    });
    return;
  }

  if (limit !== undefined && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    res.status(400).json({
      success: false,
      message: 'Query parameter "limit" must be an integer between 1 and 100.',
    });
    return;
  }

  if (
    is_read !== undefined &&
    is_read !== '' &&
    !['true', 'false', '0', '1'].includes(String(is_read).toLowerCase())
  ) {
    res.status(400).json({
      success: false,
      message: 'Query parameter "is_read" must be a boolean or 0/1.',
    });
    return;
  }

  const validTypes = [
    'LOW_STOCK',
    'OUT_OF_STOCK',
    'PURCHASE_ORDER',
    'SALES_ORDER',
    'INVOICE',
    'SYSTEM',
  ];

  if (type !== undefined && type !== '' && !validTypes.includes(String(type))) {
    res.status(400).json({
      success: false,
      message: `Query parameter "type" must be one of: ${validTypes.join(', ')}`,
    });
    return;
  }

  next();
}
