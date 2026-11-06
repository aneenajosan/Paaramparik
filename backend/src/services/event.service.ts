import { Prisma, PrismaClient, ContactType, ResourceType } from '@prisma/client';
import { prisma as defaultPrisma } from '../config/database';
import {
  EventFilterQuery,
  PaginationMeta,
  FormattedEventResponse,
  FilterOptionsResponse,
  ArtForm,
  EventType,
  CostType,
  VerificationStatus,
  PublicationStatus,
} from '../types/event.types';
import {
  ART_FORM_MAP,
  EVENT_TYPE_MAP,
  COST_TYPE_MAP,
  VERIFICATION_STATUS_MAP,
  PUBLICATION_STATUS_MAP,
  formatArtForm,
  formatEventType,
  formatCostType,
  formatVerificationStatus,
  formatDateToIso,
} from '../utils/formatters';
import { calculateHaversineDistanceKm, getBoundingBox } from '../utils/geo';
import { contactService } from './contact.service';
import { ragDuplicateService } from './rag-duplicate.service';

export interface CreateEventSubmissionInput {
  title: string;
  description: string;
  culturalBackground?: string;
  artForm: string;
  eventType: string;
  locality: string;
  neighborhood?: string;
  address: string;
  latitude: number;
  longitude: number;
  eventDate: string; // YYYY-MM-DD
  eventEnd?: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  costType?: string;
  organizerName: string;
  organizerPhone?: string;
  organizerEmail?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  accessibility?: string;
  images?: string[];
  resources: Array<{
    resourceTitle: string;
    resourceType: ResourceType;
    resourceUrl: string;
    description?: string;
  }>;
  termsAccepted: boolean;
  termsVersion?: string;
  submissionRef?: string;
}

export class EventService {
  constructor(private db: PrismaClient = defaultPrisma) {}

  /**
   * Filters cultural events based on multiple simultaneous criteria.
   * Uses database indexing and queries rather than in-memory filtering.
   */
  async filterEvents(
    query: EventFilterQuery,
    isAdmin = false
  ): Promise<{ data: FormattedEventResponse[]; pagination: PaginationMeta }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    // Has geo coordinates
    const hasCoordinates = query.latitude !== undefined && query.longitude !== undefined;
    const hasRadius = hasCoordinates && query.radius !== undefined;

    // Build standard Prisma WHERE clauses
    const where: Prisma.EventWhereInput = {};

    // 1. Publication Status (default to PUBLISHED for public users)
    if (query.publicationStatus && isAdmin) {
      const pubKey = query.publicationStatus.toLowerCase();
      where.publicationStatus = PUBLICATION_STATUS_MAP[pubKey] || PublicationStatus.PUBLISHED;
    } else {
      where.publicationStatus = PublicationStatus.PUBLISHED;
    }

    // 2. Art Form Filter
    if (query.artForm) {
      const mapped = ART_FORM_MAP[query.artForm.toLowerCase()];
      if (mapped) {
        where.artForm = mapped;
      }
    }

    // 3. Event Type Filter
    if (query.eventType) {
      const mapped = EVENT_TYPE_MAP[query.eventType.toLowerCase()];
      if (mapped) {
        where.eventType = mapped;
      }
    }

    // 4. Cost Filter (support 'cost' or 'costType')
    const costParam = query.cost || query.costType;
    if (costParam) {
      const mapped = COST_TYPE_MAP[costParam.toLowerCase()];
      if (mapped) {
        where.costType = mapped;
      }
    }

    // 5. Verification Status Filter
    if (query.verificationStatus) {
      const mapped = VERIFICATION_STATUS_MAP[query.verificationStatus.toLowerCase()];
      if (mapped) {
        where.verificationStatus = mapped;
      }
    }

    // 6. Locality & Neighborhood (case-insensitive partial match)
    if (query.locality) {
      where.locality = {
        contains: query.locality.trim(),
        mode: 'insensitive',
      };
    }

    if (query.neighborhood) {
      where.neighborhood = {
        contains: query.neighborhood.trim(),
        mode: 'insensitive',
      };
    }

