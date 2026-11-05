import { z } from 'zod';
import { ContactType } from '@prisma/client';

export const sendOtpSchema = z.object({
  contactType: z.enum([ContactType.PHONE, ContactType.EMAIL]),
  contactValue: z.string().trim().min(3, 'Contact value is required'),
  submissionRef: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  if (data.contactType === ContactType.EMAIL) {
    const emailResult = z.string().email().safeParse(data.contactValue);
    if (!emailResult.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contactValue'],
        message: 'Invalid email address format',
      });
    }
  } else if (data.contactType === ContactType.PHONE) {
    const cleaned = data.contactValue.replace(/[\s\-()+]/g, '');
    if (cleaned.length < 7 || cleaned.length > 15 || !/^\d+$/.test(cleaned)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contactValue'],
        message: 'Invalid phone number format. Must contain 7-15 digits.',
      });
    }
  }
});

export const verifyOtpSchema = z.object({
  contactType: z.enum([ContactType.PHONE, ContactType.EMAIL]),
  contactValue: z.string().trim().min(3, 'Contact value is required'),
  otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
  submissionRef: z.string().trim().optional(),
});

export const resendOtpSchema = sendOtpSchema;

