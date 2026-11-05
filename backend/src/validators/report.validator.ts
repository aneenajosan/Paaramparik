import { z } from 'zod';
import { ReportCategory, ReportStatus } from '@prisma/client';

export const submitReportSchema = z.object({
  reportCategory: z.enum([
    ReportCategory.EVENT_DOES_NOT_EXIST,
    ReportCategory.INCORRECT_DATE_OR_TIME,
    ReportCategory.INCORRECT_LOCATION,
    ReportCategory.FAKE_ORGANIZER_OR_CONTACT,
    ReportCategory.MISLEADING_CULTURAL_INFO,
    ReportCategory.INCORRECT_DESCRIPTION,
    ReportCategory.DUPLICATE_EVENT,
    ReportCategory.BROKEN_REGISTRATION_LINK,
    ReportCategory.OTHER,
  ]),
  reportDescription: z.string().trim().min(10, 'Please describe the issue in at least 10 characters'),
  evidenceUrl: z.string().trim().url('Must be a valid URL').optional().or(z.literal('')),
  reporterContact: z.string().trim().optional(),
});

export const updateReportSchema = z.object({
  status: z.enum([
    ReportStatus.PENDING,
    ReportStatus.UNDER_REVIEW,
    ReportStatus.RESOLVED,
    ReportStatus.DISMISSED,
  ]),
  adminNotes: z.string().trim().optional(),
});