    // 7. Text Search on Title / Description
    const searchTerm = query.search || query.q || query.title;
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm.trim(), mode: 'insensitive' } },
        { description: { contains: searchTerm.trim(), mode: 'insensitive' } },
      ];
    }

    // 8. Date Filtering (Today, Upcoming, Custom Date, Date Range)
    this.applyDateFilters(where, query);

    // 9. Geographical Bounding Box Filter if radius specified
    if (hasRadius && query.latitude !== undefined && query.longitude !== undefined && query.radius !== undefined) {
      const box = getBoundingBox(query.latitude, query.longitude, query.radius);
      where.latitude = { gte: box.minLat, lte: box.maxLat };
      where.longitude = { gte: box.minLng, lte: box.maxLng };
    }

    // Sorting
    const orderBy: Prisma.EventOrderByWithRelationInput[] = [];
    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

    if (query.sortBy === 'title') {
      orderBy.push({ title: sortOrder });
    } else if (query.sortBy === 'createdAt') {
      orderBy.push({ createdAt: sortOrder });
    } else {
      // Default sort by eventDate
      orderBy.push({ eventDate: sortOrder });
    }

    // If radius or distance sorting is requested, we do precise spherical filtering
    if (hasRadius && query.latitude !== undefined && query.longitude !== undefined && query.radius !== undefined) {
      return this.filterWithSphericalRadius(
        where,
        query.latitude,
        query.longitude,
        query.radius,
        page,
        limit,
        query.sortBy === 'distance',
        sortOrder
      );
    }

    // Standard Database Query
    const [total, rawEvents] = await Promise.all([
      this.db.event.count({ where }),
      this.db.event.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Format events
    const formattedData: FormattedEventResponse[] = rawEvents.map((ev) => {
      let distance: number | undefined;
      if (hasCoordinates && query.latitude !== undefined && query.longitude !== undefined) {
        distance = calculateHaversineDistanceKm(
          query.latitude,
          query.longitude,
          ev.latitude,
          ev.longitude
        );
      }

      return this.formatEvent(ev, distance);
    });

    // If sorting by distance without radius limit
    if (query.sortBy === 'distance' && hasCoordinates) {
      formattedData.sort((a, b) => {
        const distA = a.distance ?? Infinity;
        const distB = b.distance ?? Infinity;
        return sortOrder === 'desc' ? distB - distA : distA - distB;
      });
    }

    return {
      data: formattedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Creates a cultural event submission.
   * Validates contact verification, terms acceptance, duplicate detection, and supporting resources.
   */
  async createEventSubmission(input: CreateEventSubmissionInput, userId: string) {
    // 1. Mandatory Terms and Conditions Acceptance (FR-06)
    if (!input.termsAccepted) {
      throw new Error('You must read and agree to the Terms and Conditions before submitting an event.');
    }

    // 2. Mandatory Supporting Resource Links (FR-03)
    if (!input.resources || input.resources.length === 0) {
      throw new Error('At least one supporting external resource link (official website, registration, or social media) is required.');
    }

    // 3. Contact Verification Check (FR-02)
    // At least one contact method must be verified
    let isPhoneVerified = false;
    let isEmailVerified = false;

    if (input.organizerPhone) {
      isPhoneVerified = await contactService.isContactVerified(
        ContactType.PHONE,
        input.organizerPhone,
        userId
      );
    }

    if (input.organizerEmail) {
      isEmailVerified = await contactService.isContactVerified(
        ContactType.EMAIL,
        input.organizerEmail,
        userId
      );
    }

    // If input explicitly carries verified flags from recent OTP session
    if (input.phoneVerified) isPhoneVerified = true;
    if (input.emailVerified) isEmailVerified = true;

    if (!isPhoneVerified && !isEmailVerified) {
      throw new Error(
        'Contact verification required: Please verify at least one contact method (phone number or email address) via OTP before submitting.'
      );
    }

    // 4. Duplicate Check (FR-04)
    const duplicateCheck = await ragDuplicateService.checkDuplicate({
      title: input.title,
      description: input.description,
      culturalBackground: input.culturalBackground,
      artForm: input.artForm,
      eventType: input.eventType,
      eventDate: input.eventDate,
      locality: input.locality,
      organizerName: input.organizerName,
    });

    if (duplicateCheck.isDuplicate) {
      throw new Error('An event with these details already exists on Paaramparik.');
    }

    // Map Enums
    const artForm = ART_FORM_MAP[input.artForm.toLowerCase()] || ArtForm.OTHER;
    const eventType = EVENT_TYPE_MAP[input.eventType.toLowerCase()] || EventType.OTHER;
    const costType = (input.costType && COST_TYPE_MAP[input.costType.toLowerCase()]) || CostType.UNKNOWN;

    const eventDate = new Date(`${input.eventDate}T${input.startTime || '00:00'}:00Z`);
    const eventEnd = input.eventEnd
      ? new Date(`${input.eventEnd}T${input.endTime || '23:59'}:00Z`)
      : null;

    const now = new Date();

    // 5. Atomic Transaction: Event + Resources + Terms + Moderation Log + Embedding
    const result = await this.db.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          title: input.title.trim(),
          description: input.description.trim(),
          culturalBackground: input.culturalBackground?.trim() || null,
          artForm,
          eventType,
          locality: input.locality.trim(),
          neighborhood: input.neighborhood?.trim() || null,
          address: input.address.trim(),
          latitude: input.latitude,
          longitude: input.longitude,
          eventDate,
          eventEnd,
          startTime: input.startTime,
          endTime: input.endTime,
          costType,
          organizerName: input.organizerName.trim(),
          organizerPhone: input.organizerPhone?.trim() || null,
          organizerEmail: input.organizerEmail?.trim() || null,
          phoneVerified: isPhoneVerified,
          emailVerified: isEmailVerified,
          phoneVerifiedAt: isPhoneVerified ? now : null,
          emailVerifiedAt: isEmailVerified ? now : null,
          accessibility: input.accessibility?.trim() || null,
          images: input.images || [],
          contributorId: userId,
          publicationStatus: PublicationStatus.PENDING_REVIEW,
          verificationStatus: VerificationStatus.PENDING_VERIFICATION,
        },
      });

      // Save external resources
      for (const res of input.resources) {
        await tx.eventResource.create({
          data: {
            eventId: event.id,
            resourceTitle: res.resourceTitle.trim(),
            resourceType: res.resourceType,
            resourceUrl: res.resourceUrl.trim(),
            description: res.description?.trim() || null,
          },
        });
      }

      // Record Terms Acceptance
      await tx.termsAcceptance.create({
        data: {
          userId,
          eventId: event.id,
          termsVersion: input.termsVersion || '1.0',
          accepted: true,
          acceptedAt: now,
        },
      });

      // Record Initial Moderation History
      await tx.moderationLog.create({
        data: {
          eventId: event.id,
          moderatorId: userId,
          action: 'SUBMITTED',
          notes: 'Initial event submission awaiting administrator review.',
          previousStatus: null,
          newStatus: PublicationStatus.PENDING_REVIEW,
        },
      });

      return event;
    });

    // Generate & store embedding for future RAG searches
    await ragDuplicateService.upsertEventEmbedding(result.id, {
      title: input.title,
      description: input.description,
      culturalBackground: input.culturalBackground,
      artForm: input.artForm,
      eventType: input.eventType,
      eventDate: input.eventDate,
      locality: input.locality,
      organizerName: input.organizerName,
    });

    return {
      eventId: result.id,
      status: PublicationStatus.PENDING_REVIEW,
      phoneVerified: isPhoneVerified,
      emailVerified: isEmailVerified,
    };
  }

  /**
   * Fetches submissions made by an authenticated user
   */
  async getMySubmissions(userId: string) {
    const events = await this.db.event.findMany({
      where: { contributorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        resources: true,
        moderationLogs: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });

    return events.map((ev) => ({
      id: ev.id,
      title: ev.title,
      locality: ev.locality,
      eventDate: formatDateToIso(new Date(ev.eventDate)),
      publicationStatus: ev.publicationStatus,
      verificationStatus: ev.verificationStatus,
      phoneVerified: ev.phoneVerified,
      emailVerified: ev.emailVerified,
      resourcesCount: ev.resources.length,
      createdAt: ev.createdAt,
      latestFeedback: ev.moderationLogs[0]?.notes || null,
    }));
  }

  /**
   * Updates an existing submission (if user is author and status is PENDING_REVIEW or DRAFT)
   */
  async updateSubmission(id: string, userId: string, data: Partial<CreateEventSubmissionInput>, isAdmin = false) {
    const existing = await this.db.event.findUnique({ where: { id } });
    if (!existing) throw new Error(`Event not found with ID: ${id}`);

    if (!isAdmin && existing.contributorId !== userId) {
      throw new Error('You do not have permission to edit this event.');
    }

    if (!isAdmin && existing.publicationStatus === PublicationStatus.PUBLISHED) {
      throw new Error('Published events cannot be edited directly by contributors. Please submit an update or report.');
    }

    const updated = await this.db.event.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title.trim() } : {}),
        ...(data.description ? { description: data.description.trim() } : {}),
        ...(data.culturalBackground !== undefined ? { culturalBackground: data.culturalBackground } : {}),
        ...(data.locality ? { locality: data.locality.trim() } : {}),
        ...(data.neighborhood !== undefined ? { neighborhood: data.neighborhood } : {}),
        ...(data.address ? { address: data.address.trim() } : {}),
        ...(data.startTime ? { startTime: data.startTime } : {}),
        ...(data.endTime ? { endTime: data.endTime } : {}),
        ...(data.accessibility !== undefined ? { accessibility: data.accessibility } : {}),
      },
    });

    return updated;
  }

  /**
   * Fetches external resources for an event
   */
  async getEventResources(eventId: string) {
    return this.db.eventResource.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Adds an external resource to an event
   */
  async addEventResource(eventId: string, resource: {
    resourceTitle: string;
    resourceType: ResourceType;
    resourceUrl: string;
    description?: string;
  }) {
    const event = await this.db.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error(`Event not found with ID: ${eventId}`);

    return this.db.eventResource.create({
      data: {
        eventId,
        resourceTitle: resource.resourceTitle.trim(),
        resourceType: resource.resourceType,
        resourceUrl: resource.resourceUrl.trim(),
        description: resource.description?.trim() || null,
      },
    });
  }

  /**
   * Applies date filters to the Prisma WHERE clause
   */
  private applyDateFilters(where: Prisma.EventWhereInput, query: EventFilterQuery): void {
    const now = new Date();
    const todayStr = formatDateToIso(now);
    const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfToday = new Date(`${todayStr}T23:59:59.999Z`);

    const dateVal = query.date?.toLowerCase();
    const preset = query.datePreset?.toLowerCase();

    // Check for 'today'
    if (dateVal === 'today' || preset === 'today') {
      where.eventDate = {
        gte: startOfToday,
        lte: endOfToday,
      };
      return;
    }

    // Check for 'upcoming' (excludes expired past events)
    if (dateVal === 'upcoming' || preset === 'upcoming') {
      where.eventDate = {
        gte: startOfToday,
      };
      return;
    }

    // Check for specific single date (YYYY-MM-DD)
    if (query.date && query.date !== 'today' && query.date !== 'upcoming') {
      const targetStart = new Date(`${query.date}T00:00:00.000Z`);
      const targetEnd = new Date(`${query.date}T23:59:59.999Z`);
      where.eventDate = {
        gte: targetStart,
        lte: targetEnd,
      };
      return;
    }

    // Check for Date Range (startDate and/or endDate)
    if (query.startDate || query.endDate) {
      const dateRangeClause: Prisma.DateTimeFilter = {};
      if (query.startDate) {
        dateRangeClause.gte = new Date(`${query.startDate}T00:00:00.000Z`);
      }
      if (query.endDate) {
        dateRangeClause.lte = new Date(`${query.endDate}T23:59:59.999Z`);
      }
      where.eventDate = dateRangeClause;
    }
  }

  /**
   * Performs database filtering with bounding box pre-filter followed by Haversine radius validation
   */
  private async filterWithSphericalRadius(
    where: Prisma.EventWhereInput,
    userLat: number,
    userLon: number,
    radiusKm: number,
    page: number,
    limit: number,
    sortByDistance: boolean,
    sortOrder: 'asc' | 'desc'
  ): Promise<{ data: FormattedEventResponse[]; pagination: PaginationMeta }> {
    // 1. Fetch matching candidates within the bounding box from database
    const candidates = await this.db.event.findMany({
      where,
    });

    // 2. Compute exact spherical distance and filter within radius
    const filteredWithDistance = candidates
      .map((ev) => {
        const distance = calculateHaversineDistanceKm(userLat, userLon, ev.latitude, ev.longitude);
        return { ev, distance };
      })
      .filter((item) => item.distance <= radiusKm);

    // 3. Sort
    if (sortByDistance) {
      filteredWithDistance.sort((a, b) =>
        sortOrder === 'desc' ? b.distance - a.distance : a.distance - b.distance
      );
    } else {
      filteredWithDistance.sort((a, b) =>
        sortOrder === 'desc'
          ? b.ev.eventDate.getTime() - a.ev.eventDate.getTime()
          : a.ev.eventDate.getTime() - b.ev.eventDate.getTime()
      );
    }

    const total = filteredWithDistance.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedItems = filteredWithDistance.slice(skip, skip + limit);

    const data = paginatedItems.map((item) => this.formatEvent(item.ev, item.distance));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Fetches event by ID
   */
  async getEventById(id: string): Promise<FormattedEventResponse | null> {
    const event = await this.db.event.findUnique({
      where: { id },
      include: {
        resources: true,
      },
    });

    if (!event) return null;
    return this.formatEvent(event);
  }

  /**
   * Fetches distinct filter options available in the platform
   */
  async getFilterOptions(): Promise<FilterOptionsResponse> {
    const localities = await this.db.event.findMany({
      where: { publicationStatus: PublicationStatus.PUBLISHED },
      select: { locality: true },
      distinct: ['locality'],
      orderBy: { locality: 'asc' },
    });

    return {
      artForms: Object.values(ArtForm).map((val) => ({
        label: formatArtForm(val),
        value: formatArtForm(val),
      })),
      eventTypes: Object.values(EventType).map((val) => ({
        label: formatEventType(val),
        value: formatEventType(val),
      })),
      costTypes: Object.values(CostType).map((val) => ({
        label: formatCostType(val),
        value: formatCostType(val),
      })),
      verificationStatuses: Object.values(VerificationStatus).map((val) => ({
        label: formatVerificationStatus(val),
        value: formatVerificationStatus(val),
      })),
      localities: localities.map((l) => l.locality),
      datePresets: [
        { label: 'Today', value: 'today' },
        { label: 'Upcoming Events', value: 'upcoming' },
      ],
    };
  }

  /**
   * Formats database event to API contract
   */
  private formatEvent(ev: any, distance?: number): FormattedEventResponse {
    const formatted: FormattedEventResponse = {
      id: ev.id,
      title: ev.title,
      description: ev.description,
      culturalBackground: ev.culturalBackground,
      artForm: formatArtForm(ev.artForm),
      eventType: formatEventType(ev.eventType),
      locality: ev.locality,
      neighborhood: ev.neighborhood,
      eventDate: formatDateToIso(new Date(ev.eventDate)),
      startTime: ev.startTime,
      endTime: ev.endTime,
      costType: formatCostType(ev.costType),
      verificationStatus: formatVerificationStatus(ev.verificationStatus),
      publicationStatus: ev.publicationStatus,
      latitude: ev.latitude,
      longitude: ev.longitude,
      organizerName: ev.organizerName,
      organizerContact: ev.organizerContact,
      sourceUrl: ev.sourceUrl,
      createdAt: ev.createdAt?.toISOString?.() ?? String(ev.createdAt),
      updatedAt: ev.updatedAt?.toISOString?.() ?? String(ev.updatedAt),
    };

    if (distance !== undefined) {
      formatted.distance = distance;
    }

    return formatted;
  }
}

export const eventService = new EventService();
