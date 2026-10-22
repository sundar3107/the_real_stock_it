import { Request, Response, NextFunction } from 'express';

export function validateAuditQuery(req: Request, res: Response, next: NextFunction): void {
  const { page, limit, start_date, end_date } = req.query;

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

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (start_date && !dateRegex.test(String(start_date))) {
    res.status(400).json({
      success: false,
      message: 'Invalid start_date format. Expected YYYY-MM-DD.',
    });
    return;
  }

  if (end_date && !dateRegex.test(String(end_date))) {
    res.status(400).json({
      success: false,
      message: 'Invalid end_date format. Expected YYYY-MM-DD.',
    });
    return;
  }

  if (start_date && end_date && String(start_date) > String(end_date)) {
    res.status(400).json({
      success: false,
      message: 'start_date cannot be later than end_date.',
    });
    return;
  }

  next();
}
