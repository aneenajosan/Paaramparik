import { z } from 'zod';

export const moderationActionSchema = z.object({
  notes: z.string().trim().optional(),
});

export const rejectEventSchema = z.object({
  notes: z.string().trim().min(5, 'Rejection feedback reason is required (at least 5 characters)'),
});

