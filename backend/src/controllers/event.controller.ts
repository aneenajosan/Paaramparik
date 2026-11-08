import { Request, Response, NextFunction } from 'express';
import { EventService, eventService as defaultEventService } from '../services/event.service';
import { ragDuplicateService } from '../services/rag-duplicate.service';
import { sendPaginated, sendSuccess, sendError } from '../utils/api-response';
import { EventFilterQuery } from '../types/event.types';
import { UserRole } from '@prisma/client';

export class EventController {
  constructor(private service: EventService = defaultEventService) {}

  /**
   * GET /api/events/filter
   * Advanced multi-criteria filtering endpoint
   */
  filterEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as EventFilterQuery;
      const isAdmin = req.user?.role === UserRole.ADMIN;

      const result = await this.service.filterEvents(query, isAdmin);

      sendPaginated(
        res,
        result.data,
        result.pagination,
        'Events filtered successfully'
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/events
   * Fetch all published events with optional pagination, search, and sorting
   */
  getEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as EventFilterQuery;
      const isAdmin = req.user?.role === UserRole.ADMIN;

      const result = await this.service.filterEvents(query, isAdmin);

      sendPaginated(
        res,
        result.data,
        result.pagination,
        'Events fetched successfully'
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/events/filter-options
   * Returns available filter options, categories, and active localities
   */
  getFilterOptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const options = await this.service.getFilterOptions();
      sendSuccess(res, options, 'Filter options fetched successfully');
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/events/:id
   * Fetch a single event's details by ID
   */
  getEventById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const event = await this.service.getEventById(id);

      if (!event) {
        sendError(res, `Event not found with ID: ${id}`, 404);
        return;
      }

      sendSuccess(res, event, 'Event retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/events/check-duplicate
   * RAG-based semantic similarity & metadata duplicate prevention
   */
  checkDuplicate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await ragDuplicateService.checkDuplicate(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/events
   * Submit new event with contact verification, resources, duplicate check & terms acceptance
   */
  createEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await this.service.createEventSubmission(req.body, userId);

      res.status(201).json({
        success: true,
        message: 'Event submitted successfully. Awaiting admin review.',
        data: {
          eventId: result.eventId,
          status: result.status,
          phoneVerified: result.phoneVerified,
          emailVerified: result.emailVerified,
        },
      });
    } catch (err: any) {
      if (
        err.message?.includes('duplicate') ||
        err.message?.includes('Terms') ||
        err.message?.includes('verification') ||
        err.message?.includes('resource')
      ) {
        sendError(res, err.message, 400);
        return;
      }
      next(err);
    }
  };

  /**
   * GET /api/events/my-submissions
   * Fetch submissions created by authenticated user
   */
  getMySubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const submissions = await this.service.getMySubmissions(userId);
      sendSuccess(res, submissions, 'User submissions retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  /**
   * PUT /api/events/:id
   * Update submission if permitted
   */
  updateSubmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const userId = req.user!.id;
      const isAdmin = req.user!.role === UserRole.ADMIN;

      const updated = await this.service.updateSubmission(id, userId, req.body, isAdmin);
      sendSuccess(res, updated, 'Event submission updated successfully');
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        sendError(res, err.message, 404);
        return;
      }
      if (err.message?.includes('permission')) {
        sendError(res, err.message, 403);
        return;
      }
      if (err.message?.includes('Published events cannot be edited')) {
        sendError(res, err.message, 400);
        return;
      }
      next(err);
    }
  };

  /**
   * GET /api/events/:id/resources
   * Get resources for an event
   */
  getResources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const resources = await this.service.getEventResources(id);
      sendSuccess(res, resources, 'Event resources retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/events/:id/resources
   * Add a resource link to an event
   */
  addResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const resource = await this.service.addEventResource(id, req.body);
      sendSuccess(res, resource, 'Event resource added successfully', 201);
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        sendError(res, err.message, 404);
        return;
      }
      next(err);
    }
  };

  /**
   * DELETE /api/events/:id
   * Delete an event by ID
   */
  deleteEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await this.service.deleteEvent(id);
      sendSuccess(res, result, 'Event deleted successfully');
    } catch (err) {
      next(err);
    }
  };
}

export const eventController = new EventController();
