import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/config/database';
import {
  ArtForm,
  EventType,
  CostType,
  VerificationStatus,
  PublicationStatus,
} from '@prisma/client';

describe('Event Filtering API - Integration Tests', () => {
  const sampleEvent = {
    id: 'test_event_001',
    title: 'Traditional Music Festival',
    description: 'An evening celebrating classical Sopana Sangeetham in Kunnamkulam.',
    culturalBackground: 'Central Kerala temple music.',
    artForm: ArtForm.MUSIC,
    eventType: EventType.FESTIVAL,
    locality: 'Kunnamkulam',
    neighborhood: 'Bhavana Nagar',
    latitude: 10.65,
    longitude: 76.07,
    eventDate: new Date('2026-11-10T18:00:00Z'),
    startTime: '18:00',
    endTime: '22:00',
    costType: CostType.FREE,
    verificationStatus: VerificationStatus.VERIFIED,
    publicationStatus: PublicationStatus.PUBLISHED,
    organizerName: 'Kunnamkulam Heritage Society',
    organizerContact: 'contact@heritagekunnamkulam.org',
    sourceUrl: 'https://en.wikipedia.org/wiki/Kunnamkulam',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Mock prisma.event methods using type assertion for Jest spies
    jest.spyOn(prisma.event as any, 'count').mockResolvedValue(1);

    jest.spyOn(prisma.event as any, 'findMany').mockResolvedValue([sampleEvent]);

    jest.spyOn(prisma.event as any, 'findUnique').mockImplementation(async (args: any) => {
      if (args?.where?.id === 'test_event_001') {
        return sampleEvent;
      }
      return null;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/events/filter - Success Scenarios', () => {
    it('filters by single artForm', async () => {
      const res = await request(app)
        .get('/api/events/filter')
        .query({ artForm: 'Music' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Events filtered successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].artForm).toBe('Music');
      expect(res.body.pagination).toBeDefined();
    });

    it('filters by combined query: artForm, eventType, cost, date, locality', async () => {
      const res = await request(app)
        .get('/api/events/filter')
        .query({
          artForm: 'Music',
          eventType: 'Festival',
          cost: 'Free',
          date: '2026-11-10',
          locality: 'Kunnamkulam',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].title).toBe('Traditional Music Festival');
      expect(res.body.data[0].costType).toBe('Free');
      expect(res.body.data[0].locality).toBe('Kunnamkulam');
    });

    it('filters by date range (startDate & endDate)', async () => {
      const res = await request(app)
        .get('/api/events/filter')
        .query({
          startDate: '2026-11-05',
          endDate: '2026-11-30',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('filters by geographical coordinates and radius in km', async () => {
      const res = await request(app)
        .get('/api/events/filter')
        .query({
          latitude: 10.65,
          longitude: 76.07,
          radius: 10,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].distance).toBeDefined();
    });

    it('returns empty array when no events match the criteria', async () => {
      jest.spyOn(prisma.event as any, 'count').mockResolvedValue(0);
      jest.spyOn(prisma.event as any, 'findMany').mockResolvedValue([]);

      const res = await request(app)
        .get('/api/events/filter')
        .query({ locality: 'NonExistentLocality123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });

    it('paginates results accurately', async () => {
      jest.spyOn(prisma.event as any, 'count').mockResolvedValue(25);

      const res = await request(app)
        .get('/api/events/filter')
        .query({ page: 2, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });
  });

  describe('GET /api/events/filter - Validation & Error Handling', () => {
    it('returns 400 for invalid artForm', async () => {
      const res = await request(app)
        .get('/api/events/filter')
        .query({ artForm: 'Astronomy' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid art form');
    });

    it('returns 400 for invalid date format', async () => {
      const res = await request(app)
        .get('/api/events/filter')
        .query({ date: 'not-a-date' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid date');
    });

    it('returns 400 when latitude is given without longitude', async () => {
      const res = await request(app)
        .get('/api/events/filter')
        .query({ latitude: 10.65 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Both latitude and longitude must be provided together');
    });

    it('returns 400 when radius is negative', async () => {
      const res = await request(app)
        .get('/api/events/filter')
        .query({
          latitude: 10.65,
          longitude: 76.07,
          radius: -10,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Radius must be a positive number');
    });

    it('returns 400 when startDate is after endDate', async () => {
      const res = await request(app)
        .get('/api/events/filter')
        .query({
          startDate: '2026-12-01',
          endDate: '2026-11-01',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('cannot be after endDate');
    });

    it('returns 400 for invalid pagination page number', async () => {
      const res = await request(app)
        .get('/api/events/filter')
        .query({ page: 0 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/events/filter-options', () => {
    it('returns all categories, art forms, and distinct localities', async () => {
      jest.spyOn(prisma.event as any, 'findMany').mockResolvedValue([
        { locality: 'Kunnamkulam' },
        { locality: 'Thrissur' },
      ]);

      const res = await request(app).get('/api/events/filter-options');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.artForms).toBeDefined();
      expect(res.body.data.eventTypes).toBeDefined();
      expect(res.body.data.costTypes).toBeDefined();
      expect(res.body.data.localities).toEqual(['Kunnamkulam', 'Thrissur']);
    });
  });

  describe('GET /api/events/:id', () => {
    it('returns 200 and event details when ID exists', async () => {
      const res = await request(app).get('/api/events/test_event_001');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('test_event_001');
      expect(res.body.data.title).toBe('Traditional Music Festival');
    });

    it('returns 404 when ID does not exist', async () => {
      const res = await request(app).get('/api/events/unknown_999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Event not found');
    });
  });

  describe('GET /api/events', () => {
    it('returns all published events with pagination', async () => {
      const res = await request(app).get('/api/events');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Events fetched successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
