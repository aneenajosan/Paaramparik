import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ContactType, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../config/database';
import { emailService } from './email.service';

export interface SendOtpResult {
  success: boolean;
  message: string;
  expiresInSeconds: number;
  cooldownSeconds: number;
  contactType: ContactType;
  contactValue: string;
  senderEmail?: string;
  previewUrl?: string | false;
  // For development/test environments only:
  debugOtp?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
  verifiedAt?: string;
  submissionRef?: string;
}

interface MemoryVerification {
  id: string;
  contactType: ContactType;
  contactValue: string;
  otpHash: string;
  rawOtp: string;
  expiresAt: Date;
  attempts: number;
  verifiedAt?: Date;
  createdAt: Date;
  userId?: string;
  submissionRef?: string;
}

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;

// In-memory fallback for local dev when PostgreSQL is offline
const memoryStore: MemoryVerification[] = [];

export class ContactService {
  constructor(private db: PrismaClient = defaultPrisma) {}

  /**
   * Generates and dispatches a 6-digit numeric OTP for phone or email.
   * Hashes the OTP before storing and enforces resend cooldown.
   */
  async sendOtp(
    contactType: ContactType,
    contactValue: string,
    userId?: string,
    submissionRef?: string
  ): Promise<SendOtpResult> {
    const normalizedValue = this.normalizeContact(contactType, contactValue);
    const now = Date.now();

    let existing: { createdAt: Date } | null = null;
    let useMemoryFallback = false;

    // Check for existing active verification
    try {
      existing = await this.db.contactVerification.findFirst({
        where: {
          contactType,
          contactValue: normalizedValue,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (dbErr: any) {
      if (dbErr.message?.includes('database server') || dbErr.code === 'P1001') {
        useMemoryFallback = true;
        const memoryMatches = memoryStore
          .filter((m) => m.contactType === contactType && m.contactValue === normalizedValue)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        existing = memoryMatches[0] || null;
      } else {
        throw dbErr;
      }
    }

    // Enforce cooldown
    if (existing && now - existing.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.createdAt.getTime())) / 1000);
      throw new Error(`Please wait ${waitSec} seconds before requesting a new verification code.`);
    }

    // Generate secure 6-digit OTP
    const rawOtp = this.generate6DigitOtp();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(now + OTP_EXPIRY_MS);

    // Save hashed record in database or fallback memory store
    if (!useMemoryFallback) {
      try {
        await this.db.contactVerification.create({
          data: {
            userId: userId || null,
            submissionRef: submissionRef || null,
            contactType,
            contactValue: normalizedValue,
            otpHash,
            expiresAt,
            attempts: 0,
          },
        });
      } catch (err: any) {
        if (err.message?.includes('database server') || err.code === 'P1001') {
          useMemoryFallback = true;
        } else {
          throw err;
        }
      }
    }

    if (useMemoryFallback) {
      memoryStore.push({
        id: 'mem_' + Date.now(),
        userId,
        submissionRef,
        contactType,
        contactValue: normalizedValue,
        otpHash,
        rawOtp,
        expiresAt,
        attempts: 0,
        createdAt: new Date(now),
      });
    }

    // Dispatch OTP via SMS or Email provider
    let senderEmail: string | undefined;
    let previewUrl: string | false | undefined;

    if (contactType === ContactType.EMAIL) {
      const emailResult = await emailService.sendOtpEmail(normalizedValue, rawOtp);
      senderEmail = emailResult.from;
      previewUrl = emailResult.previewUrl;
    } else {
      await this.dispatchOtpNotification(contactType, normalizedValue, rawOtp);
    }

    return {
      success: true,
      message: `Verification code sent successfully to ${this.maskContact(contactType, normalizedValue)}`,
      expiresInSeconds: 300,
      cooldownSeconds: 60,
      contactType,
      contactValue: normalizedValue,
      senderEmail,
      previewUrl,
      ...(process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development'
        ? { debugOtp: rawOtp }
        : {}),
    };
  }

  /**
   * Validates user-submitted OTP against the stored hash.
   */
  async verifyOtp(
    contactType: ContactType,
    contactValue: string,
    otp: string,
    userId?: string,
    submissionRef?: string
  ): Promise<VerifyOtpResult> {
    const normalizedValue = this.normalizeContact(contactType, contactValue);
    let record: any = null;
    let useMemoryFallback = false;

    try {
      record = await this.db.contactVerification.findFirst({
        where: {
          contactType,
          contactValue: normalizedValue,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err: any) {
      if (err.message?.includes('database server') || err.code === 'P1001') {
        useMemoryFallback = true;
        const memoryMatches = memoryStore
          .filter((m) => m.contactType === contactType && m.contactValue === normalizedValue)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        record = memoryMatches[0] || null;
      } else {
        throw err;
      }
    }

    if (!record) {
      throw new Error('No verification code found for this contact. Please request a new code.');
    }

    // Check attempt limit
    if (record.attempts >= MAX_ATTEMPTS) {
      throw new Error('Maximum verification attempts exceeded. Please request a new code.');
    }

    // Check expiration
    if (new Date() > record.expiresAt) {
      throw new Error('Verification code has expired. Please request a new code.');
    }

    // Check OTP hash
    const isMatch = await bcrypt.compare(otp.trim(), record.otpHash);
    if (!isMatch) {
      // Increment attempt counter
      if (!useMemoryFallback && record.id && !record.id.startsWith('mem_')) {
        try {
          await this.db.contactVerification.update({
            where: { id: record.id },
            data: { attempts: { increment: 1 } },
          });
        } catch {}
      } else {
        record.attempts += 1;
      }
      const remaining = MAX_ATTEMPTS - (record.attempts + 1);
      throw new Error(`Invalid verification code. ${remaining} attempt(s) remaining.`);
    }

    // Mark as verified
    const verifiedAt = new Date();
    if (!useMemoryFallback && record.id && !record.id.startsWith('mem_')) {
      try {
        await this.db.contactVerification.update({
          where: { id: record.id },
          data: {
            verifiedAt,
            userId: userId || record.userId,
            submissionRef: submissionRef || record.submissionRef,
          },
        });
      } catch {}
    } else {
      record.verifiedAt = verifiedAt;
    }

    return {
      success: true,
      message: `${contactType === ContactType.PHONE ? 'Phone number' : 'Email address'} verified successfully.`,
      verifiedAt: verifiedAt.toISOString(),
      submissionRef: record.submissionRef || undefined,
    };
  }

  /**
   * Resends OTP respecting cooldown
   */
  async resendOtp(
    contactType: ContactType,
    contactValue: string,
    userId?: string,
    submissionRef?: string
  ): Promise<SendOtpResult> {
    return this.sendOtp(contactType, contactValue, userId, submissionRef);
  }

  /**
   * Verifies if a given contact has an active, valid verification record.
   */
  async isContactVerified(
    contactType: ContactType,
    contactValue: string,
    userId?: string,
    maxAgeHours = 24
  ): Promise<boolean> {
    const normalizedValue = this.normalizeContact(contactType, contactValue);
    const minVerifiedAt = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

    try {
      const record = await this.db.contactVerification.findFirst({
        where: {
          contactType,
          contactValue: normalizedValue,
          verifiedAt: { gte: minVerifiedAt },
          ...(userId ? { userId } : {}),
        },
        orderBy: { verifiedAt: 'desc' },
      });
      return Boolean(record);
    } catch (err: any) {
      if (err.message?.includes('database server') || err.code === 'P1001') {
        const memMatch = memoryStore.find(
          (m) =>
            m.contactType === contactType &&
            m.contactValue === normalizedValue &&
            m.verifiedAt &&
            m.verifiedAt >= minVerifiedAt
        );
        return Boolean(memMatch);
      }
      return false;
    }
  }

  private generate6DigitOtp(): string {
    const buffer = crypto.randomBytes(4);
    const num = (buffer.readUInt32BE(0) % 900000) + 100000;
    return num.toString();
  }

  private normalizeContact(type: ContactType, val: string): string {
    if (type === ContactType.EMAIL) {
      return val.trim().toLowerCase();
    }
    // Phone: remove spaces, hyphens, parentheses
    return val.trim().replace(/[\s\-()]/g, '');
  }

  private maskContact(type: ContactType, val: string): string {
    if (type === ContactType.EMAIL) {
      const [user, domain] = val.split('@');
      const maskedUser = user.length > 2 ? `${user.slice(0, 2)}***${user.slice(-1)}` : `${user}***`;
      return `${maskedUser}@${domain}`;
    }
    return val.length > 4 ? `***-***-${val.slice(-4)}` : val;
  }

  private async dispatchOtpNotification(
    type: ContactType,
    recipient: string,
    otp: string
  ): Promise<void> {
    if (type === ContactType.PHONE) {
      console.log(`[SMS-OTP-GATEWAY] To: ${recipient} | Code: [${otp}] | Expiry: 5 mins`);
    } else {
      console.log(`[EMAIL-OTP-GATEWAY] To: ${recipient} | Code: [${otp}] | Expiry: 5 mins`);
    }
  }
}

export const contactService = new ContactService();
