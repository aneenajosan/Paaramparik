import { ContactService } from '../../src/services/contact.service';
import { ContactType } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('ContactService - Unit Tests', () => {
  let mockDb: any;
  let service: ContactService;

  beforeEach(() => {
    mockDb = {
      contactVerification: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new ContactService(mockDb);
  });

  describe('sendOtp', () => {
    it('generates 6-digit OTP, hashes it, and stores record', async () => {
      mockDb.contactVerification.findFirst.mockResolvedValue(null);
      mockDb.contactVerification.create.mockResolvedValue({ id: 'cov_1' });

      const result = await service.sendOtp(ContactType.EMAIL, 'user@example.com', 'user_1');

      expect(result.success).toBe(true);
      expect(result.contactType).toBe(ContactType.EMAIL);
      expect(result.contactValue).toBe('user@example.com');
      expect(result.expiresInSeconds).toBe(300);
      expect(mockDb.contactVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contactType: ContactType.EMAIL,
            contactValue: 'user@example.com',
            userId: 'user_1',
            attempts: 0,
          }),
        })
      );
    });

    it('enforces 60-second cooldown on repeated requests', async () => {
      // Created 30 seconds ago
      const recent = {
        id: 'cov_recent',
        contactType: ContactType.PHONE,
        contactValue: '9876543210',
        createdAt: new Date(Date.now() - 30 * 1000),
      };
      mockDb.contactVerification.findFirst.mockResolvedValue(recent);

      await expect(
        service.sendOtp(ContactType.PHONE, '9876543210')
      ).rejects.toThrow('Please wait');
    });
  });

  describe('verifyOtp', () => {
    it('verifies successfully when OTP matches', async () => {
      const otp = '123456';
      const otpHash = await bcrypt.hash(otp, 10);
      const activeRecord = {
        id: 'cov_123',
        contactType: ContactType.EMAIL,
        contactValue: 'user@example.com',
        otpHash,
        attempts: 0,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // in 5 mins
      };
      mockDb.contactVerification.findFirst.mockResolvedValue(activeRecord);
      mockDb.contactVerification.update.mockResolvedValue({ ...activeRecord, verifiedAt: new Date() });

      const result = await service.verifyOtp(ContactType.EMAIL, 'user@example.com', otp);

      expect(result.success).toBe(true);
      expect(result.verifiedAt).toBeDefined();
      expect(mockDb.contactVerification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cov_123' },
          data: expect.objectContaining({ verifiedAt: expect.any(Date) }),
        })
      );
    });

    it('rejects incorrect OTP and increments attempt count', async () => {
      const correctOtp = '123456';
      const otpHash = await bcrypt.hash(correctOtp, 10);
      const activeRecord = {
        id: 'cov_123',
        contactType: ContactType.PHONE,
        contactValue: '9876543210',
        otpHash,
        attempts: 1,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      };
      mockDb.contactVerification.findFirst.mockResolvedValue(activeRecord);

      await expect(
        service.verifyOtp(ContactType.PHONE, '9876543210', '999999')
      ).rejects.toThrow('Invalid verification code');

      expect(mockDb.contactVerification.update).toHaveBeenCalledWith({
        where: { id: 'cov_123' },
        data: { attempts: { increment: 1 } },
      });
    });

    it('rejects expired OTP', async () => {
      const activeRecord = {
        id: 'cov_expired',
        contactType: ContactType.EMAIL,
        contactValue: 'user@example.com',
        otpHash: 'hash',
        attempts: 0,
        expiresAt: new Date(Date.now() - 1000), // expired 1s ago
      };
      mockDb.contactVerification.findFirst.mockResolvedValue(activeRecord);

      await expect(
        service.verifyOtp(ContactType.EMAIL, 'user@example.com', '123456')
      ).rejects.toThrow('expired');
    });

    it('rejects when max attempts exceeded', async () => {
      const lockedRecord = {
        id: 'cov_locked',
        contactType: ContactType.EMAIL,
        contactValue: 'user@example.com',
        otpHash: 'hash',
        attempts: 5, // max attempts
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      };
      mockDb.contactVerification.findFirst.mockResolvedValue(lockedRecord);

      await expect(
        service.verifyOtp(ContactType.EMAIL, 'user@example.com', '123456')
      ).rejects.toThrow('Maximum verification attempts exceeded');
    });
  });

  describe('isContactVerified', () => {
    it('returns true when valid verification record exists within 24h', async () => {
      mockDb.contactVerification.findFirst.mockResolvedValue({
        id: 'cov_verified',
        verifiedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago
      });

      const isVerified = await service.isContactVerified(ContactType.EMAIL, 'user@example.com');
      expect(isVerified).toBe(true);
    });

    it('returns false when no verified record exists', async () => {
      mockDb.contactVerification.findFirst.mockResolvedValue(null);

      const isVerified = await service.isContactVerified(ContactType.PHONE, '0000000000');
      expect(isVerified).toBe(false);
    });
  });
});

