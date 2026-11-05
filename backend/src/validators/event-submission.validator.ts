import { z } from 'zod';
import { ResourceType } from '@prisma/client';

const ISO_DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const checkDuplicateSchema = z.object({
  title: z.string().trim().min(3, 'Event title must be at least 3 characters'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  culturalBackground: z.string().trim().optional(),
  artForm: z.string().trim().optional(),
  eventType: z.string().trim().optional(),
  eventDate: z.string().trim().regex(ISO_DATE_REGEX, 'Must be valid date in YYYY-MM-DD format'),
  locality: z.string().trim().min(2, 'Locality is required'),
  organizerName: z.string().trim().optional(),
  excludeEventId: z.string().trim().optional(),
});

export const resourceItemSchema = z.object({
  resourceTitle: z.string().trim().min(2, 'Resource title must be at least 2 characters'),
  resourceType: z.enum([
    ResourceType.INSTAGRAM,
    ResourceType.FACEBOOK,
    ResourceType.WEBSITE,
    ResourceType.REGISTRATION,
    ResourceType.YOUTUBE,
    ResourceType.GOVERNMENT,
    ResourceType.OTHER,
  ]),
  resourceUrl: z.string().trim().url('Must be a valid HTTPS / HTTP URL'),
  description: z.string().trim().optional(),
});

export const createEventSubmissionSchema = z
  .object({
    title: z.string().trim().min(3, 'Event name must be at least 3 characters'),
    description: z.string().trim().min(20, 'Event description must be at least 20 characters'),
    culturalBackground: z.string().trim().min(10, 'Cultural background is required'),
    artForm: z.string().trim().min(2, 'Art Form is required'),
    eventType: z.string().trim().min(2, 'Event Category is required'),
    locality: z.string().trim().min(2, 'Locality is required'),
    neighborhood: z.string().trim().optional(),
    address: z.string().trim().min(5, 'Full address is required'),
    latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
    longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
    eventDate: z.string().trim().regex(ISO_DATE_REGEX, 'Event date must be in YYYY-MM-DD format'),
    eventEnd: z.string().trim().regex(ISO_DATE_REGEX, 'End date must be in YYYY-MM-DD format').optional(),
    startTime: z.string().trim().min(1, 'Start time is required (e.g. 18:00)'),
    endTime: z.string().trim().min(1, 'End time is required (e.g. 21:00)'),
    costType: z.string().trim().optional(),
    organizerName: z.string().trim().min(2, 'Organizer name is required'),
    organizerPhone: z.string().trim().optional(),
    organizerEmail: z.string().trim().optional(),
    phoneVerified: z.boolean().optional(),
    emailVerified: z.boolean().optional(),
    accessibility: z.string().trim().optional(),
    images: z.array(z.string().url()).optional(),
    resources: z
      .array(resourceItemSchema)
      .min(1, 'At least one supporting external resource link is required'),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms and conditions before submitting' }),
    }),
    termsVersion: z.string().trim().default('1.0'),
    submissionRef: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    // End time after start time if single day
    if (!data.eventEnd || data.eventDate === data.eventEnd) {
      if (data.startTime && data.endTime && data.endTime <= data.startTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endTime'],
          message: 'End time must be after start time',
        });
      }
    }

    // At least one contact info provided
    if (!data.organizerPhone && !data.organizerEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['organizerEmail'],
        message: 'At least one contact method (phone number or email address) must be provided',
      });
    }
  });

export const addResourceSchema = resourceItemSchema;

