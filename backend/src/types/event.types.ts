import {
  ArtForm,
  EventType,
  CostType,
  VerificationStatus,
  PublicationStatus,
  UserRole,
  Event as PrismaEvent,
} from '@prisma/client';

export {
  ArtForm,
  EventType,
  CostType,
  VerificationStatus,
  PublicationStatus,
  UserRole,
};

export type DateFilterPreset = 'today' | 'upcoming';

export interface EventFilterQuery {
  artForm?: string;
  eventType?: string;
  cost?: string;
  costType?: string;
  locality?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  date?: string; // YYYY-MM-DD or 'today' or 'upcoming'
  datePreset?: DateFilterPreset;
  startDate?: string;
  endDate?: string;
  verificationStatus?: string;
  publicationStatus?: string;
  search?: string;
  q?: string;
  title?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'relevance' | 'distance' | 'title' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FormattedEventResponse {
  id: string;
  title: string;
  description?: string;
  culturalBackground?: string | null;
  artForm: string;
  eventType: string;
  locality: string;
  neighborhood?: string | null;
  eventDate: string; // YYYY-MM-DD
  startTime?: string | null;
  endTime?: string | null;
  costType: string;
  verificationStatus: string;
  publicationStatus?: string;
  latitude: number;
  longitude: number;
  distance?: number; // km when geo query is active
  organizerName?: string | null;
  organizerContact?: string | null;
  sourceUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FilterOptionsResponse {
  artForms: Array<{ label: string; value: string }>;
  eventTypes: Array<{ label: string; value: string }>;
  costTypes: Array<{ label: string; value: string }>;
  verificationStatuses: Array<{ label: string; value: string }>;
  localities: string[];
  datePresets: Array<{ label: string; value: string }>;
}

