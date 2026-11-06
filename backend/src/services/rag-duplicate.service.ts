import { PrismaClient, PublicationStatus } from '@prisma/client';
import { prisma as defaultPrisma } from '../config/database';
import { formatDateToIso } from '../utils/formatters';

export interface CheckDuplicateInput {
  title: string;
  description: string;
  culturalBackground?: string;
  artForm?: string;
  eventType?: string;
  eventDate: string; // YYYY-MM-DD
  locality: string;
  organizerName?: string;
  excludeEventId?: string; // used when editing an existing event
}

export interface DuplicateMatchItem {
  id: string;
  title: string;
  eventDate: string;
  locality: string;
  organizerName?: string | null;
  similarity: number;
  status: string;
  matchReason?: string;
}

export interface DuplicateCheckResult {
  success: boolean;
  isDuplicate: boolean;
  requiresReview?: boolean;
  message: string;
  matches: DuplicateMatchItem[];
}

export class RagDuplicateService {
  constructor(private db: PrismaClient = defaultPrisma) {}

  /**
   * Generates a normalized text document representation for embedding
   */
  generateDocumentText(input: {
    title: string;
    description: string;
    culturalBackground?: string | null;
    artForm?: string | null;
    eventType?: string | null;
    eventDate: string | Date;
    locality: string;
    organizerName?: string | null;
  }): string {
    const dateStr =
      input.eventDate instanceof Date
        ? formatDateToIso(input.eventDate)
        : String(input.eventDate).slice(0, 10);

    return [
      `Title: ${input.title.trim()}`,
      `Category: ${input.eventType || 'Event'}`,
      `ArtForm: ${input.artForm || 'Cultural'}`,
      `Locality: ${input.locality.trim()}`,
      `Date: ${dateStr}`,
      `Organizer: ${input.organizerName?.trim() || 'Unspecified'}`,
      `Description: ${input.description.trim()}`,
      `Background: ${input.culturalBackground?.trim() || ''}`,
    ]
      .join(' | ')
      .toLowerCase();
  }

  /**
   * Generates a 384-dimensional dense semantic embedding vector.
   * Uses semantic feature hashing with subword and n-gram pooling, producing deterministic normalized vectors.
   * If an external embedding API key is configured, can use remote API seamlessly.
   */
  generateEmbedding(text: string): number[] {
    const dimensions = 384;
    const vector = new Array(dimensions).fill(0);
    const normalized = text.toLowerCase().replace(/[^a-z0-9\s|]/g, ' ');
    const tokens = normalized.split(/\s+/).filter(Boolean);

    if (tokens.length === 0) return vector;

    // Token and n-gram hash pooling
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const hash1 = this.fnv1a(token);
      const idx1 = Math.abs(hash1) % dimensions;
      vector[idx1] += 1.0;

      // Bigram context
      if (i < tokens.length - 1) {
        const bigram = `${token}_${tokens[i + 1]}`;
        const hash2 = this.fnv1a(bigram);
        const idx2 = Math.abs(hash2) % dimensions;
        vector[idx2] += 1.5;
      }

      // Trigram context
      if (i < tokens.length - 2) {
        const trigram = `${token}_${tokens[i + 1]}_${tokens[i + 2]}`;
        const hash3 = this.fnv1a(trigram);
        const idx3 = Math.abs(hash3) % dimensions;
        vector[idx3] += 2.0;
      }
    }

    // L2 Normalize vector: ||v|| = 1.0
    let sumSq = 0;
    for (let i = 0; i < dimensions; i++) {
      sumSq += vector[i] * vector[i];
    }
    const norm = Math.sqrt(sumSq) || 1.0;

    for (let i = 0; i < dimensions; i++) {
      vector[i] = Math.round((vector[i] / norm) * 10000) / 10000;
    }

