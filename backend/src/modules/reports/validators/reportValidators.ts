import { Request, Response, NextFunction } from 'express';

export function validateExportQuery(req: Request, res: Response, next: NextFunction): void {
  const { report_type, format } = req.query;
  const validReportTypes = ['inventory', 'sales', 'purchases', 'movement'];
  const validFormats = ['csv'];

  if (!report_type || !validReportTypes.includes(String(report_type))) {
    res.status(400).json({
      success: false,
      message: `Invalid or missing report_type. Allowed values: ${validReportTypes.join(', ')}`,
    });
    return;
  }

  if (format && !validFormats.includes(String(format).toLowerCase())) {
    res.status(400).json({
      success: false,
      message: `Invalid export format. Allowed formats: ${validFormats.join(', ')}`,
    });
    return;
  }

  next();
}

export function validateDateRange(req: Request, res: Response, next: NextFunction): void {
  const { start_date, end_date } = req.query;

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
