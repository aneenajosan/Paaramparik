import { z } from 'zod';
import {
  ART_FORM_MAP,
  EVENT_TYPE_MAP,
  COST_TYPE_MAP,
  VERIFICATION_STATUS_MAP,
} from '../utils/formatters';

const validArtFormKeys = Object.keys(ART_FORM_MAP);
const validEventTypeKeys = Object.keys(EVENT_TYPE_MAP);
const validCostTypeKeys = Object.keys(COST_TYPE_MAP);
const validVerificationStatusKeys = Object.keys(VERIFICATION_STATUS_MAP);

// Custom date regex: YYYY-MM-DD
const ISO_DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function isValidCalendarDate(dateStr: string): boolean {
  if (!ISO_DATE_REGEX.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
}

export const eventFilterQuerySchema = z
  .object({
    artForm: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || validArtFormKeys.includes(val.toLowerCase()),
        (val) => ({
          message: `Invalid art form '${val}'. Allowed values: Music, Dance, Theatre, Visual Arts, Crafts, Literature, Traditional Ritual Arts`,
        })
      ),

    eventType: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || validEventTypeKeys.includes(val.toLowerCase()),
        (val) => ({
          message: `Invalid event type '${val}'. Allowed values: Festival, Workshop, Performance, Exhibition, Cultural Gathering, Heritage Event`,
        })
      ),

    cost: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || validCostTypeKeys.includes(val.toLowerCase()),
        (val) => ({
          message: `Invalid cost '${val}'. Allowed values: Free, Paid, Unknown`,
        })
      ),

    costType: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || validCostTypeKeys.includes(val.toLowerCase()),
        (val) => ({
          message: `Invalid costType '${val}'. Allowed values: Free, Paid, Unknown`,
        })
      ),

    locality: z.string().trim().min(1, 'Locality cannot be empty').optional(),
    neighborhood: z.string().trim().min(1, 'Neighborhood cannot be empty').optional(),

    latitude: z
      .preprocess((val) => (val !== undefined && val !== '' ? Number(val) : undefined), z.number().min(-90).max(90).optional())
      .describe('Latitude between -90 and 90'),

    longitude: z
      .preprocess((val) => (val !== undefined && val !== '' ? Number(val) : undefined), z.number().min(-180).max(180).optional())
      .describe('Longitude between -180 and 180'),

    radius: z
      .preprocess((val) => (val !== undefined && val !== '' ? Number(val) : undefined), z.number().positive('Radius must be a positive number in km').max(1000, 'Radius cannot exceed 1000 km').optional())
      .describe('Radius in kilometers'),

    date: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) =>
          !val ||
          val.toLowerCase() === 'today' ||
          val.toLowerCase() === 'upcoming' ||
          isValidCalendarDate(val),
        (val) => ({
          message: `Invalid date '${val}'. Must be 'today', 'upcoming', or a valid date in YYYY-MM-DD format`,
        })
      ),

    datePreset: z
      .enum(['today', 'upcoming'])
      .optional(),

    startDate: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || isValidCalendarDate(val),
        (val) => ({
          message: `Invalid startDate '${val}'. Must be a valid date in YYYY-MM-DD format`,
        })
      ),

    endDate: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || isValidCalendarDate(val),
        (val) => ({
          message: `Invalid endDate '${val}'. Must be a valid date in YYYY-MM-DD format`,
        })
      ),

    verificationStatus: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || validVerificationStatusKeys.includes(val.toLowerCase()),
        (val) => ({
          message: `Invalid verification status '${val}'. Allowed values: Verified, Community Submitted, Pending Verification`,
        })
      ),

    publicationStatus: z
      .enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'draft', 'published', 'archived'])
      .optional(),

    search: z.string().trim().optional(),
    q: z.string().trim().optional(),
    title: z.string().trim().optional(),

    page: z
      .preprocess((val) => (val !== undefined && val !== '' ? parseInt(String(val), 10) : 1), z.number().int().min(1, 'Page must be an integer >= 1'))
      .default(1),

    limit: z
      .preprocess((val) => (val !== undefined && val !== '' ? parseInt(String(val), 10) : 10), z.number().int().min(1, 'Limit must be >= 1').max(100, 'Limit cannot exceed 100'))
      .default(10),

    sortBy: z
      .enum(['date', 'relevance', 'distance', 'title', 'createdAt'])
      .default('date'),

    sortOrder: z
      .enum(['asc', 'desc'])
      .default('asc'),
  })
  .superRefine((data, ctx) => {
    // Coordinate consistency
    const hasLat = data.latitude !== undefined;
    const hasLon = data.longitude !== undefined;
    const hasRadius = data.radius !== undefined;

    if (hasLat !== hasLon) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Both latitude and longitude must be provided together',
        path: hasLat ? ['longitude'] : ['latitude'],
      });
    }

    if (hasRadius && (!hasLat || !hasLon)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Latitude and longitude are required when filtering by radius',
        path: ['radius'],
      });
    }

    // Distance sorting requires coordinates
    if (data.sortBy === 'distance' && (!hasLat || !hasLon)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Latitude and longitude are required when sorting by distance',
        path: ['sortBy'],
      });
    }

    // Date range consistency
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `startDate (${data.startDate}) cannot be after endDate (${data.endDate})`,
        path: ['startDate'],
      });
    }
  });

export const eventIdParamSchema = z.object({
  id: z.string().min(1, 'Event ID is required'),
});

export const createEventSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  culturalBackground: z.string().trim().optional(),
  artForm: z
    .string()
    .trim()
    .refine(
      (val) => validArtFormKeys.includes(val.toLowerCase()),
      (val) => ({ message: `Invalid artForm: ${val}` })
    ),
  eventType: z
    .string()
    .trim()
    .refine(
      (val) => validEventTypeKeys.includes(val.toLowerCase()),
      (val) => ({ message: `Invalid eventType: ${val}` })
    ),
  locality: z.string().trim().min(2, 'Locality is required'),
  neighborhood: z.string().trim().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  eventDate: z.string().refine(isValidCalendarDate, 'Must be valid date in YYYY-MM-DD format'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  costType: z
    .string()
    .optional()
    .refine(
      (val) => !val || validCostTypeKeys.includes(val.toLowerCase()),
      'Invalid costType'
    ),
  verificationStatus: z
    .string()
    .optional()
    .refine(
      (val) => !val || validVerificationStatusKeys.includes(val.toLowerCase()),
      'Invalid verificationStatus'
    ),
  organizerName: z.string().optional(),
  organizerContact: z.string().optional(),
  sourceUrl: z.string().url('Must be valid URL').optional().or(z.literal('')),
});

