import { Router } from 'express';
import { eventController } from '../controllers/event.controller';
import { reportController } from '../controllers/report.controller';
import { validateQuery, validateBody, validateParams } from '../middlewares/validate.middleware';
import { eventFilterQuerySchema, eventIdParamSchema } from '../validators/event.validator';
import {
  checkDuplicateSchema,
  createEventSubmissionSchema,
  addResourceSchema,
} from '../validators/event-submission.validator';
import { submitReportSchema } from '../validators/report.validator';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   GET /api/events/filter
 * @desc    Filter cultural events by multi-criteria (artForm, eventType, cost, date, location, radius, verification)
 * @access  Public
 */
router.get(
  '/filter',
  optionalAuthenticate,
  validateQuery(eventFilterQuerySchema),
  eventController.filterEvents
);

/**
 * @route   GET /api/events/filter-options
 * @desc    Get all available filter options, categories, and localities
 * @access  Public
 */
router.get(
  '/filter-options',
  eventController.getFilterOptions
);

/**
 * @route   POST /api/events/check-duplicate
 * @desc    Check whether proposed event is a duplicate using RAG semantic similarity
 * @access  Public / Authenticated
 */
router.post(
  '/check-duplicate',
  validateBody(checkDuplicateSchema),
  eventController.checkDuplicate
);

/**
 * @route   GET /api/events/my-submissions
 * @desc    Get current user's submitted events & statuses
 * @access  Authenticated
 */
router.get(
  '/my-submissions',
  authenticate,
  eventController.getMySubmissions
);

/**
 * @route   GET /api/events
 * @desc    Fetch all published cultural events with pagination and sorting
 * @access  Public
 */
router.get(
  '/',
  optionalAuthenticate,
  validateQuery(eventFilterQuerySchema),
  eventController.getEvents
);

/**
 * @route   POST /api/events
 * @desc    Submit a new cultural event listing
 * @access  Authenticated
 */
router.post(
  '/',
  authenticate,
  validateBody(createEventSubmissionSchema),
  eventController.createEvent
);

/**
 * @route   GET /api/events/:id
 * @desc    Get single cultural event details by ID
 * @access  Public
 */
router.get(
  '/:id',
  validateParams(eventIdParamSchema),
  eventController.getEventById
);

/**
 * @route   PUT /api/events/:id
 * @desc    Update an event submission if permitted
 * @access  Authenticated
 */
router.put(
  '/:id',
  authenticate,
  validateParams(eventIdParamSchema),
  eventController.updateSubmission
);

/**
 * @route   GET /api/events/:id/resources
 * @desc    Get external resources for an event
 * @access  Public
 */
router.get(
  '/:id/resources',
  validateParams(eventIdParamSchema),
  eventController.getResources
);

/**
 * @route   POST /api/events/:id/resources
 * @desc    Add external resource link to an event
 * @access  Authenticated
 */
router.post(
  '/:id/resources',
  authenticate,
  validateParams(eventIdParamSchema),
  validateBody(addResourceSchema),
  eventController.addResource
);

/**
 * @route   POST /api/events/:id/report
 * @desc    Report incorrect / misleading information for an event
 * @access  Public / Authenticated
 */
router.post(
  '/:id/report',
  optionalAuthenticate,
  validateParams(eventIdParamSchema),
  validateBody(submitReportSchema),
  reportController.submitReport
);

export default router;
