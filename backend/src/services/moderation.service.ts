import { PrismaClient, PublicationStatus, VerificationStatus } from '@prisma/client';
import { prisma as defaultPrisma } from '../config/database';

export class ModerationService {
  constructor(private db: PrismaClient = defaultPrisma) {}

  /**
   * Fetches events awaiting administrator moderation
   */
  async getPendingEvents(page = 1, limit = 20) {
    const skip = (Math.max(1, page) - 1) * limit;

    const [total, events] = await Promise.all([
      this.db.event.count({
        where: { publicationStatus: PublicationStatus.PENDING_REVIEW },
      }),
      this.db.event.findMany({
        where: { publicationStatus: PublicationStatus.PENDING_REVIEW },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          resources: true,
          contributor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          termsAcceptances: {
            take: 1,
            orderBy: { acceptedAt: 'desc' },
          },
          moderationLogs: {
            orderBy: { createdAt: 'desc' },
            include: {
              moderator: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Approves an event for public discovery
   */
  async approveEvent(eventId: string, moderatorId: string, notes?: string) {
    const event = await this.db.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error(`Event not found with ID: ${eventId}`);

    const updated = await this.db.$transaction(async (tx) => {
      const res = await tx.event.update({
        where: { id: eventId },
        data: {
          publicationStatus: PublicationStatus.PUBLISHED,
          verificationStatus: VerificationStatus.VERIFIED,
        },
      });

      await tx.moderationLog.create({
        data: {
          eventId,
          moderatorId,
          action: 'APPROVE',
          notes: notes?.trim() || 'Event approved and published.',
          previousStatus: event.publicationStatus,
          newStatus: PublicationStatus.PUBLISHED,
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * Rejects an event submission with administrative feedback
   */
  async rejectEvent(eventId: string, moderatorId: string, notes: string) {
    const event = await this.db.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error(`Event not found with ID: ${eventId}`);

    const updated = await this.db.$transaction(async (tx) => {
      const res = await tx.event.update({
        where: { id: eventId },
        data: {
          publicationStatus: PublicationStatus.REJECTED,
        },
      });

      await tx.moderationLog.create({
        data: {
          eventId,
          moderatorId,
          action: 'REJECT',
          notes: notes.trim(),
          previousStatus: event.publicationStatus,
          newStatus: PublicationStatus.REJECTED,
        },
      });

      return res;
    });

    return updated;
  }
}

export const moderationService = new ModerationService();

