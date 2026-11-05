import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ContactType, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../config/database';

export interface SendOtpResult {
  success: boolean;
  message: string;
  expiresInSeconds: number;
  cooldownSeconds: number;
  contactType: ContactType;
  contactValue: string;
  // For development/test environments only:
  debugOtp?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
  verifiedAt?: string;
  submissionRef?: string;
}

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;

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

    // Check for existing active verification
    const existing = await this.db.contactVerification.findFirst({
      where: {
        contactType,
        contactValue: normalizedValue,
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = Date.now();

    // Enforce cooldown
    if (existing && now - existing.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.createdAt.getTime())) / 1000);
      throw new Error(`Please wait ${waitSec} seconds before requesting a new verification code.`);
    }

    // Generate secure 6-digit OTP
    const rawOtp = this.generate6DigitOtp();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(now + OTP_EXPIRY_MS);

    // Save hashed record in database
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

    // Dispatch OTP via SMS or Email provider
    await this.dispatchOtpNotification(contactType, normalizedValue, rawOtp);

    return {
      success: true,
      message: `Verification code sent successfully to ${this.maskContact(contactType, normalizedValue)}`,
      expiresInSeconds: 300,
      cooldownSeconds: 60,
      contactType,
      contactValue: normalizedValue,
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

    const record = await this.db.contactVerification.findFirst({
      where: {
        contactType,
        contactValue: normalizedValue,
      },
      orderBy: { createdAt: 'desc' },
    });

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
      await this.db.contactVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      const remaining = MAX_ATTEMPTS - (record.attempts + 1);
      throw new Error(`Invalid verification code. ${remaining} attempt(s) remaining.`);
    }

    // Mark as verified
    const verifiedAt = new Date();
    await this.db.contactVerification.update({
      where: { id: record.id },
      data: {
        verifiedAt,
        userId: userId || record.userId,
        submissionRef: submissionRef || record.submissionRef,
      },
    });

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
    // In production, integrate Twilio (SMS) / SendGrid / Resend (Email).
    // In development and testing, log clearly for seamless local evaluation.
    if (type === ContactType.PHONE) {
      console.log(`[SMS-OTP-GATEWAY] To: ${recipient} | Code: [${otp}] | Expiry: 5 mins`);
    } else {
      console.log(`[EMAIL-OTP-GATEWAY] To: ${recipient} | Code: [${otp}] | Expiry: 5 mins`);
    }
  }
}

export const contactService = new ContactService();

