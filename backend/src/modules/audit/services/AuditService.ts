class AuditError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AuditError.prototype);
  }
}
import { ActivityLogModel } from '../models/ActivityLog';
import {
  IActivityLog,
  IAuditFilterQuery,
  IAuditListResponse,
  IRecordActivityDto,
} from '../types/audit.types';

export class AuditService {
  /**
   * Safe, reusable audit logging hook.
   * Can be invoked across any module without causing failure to primary operations.
   */
  static recordActivity(dto: IRecordActivityDto): IActivityLog | null {
    try {
      return ActivityLogModel.create(dto);
    } catch (err) {
      console.error('[AuditService] Failed to record activity log:', err);
      return null;
    }
  }

  /**
   * Retrieve filtered and paginated activity logs (Admin restricted).
   */
  static getLogs(query: IAuditFilterQuery = {}): IAuditListResponse {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));

    const { logs, total } = ActivityLogModel.findFiltered({
      ...query,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      logs,
      total,
      page,
      limit,
      total_pages: totalPages,
    };
  }

  /**
   * Retrieve single activity log by ID.
   */
  static getLogById(id: string): IActivityLog {
    const log = ActivityLogModel.findById(id);
    if (!log) {
      throw new AuditError(`Audit log with ID '${id}' not found`, 404);
    }
    return log;
  }
}
