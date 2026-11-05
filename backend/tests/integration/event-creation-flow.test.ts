import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/config/database';
import { eventService } from '../../src/services/event.service';
import { contactService } from '../../src/services/contact.service';
import { moderationService } from '../../src/services/moderation.service';
import {
  ArtForm,
  EventType,
  PublicationStatus,
  UserRole,
  ReportCategory,
  ReportStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('Event Creation, Verification & Trust Flow - Integration Tests', () => {
  const normalUser = {
    id: 'user_contributor_1',
    email: 'creator@livingculturemap.org',
    password: 'hashedpassword',
    name: 'Cultural Organizer',
    role: UserRole.CONTRIBUTOR,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const adminUser = {
    id: 'admin_1',
    email: 'admin@livingculturemap.org',
    password: 'hashedpassword',
    name: 'Super Admin',
    role: UserRole.ADMIN,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    // Generate valid tokens
    const hash = await bcrypt.hash('Secret123!', 10);
    jest.spyOn(prisma.user as any, 'findUnique').mockImplementation(async (args: any) => {
      if (args?.where?.email === normalUser.email || args?.where?.id === normalUser.id) {
        return { ...normalUser, password: hash };
      }
      if (args?.where?.email === adminUser.email || args?.where?.id === adminUser.id) {
        return { ...adminUser, password: hash };
      }
      return null;
    });

    const userLogin = await request(app).post('/api/auth/login').send({
      email: normalUser.email,
      password: 'Secret123!',
    });
    userToken = userLogin.body.data.token;

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: adminUser.email,
      password: 'Secret123!',
    });
    adminToken = adminLogin.body.data.token;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Contact OTP Verification Flow', () => {
    it('sends email OTP successfully with cooldown parameters', async () => {
      jest.spyOn(prisma.contactVerification as any, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.contactVerification as any, 'create').mockResolvedValue({ id: 'cov_1' });

      const res = await request(app)
        .post('/api/contact/send-otp')
        .send({
          contactType: 'EMAIL',
          contactValue: 'organizer@festival.org',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.expiresInSeconds).toBe(300);
    });

    it('verifies correct OTP and returns timestamp', async () => {
      const otp = '654321';
      const otpHash = await bcrypt.hash(otp, 10);
      jest.spyOn(prisma.contactVerification as any, 'findFirst').mockResolvedValue({
        id: 'cov_1',
        contactType: 'EMAIL',
        contactValue: 'organizer@festival.org',
        otpHash,
        attempts: 0,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });
      jest.spyOn(prisma.contactVerification as any, 'update').mockResolvedValue({
        id: 'cov_1',
        verifiedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/contact/verify-otp')
        .send({
          contactType: 'EMAIL',
          contactValue: 'organizer@festival.org',
          otp,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verifiedAt).toBeDefined();
    });

    it('rejects invalid OTP with 400 Bad Request', async () => {
      const otpHash = await bcrypt.hash('123456', 10);
      jest.spyOn(prisma.contactVerification as any, 'findFirst').mockResolvedValue({
        id: 'cov_1',
        contactType: 'PHONE',
        contactValue: '9876543210',
        otpHash,
        attempts: 0,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });
      jest.spyOn(prisma.contactVerification as any, 'update').mockResolvedValue({});

      const res = await request(app)
        .post('/api/contact/verify-otp')
        .send({
          contactType: 'PHONE',
          contactValue: '9876543210',
          otp: '000000',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid verification code');
    });
  });

  describe('2. RAG Duplicate Detection API', () => {
    it('returns match when identical event exists', async () => {
      jest.spyOn(prisma.event as any, 'findMany').mockResolvedValue([
        {
          id: 'event_existing',
          title: 'Thrissur Pooram Percussion',
          description: 'Melam ensemble performance in temple grounds.',
          culturalBackground: 'Ancient Kerala percussion.',
          artForm: ArtForm.MUSIC,
          eventType: EventType.FESTIVAL,
          locality: 'Thrissur',
          eventDate: new Date('2026-11-20T10:00:00Z'),
          organizerName: 'Pooram Committee',
          publicationStatus: PublicationStatus.PUBLISHED,
          embedding: null,
        },
      ]);

      const res = await request(app)
        .post('/api/events/check-duplicate')
        .send({
          title: 'Thrissur Pooram Percussion',
          description: 'Melam ensemble performance in temple grounds.',
          eventDate: '2026-11-20',
          locality: 'Thrissur',
          organizerName: 'Pooram Committee',
        });

      expect(res.status).toBe(200);
      expect(res.body.isDuplicate).toBe(true);
      expect(res.body.matches.length).toBeGreaterThan(0);
      expect(res.body.matches[0].id).toBe('event_existing');
    });
  });

  describe('3. Event Submission API', () => {
    const validSubmission = {
      title: 'Muringoor Folk Dance Gala',
      description: 'An exceptional community celebration featuring rare Kaikottikali and Kolkali traditional folk dance styles.',
      culturalBackground: 'Traditional agrarian harvest folk dances of central Kerala passed down through generations.',
      artForm: 'Dance',
      eventType: 'Performance',
      locality: 'Chalakudy',
      neighborhood: 'Muringoor',
      address: 'Near River Bridge, Muringoor, Chalakudy, Kerala',
      latitude: 10.312,
      longitude: 76.331,
      eventDate: '2026-12-05',
      startTime: '17:00',
      endTime: '21:00',
      costType: 'Free',
      organizerName: 'Muringoor Arts Guild',
      organizerEmail: 'organizer@muringoor.org',
      emailVerified: true, // Verified contact
      resources: [
        {
          resourceTitle: 'Official Festival Website',
          resourceType: 'WEBSITE',
          resourceUrl: 'https://muringoorfolkarts.org',
          description: 'Schedule and artist lineup',
        },
      ],
      termsAccepted: true,
      termsVersion: '1.0',
    };

    it('submits successfully when contact is verified and terms are accepted', async () => {
      jest.spyOn(eventService, 'createEventSubmission').mockResolvedValue({
        eventId: 'new_event_123',
        status: PublicationStatus.PENDING_REVIEW,
        phoneVerified: false,
        emailVerified: true,
      });

      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validSubmission);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING_REVIEW');
    });

    it('rejects submission when terms and conditions are not accepted', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validSubmission,
          termsAccepted: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects submission when external resources are missing', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validSubmission,
          resources: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects submission when contact is completely unverified', async () => {
      jest.spyOn(contactService, 'isContactVerified').mockResolvedValue(false);

      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validSubmission,
          emailVerified: false,
          phoneVerified: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Contact verification required');
    });

    it('rejects submission when user is unauthorized (missing JWT)', async () => {
      const res = await request(app)
        .post('/api/events')
        .send(validSubmission);

      expect(res.status).toBe(401);
    });
  });

  describe('4. Misinformation Reporting', () => {
    it('submits a report for incorrect information', async () => {
      jest.spyOn(prisma.event as any, 'findUnique').mockResolvedValue({ id: 'event_001' });
      jest.spyOn(prisma.eventReport as any, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.eventReport as any, 'create').mockResolvedValue({
        id: 'rep_1',
        eventId: 'event_001',
        reportCategory: ReportCategory.INCORRECT_DATE_OR_TIME,
        status: ReportStatus.PENDING,
      });

      const res = await request(app)
        .post('/api/events/event_001/report')
        .send({
          reportCategory: 'INCORRECT_DATE_OR_TIME',
          reportDescription: 'The event starts at 19:00 instead of 18:00 as per the temple bulletin.',
          evidenceUrl: 'https://templeboard.kerala.gov.in/notice',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Report submitted successfully');
    });
  });

  describe('5. Admin Moderation Workflow', () => {
    it('allows admin to approve pending submission', async () => {
      jest.spyOn(moderationService, 'approveEvent').mockResolvedValue({
        id: 'event_pending',
        publicationStatus: PublicationStatus.PUBLISHED,
      } as any);

      const res = await request(app)
        .patch('/api/admin/events/event_pending/approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Verified with organizers over email.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('approved and published');
    });

    it('blocks regular users from accessing admin endpoints (403 Forbidden)', async () => {
      const res = await request(app)
        .patch('/api/admin/events/event_pending/approve')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ notes: 'Sneaky approval attempt' });

      expect(res.status).toBe(403);
    });
  });
});
