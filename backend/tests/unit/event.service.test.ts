import { EventService } from '../../src/services/event.service';
import {
  ArtForm,
  EventType,
  CostType,
  VerificationStatus,
  PublicationStatus,
} from '@prisma/client';

describe('EventService - Unit Tests', () => {
  let mockDb: any;
  let service: EventService;

  const mockEvents = [
    {
      id: 'event_001',
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
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'event_002',
      title: 'Kathakali Performance',
      description: 'Nalacharitham recital.',
      culturalBackground: 'Classical dance-drama of Kerala.',
      artForm: ArtForm.DANCE,
      eventType: EventType.PERFORMANCE,
      locality: 'Kunnamkulam',
      neighborhood: 'Guruvayur Road',
      latitude: 10.648,
      longitude: 76.072,
      eventDate: new Date('2026-11-15T20:00:00Z'),
      startTime: '20:00',
      endTime: '04:00',
      costType: CostType.FREE,
      verificationStatus: VerificationStatus.VERIFIED,
      publicationStatus: PublicationStatus.PUBLISHED,
      organizerName: 'Kalamandalam Alumni',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'event_003',
      title: 'Panchavadyam Workshop',
      description: 'Temple percussion workshop in Thrissur.',
      culturalBackground: 'Temple orchestra.',
      artForm: ArtForm.MUSIC,
      eventType: EventType.WORKSHOP,
      locality: 'Thrissur',
      neighborhood: 'Round East',
      latitude: 10.5276,
      longitude: 76.2144,
      eventDate: new Date('2026-11-20T10:00:00Z'),
      startTime: '10:00',
      endTime: '15:00',
      costType: CostType.PAID,
      verificationStatus: VerificationStatus.COMMUNITY_SUBMITTED,
      publicationStatus: PublicationStatus.PUBLISHED,
      organizerName: 'Thrissur Rhythm Collective',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    mockDb = {
      event: {
        count: jest.fn().mockResolvedValue(mockEvents.length),
        findMany: jest.fn().mockResolvedValue(mockEvents),
        findUnique: jest.fn(),
      },
    };
    service = new EventService(mockDb);
  });

  describe('Single Filter: Art Form', () => {
    it('applies artForm filter accurately with AND logic', async () => {
      mockDb.event.count.mockResolvedValue(1);
      mockDb.event.findMany.mockResolvedValue([mockEvents[0]]);

      const result = await service.filterEvents({ artForm: 'Music' });

      expect(mockDb.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            artForm: ArtForm.MUSIC,
            publicationStatus: PublicationStatus.PUBLISHED,
          }),
        })
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0].artForm).toBe('Music');
    });
  });

  describe('Multiple Combined Filters', () => {
    it('combines artForm, eventType, cost, locality, and date', async () => {
      mockDb.event.count.mockResolvedValue(1);
      mockDb.event.findMany.mockResolvedValue([mockEvents[0]]);

      const query = {
        artForm: 'Music',
        eventType: 'Festival',
        cost: 'Free',
        locality: 'Kunnamkulam',
        date: '2026-11-10',
      };

      const result = await service.filterEvents(query);

      expect(mockDb.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            artForm: ArtForm.MUSIC,
            eventType: EventType.FESTIVAL,
            costType: CostType.FREE,
            locality: { contains: 'Kunnamkulam', mode: 'insensitive' },
            eventDate: {
              gte: new Date('2026-11-10T00:00:00.000Z'),
              lte: new Date('2026-11-10T23:59:59.999Z'),
            },
          }),
        })
      );
      expect(result.data[0].title).toBe('Traditional Music Festival');
    });
  });

  describe('Date Range Filtering', () => {
    it('queries between startDate and endDate', async () => {
      await service.filterEvents({
        startDate: '2026-11-05',
        endDate: '2026-11-30',
      });

      expect(mockDb.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eventDate: {
              gte: new Date('2026-11-05T00:00:00.000Z'),
              lte: new Date('2026-11-30T23:59:59.999Z'),
            },
          }),
        })
      );
    });

    it('filters for upcoming events excluding past events', async () => {
      await service.filterEvents({ datePreset: 'upcoming' });

      expect(mockDb.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eventDate: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        })
      );
    });
  });

  describe('Location & Radius Filtering', () => {
    it('calculates distance and includes events within radius', async () => {
      // Kunnamkulam center: 10.65, 76.07
      mockDb.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.filterEvents({
        latitude: 10.65,
        longitude: 76.07,
        radius: 5, // 5km radius includes event_001 and event_002, but Thrissur (23km away) should be excluded
      });

      expect(result.data.length).toBe(2);
      expect(result.data.map((e) => e.id)).toEqual(['event_001', 'event_002']);
      expect(result.data[0].distance).toBeDefined();
    });
  });

  describe('Cost Filtering', () => {
    it('filters by cost Free or Paid', async () => {
      await service.filterEvents({ cost: 'Free' });

      expect(mockDb.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            costType: CostType.FREE,
          }),
        })
      );
    });
  });

  describe('Verification Status Filtering', () => {
    it('filters by verification status Verified', async () => {
      await service.filterEvents({ verificationStatus: 'Verified' });

      expect(mockDb.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            verificationStatus: VerificationStatus.VERIFIED,
          }),
        })
      );
    });
  });

  describe('Empty Search Results', () => {
    it('returns empty array and zero total count when no matches', async () => {
      mockDb.event.count.mockResolvedValue(0);
      mockDb.event.findMany.mockResolvedValue([]);

      const result = await service.filterEvents({ locality: 'NonExistentCity' });

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('Pagination', () => {
    it('applies pagination parameters correctly', async () => {
      mockDb.event.count.mockResolvedValue(25);
      mockDb.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.filterEvents({ page: 2, limit: 10 });

      expect(mockDb.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });
  });

  describe('getEventById', () => {
    it('returns formatted event when found', async () => {
      mockDb.event.findUnique.mockResolvedValue(mockEvents[0]);

      const result = await service.getEventById('event_001');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('event_001');
      expect(result?.title).toBe('Traditional Music Festival');
    });

    it('returns null when event not found', async () => {
      mockDb.event.findUnique.mockResolvedValue(null);

      const result = await service.getEventById('non_existent');

      expect(result).toBeNull();
    });
  });
});

