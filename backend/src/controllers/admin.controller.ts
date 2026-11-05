import { Request, Response, NextFunction } from 'express';
import { moderationService } from '../services/moderation.service';
import { sendPaginated, sendSuccess, sendError } from '../utils/api-response';

export class AdminController {
  getPendingEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;

      const result = await moderationService.getPendingEvents(page, limit);

      sendPaginated(
        res,
        result.data,
        result.pagination,
        'Pending events retrieved for moderation'
      );
    } catch (err) {
      next(err);
    }
  };

  approveEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const moderatorId = req.user!.id;
      const { notes } = req.body;

      const event = await moderationService.approveEvent(eventId, moderatorId, notes);

      sendSuccess(res, event, 'Event approved and published successfully');
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        sendError(res, err.message, 404);
        return;
      }
      next(err);
    }
  };

  rejectEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const moderatorId = req.user!.id;
      const { notes } = req.body;

      const event = await moderationService.rejectEvent(eventId, moderatorId, notes);

      sendSuccess(res, event, 'Event submission rejected with feedback');
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        sendError(res, err.message, 404);
        return;
      }
      next(err);
    }
  };
}

export const adminController = new AdminController();

