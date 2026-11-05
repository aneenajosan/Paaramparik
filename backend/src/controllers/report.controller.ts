import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service';
import { sendSuccess, sendError } from '../utils/api-response';

export class ReportController {
  submitReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const reporterId = req.user?.id;

      const report = await reportService.submitReport({
        eventId,
        reporterId,
        ...req.body,
      });

      sendSuccess(
        res,
        report,
        'Report submitted successfully. Our moderation team will investigate.',
        201
      );
    } catch (err: any) {
      if (err.message?.includes('already submitted recently')) {
        sendError(res, err.message, 429);
        return;
      }
      if (err.message?.includes('not found')) {
        sendError(res, err.message, 404);
        return;
      }
      next(err);
    }
  };

  getReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, category, page, limit } = req.query;
      const result = await reportService.getReports({
        status: status as any,
        category: category as any,
        page: page ? parseInt(String(page), 10) : undefined,
        limit: limit ? parseInt(String(limit), 10) : undefined,
      });

      sendSuccess(res, result.data, 'Reports fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  };

  updateReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const moderatorId = req.user!.id;

      const updated = await reportService.updateReportStatus(reportId, {
        moderatorId,
        ...req.body,
      });

      sendSuccess(res, updated, 'Report updated successfully');
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        sendError(res, err.message, 404);
        return;
      }
      next(err);
    }
  };
}

export const reportController = new ReportController();