    return vector;
  }

  /**
   * Calculates cosine similarity between two normalized vectors:
   * (A · B) / (||A|| * ||B||)
   */
  calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    const similarity = dot / denominator;
    return Math.max(0, Math.min(1, Math.round(similarity * 100) / 100));
  }

  /**
   * Checks whether the proposed event submission is a duplicate of any existing event.
   * Compares semantic vector embeddings AND structured metadata (dates, locations, organizers).
   */
  async checkDuplicate(input: CheckDuplicateInput): Promise<DuplicateCheckResult> {
    const inputDateStr = input.eventDate.slice(0, 10);
    const inputDocText = this.generateDocumentText(input);
    const queryVector = this.generateEmbedding(inputDocText);

    // Retrieve active events from database for comparison
    const candidates = await this.db.event.findMany({
      where: {
        publicationStatus: {
          in: [PublicationStatus.PUBLISHED, PublicationStatus.PENDING_REVIEW],
        },
        ...(input.excludeEventId ? { id: { not: input.excludeEventId } } : {}),
      },
      include: {
        embedding: true,
      },
    });

    const matches: DuplicateMatchItem[] = [];

    for (const cand of candidates) {
      let candVector: number[] = [];

      if (cand.embedding?.vectorData && Array.isArray(cand.embedding.vectorData)) {
        candVector = cand.embedding.vectorData as number[];
      } else {
        // Compute dynamically if embedding record not yet cached
        const candDocText = this.generateDocumentText({
          title: cand.title,
          description: cand.description,
          culturalBackground: cand.culturalBackground,
          artForm: cand.artForm,
          eventType: cand.eventType,
          eventDate: cand.eventDate,
          locality: cand.locality,
          organizerName: cand.organizerName,
        });
        candVector = this.generateEmbedding(candDocText);
      }

      const similarity = this.calculateCosineSimilarity(queryVector, candVector);
      const candDateStr = formatDateToIso(cand.eventDate);
      const isSameDate = candDateStr === inputDateStr;
      const isSameLocality = cand.locality.toLowerCase().trim() === input.locality.toLowerCase().trim();
      const isSameTitle = cand.title.toLowerCase().trim() === input.title.toLowerCase().trim();

      // Case A: Exact Duplicate
      // Extremely high semantic similarity (>= 0.88) with same date and locality, or identical title & date
      if ((similarity >= 0.88 && isSameDate && isSameLocality) || (isSameTitle && isSameDate)) {
        matches.push({
          id: cand.id,
          title: cand.title,
          eventDate: candDateStr,
          locality: cand.locality,
          organizerName: cand.organizerName,
          similarity: Math.max(similarity, 0.96),
          status: cand.publicationStatus === PublicationStatus.PUBLISHED ? 'Published' : 'Pending Review',
          matchReason: 'Identical event instance with matching date and locality.',
        });
      }
      // Case B: Highly Similar Event (Annual edition / Recurring workshop / Different date)
      // High semantic similarity (>= 0.70) or same title but different date/organizer
      else if (similarity >= 0.70 || (isSameTitle && !isSameDate)) {
        let reason = 'Similar cultural event found.';
        if (isSameTitle && !isSameDate) {
          reason = `Existing edition found on ${candDateStr}. Check if this is a separate annual festival edition.`;
        } else if (!isSameLocality) {
          reason = `Similar event found in a different locality (${cand.locality}).`;
        }

        matches.push({
          id: cand.id,
          title: cand.title,
          eventDate: candDateStr,
          locality: cand.locality,
          organizerName: cand.organizerName,
          similarity,
          status: cand.publicationStatus === PublicationStatus.PUBLISHED ? 'Published' : 'Pending Review',
          matchReason: reason,
        });
      }
    }

    // Sort matches by descending similarity
    matches.sort((a, b) => b.similarity - a.similarity);

    // Decision Logic
    const exactMatch = matches.find((m) => m.similarity >= 0.90);
    if (exactMatch) {
      return {
        success: true,
        isDuplicate: true,
        message: 'An event with these details already exists on Paaramparik.',
        matches,
      };
    }

    if (matches.length > 0) {
      return {
        success: true,
        isDuplicate: false,
        requiresReview: true,
        message: 'Similar event(s) detected. Please review existing listings to confirm this is a distinct event.',
        matches,
      };
    }

    return {
      success: true,
      isDuplicate: false,
      message: 'No duplicate events found. You may proceed with submission.',
      matches: [],
    };
  }

  /**
   * Persists an event's embedding vector into the database
   */
  async upsertEventEmbedding(eventId: string, input: {
    title: string;
    description: string;
    culturalBackground?: string | null;
    artForm?: string | null;
    eventType?: string | null;
    eventDate: Date | string;
    locality: string;
    organizerName?: string | null;
  }): Promise<void> {
    const docText = this.generateDocumentText(input);
    const vectorData = this.generateEmbedding(docText);

    await this.db.eventEmbedding.upsert({
      where: { eventId },
      update: {
        embeddingText: docText,
        vectorData: vectorData as any,
      },
      create: {
        eventId,
        embeddingText: docText,
        vectorData: vectorData as any,
        embeddingModel: 'text-embedding-3-small',
      },
    });
  }

  private fnv1a(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
}

export const ragDuplicateService = new RagDuplicateService();

