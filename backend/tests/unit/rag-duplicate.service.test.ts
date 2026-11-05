import { RagDuplicateService } from '../../src/services/rag-duplicate.service';
import { ArtForm, EventType, PublicationStatus } from '@prisma/client';

describe('RagDuplicateService - Unit Tests', () => {
  let mockDb: any;
  let service: RagDuplicateService;

  const existingEvent = {
    id: 'event_001',
    title: 'Traditional Music Festival',
    description: 'An evening celebrating classical Sopana Sangeetham and percussion in Kunnamkulam.',
    culturalBackground: 'Rooted in central Kerala temple music.',
    artForm: ArtForm.MUSIC,
    eventType: EventType.FESTIVAL,
    locality: 'Kunnamkulam',
    eventDate: new Date('2026-11-20T18:00:00Z'),
    organizerName: 'Kunnamkulam Heritage Society',
    publicationStatus: PublicationStatus.PUBLISHED,
    embedding: null,
  };

  beforeEach(() => {
    mockDb = {
      event: {
        findMany: jest.fn().mockResolvedValue([existingEvent]),
      },
      eventEmbedding: {
        upsert: jest.fn().mockResolvedValue({ id: 'emb_1' }),
      },
    };
    service = new RagDuplicateService(mockDb);
  });

  describe('generateEmbedding', () => {
    it('generates a 384-dimensional normalized vector', () => {
      const text = 'Traditional Kathakali performance in Thrissur Kerala';
      const vector = service.generateEmbedding(text);

      expect(vector).toHaveLength(384);
      let sumSq = 0;
      for (const val of vector) sumSq += val * val;
      expect(Math.sqrt(sumSq)).toBeCloseTo(1.0, 1);
    });

    it('produces identical vectors for identical inputs', () => {
      const text = 'Kunnamkulam Temple Festival';
      const v1 = service.generateEmbedding(text);
      const v2 = service.generateEmbedding(text);
      expect(v1).toEqual(v2);
    });
  });

  describe('calculateCosineSimilarity', () => {
    it('returns 1.0 for identical vectors', () => {
      const v1 = service.generateEmbedding('Music Festival in Kunnamkulam');
      const similarity = service.calculateCosineSimilarity(v1, v1);
      expect(similarity).toBe(1.0);
    });

    it('returns a lower similarity for completely different texts', () => {
      const v1 = service.generateEmbedding('Traditional Kathakali classical dance drama in temple');
      const v2 = service.generateEmbedding('Modern artificial intelligence cloud computing symposium');
      const similarity = service.calculateCosineSimilarity(v1, v2);
      expect(similarity).toBeLessThan(0.4);
    });
  });

  describe('checkDuplicate', () => {
    it('flags an exact duplicate when title, date, and locality match existing event', async () => {
      const input = {
        title: 'Traditional Music Festival',
        description: 'An evening celebrating classical Sopana Sangeetham and percussion in Kunnamkulam.',
        eventDate: '2026-11-20',
        locality: 'Kunnamkulam',
        organizerName: 'Kunnamkulam Heritage Society',
      };

      const result = await service.checkDuplicate(input);

      expect(result.success).toBe(true);
      expect(result.isDuplicate).toBe(true);
      expect(result.message).toContain('already exists');
      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.matches[0].id).toBe('event_001');
      expect(result.matches[0].similarity).toBeGreaterThanOrEqual(0.9);
    });

    it('identifies annual festival edition on a different date as distinct but related (requiresReview)', async () => {
      const input = {
        title: 'Traditional Music Festival',
        description: 'Next year 2027 edition of the annual festival.',
        eventDate: '2027-11-20', // Next year's date!
        locality: 'Kunnamkulam',
        organizerName: 'Kunnamkulam Heritage Society',
      };

      const result = await service.checkDuplicate(input);

      expect(result.success).toBe(true);
      expect(result.isDuplicate).toBe(false); // Does NOT block submission!
      expect(result.requiresReview).toBe(true); // Prompts user to verify separate edition
      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.matches[0].matchReason).toContain('Existing edition found');
    });

    it('allows a genuinely different event without duplicate warnings', async () => {
      const input = {
        title: 'Theyyam Ritual Invocation Night',
        description: 'Sacred ritual dance form of Northern Malabar honoring ancestral spirits.',
        eventDate: '2026-12-15',
        locality: 'Kannur',
        organizerName: 'Malabar Traditional Arts Trust',
      };

      const result = await service.checkDuplicate(input);

      expect(result.success).toBe(true);
      expect(result.isDuplicate).toBe(false);
      expect(result.matches).toHaveLength(0);
    });
  });
});

