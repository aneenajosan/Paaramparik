import { PrismaClient, ReportCategory, ReportStatus } from '@prisma/client';
import { prisma as defaultPrisma } from '../config/database';

export interface SubmitReportInput {
  eventId: string;
  reportCategory: ReportCategory;
  reportDescription: string;
  evidenceUrl?: string;
  reporterContact?: string;
  reporterId?: string;
}

export interface UpdateReportInput {
  status: ReportStatus;
  adminNotes?: string;
  moderatorId: string;
}

export class ReportService {
  constructor(private db: PrismaClient = defaultPrisma) {}

  /**
   * Submits a report for incorrect or misleading information.
   * Protects against spam submissions.
   */
  async submitReport(input: SubmitReportInput) {
    // Verify event exists
    const event = await this.db.event.findUnique({
      where: { id: input.eventId },
    });

    if (!event) {
      throw new Error(`Event not found with ID: ${input.eventId}`);
    }

    // Anti-spam check: prevent identical pending reports within 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingSpam = await this.db.eventReport.findFirst({
      where: {
        eventId: input.eventId,
        reportCategory: input.reportCategory,
        createdAt: { gte: oneHourAgo },
        ...(input.reporterId ? { reporterId: input.reporterId } : {}),
      },
    });

    if (existingSpam) {
      throw new Error('A report for this issue on this event was already submitted recently. Our moderation team is reviewing it.');
    }

    const report = await this.db.eventReport.create({
      data: {
        eventId: input.eventId,
        reporterId: input.reporterId || null,
        reportCategory: input.reportCategory,
        reportDescription: input.reportDescription.trim(),
        evidenceUrl: input.evidenceUrl?.trim() || null,
        reporterContact: input.reporterContact?.trim() || null,
        status: ReportStatus.PENDING,
      },
    });

    return report;
  }

  /**
   * Admin lists all misinformation reports with optional filtering by status and category
   */
  async getReports(params: {
    status?: ReportStatus;
    category?: ReportCategory;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.category) where.reportCategory = params.category;

    const [total, reports] = await Promise.all([
      this.db.eventReport.count({ where }),
      this.db.eventReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              locality: true,
              eventDate: true,
              publicationStatus: true,
            },
          },
          reporter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin updates report status and adds investigation notes
   */
  async updateReportStatus(reportId: string, input: UpdateReportInput) {
    const existing = await this.db.eventReport.findUnique({
      where: { id: reportId },
    });

    if (!existing) {
      throw new Error(`Report not found with ID: ${reportId}`);
    }

    const updated = await this.db.eventReport.update({
      where: { id: reportId },
      data: {
        status: input.status,
        adminNotes: input.adminNotes?.trim() || existing.adminNotes,
        resolvedAt: input.status === ReportStatus.RESOLVED || input.status === ReportStatus.DISMISSED
          ? new Date()
          : null,
      },
    });

    // Write audit log
    await this.db.moderationLog.create({
      data: {
        eventId: existing.eventId,
        moderatorId: input.moderatorId,
        action: `REPORT_${input.status}`,
        notes: `Report ${reportId} marked as ${input.status}. Admin notes: ${input.adminNotes || 'None'}`,
        previousStatus: existing.status,
        newStatus: input.status,
      },
    });

    return updated;
  }
}

export const reportService = new ReportService();
