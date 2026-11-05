import {
  ArtForm,
  EventType,
  CostType,
  VerificationStatus,
  PublicationStatus,
} from '@prisma/client';

export const ART_FORM_MAP: Record<string, ArtForm> = {
  music: ArtForm.MUSIC,
  dance: ArtForm.DANCE,
  theatre: ArtForm.THEATRE,
  theater: ArtForm.THEATRE,
  'visual arts': ArtForm.VISUAL_ARTS,
  visual_arts: ArtForm.VISUAL_ARTS,
  crafts: ArtForm.CRAFTS,
  literature: ArtForm.LITERATURE,
  'traditional ritual arts': ArtForm.TRADITIONAL_RITUAL_ARTS,
  traditional_ritual_arts: ArtForm.TRADITIONAL_RITUAL_ARTS,
};

export const EVENT_TYPE_MAP: Record<string, EventType> = {
  festival: EventType.FESTIVAL,
  workshop: EventType.WORKSHOP,
  performance: EventType.PERFORMANCE,
  exhibition: EventType.EXHIBITION,
  'cultural gathering': EventType.CULTURAL_GATHERING,
  cultural_gathering: EventType.CULTURAL_GATHERING,
  'heritage event': EventType.HERITAGE_EVENT,
  heritage_event: EventType.HERITAGE_EVENT,
};

export const COST_TYPE_MAP: Record<string, CostType> = {
  free: CostType.FREE,
  paid: CostType.PAID,
  unknown: CostType.UNKNOWN,
};

export const VERIFICATION_STATUS_MAP: Record<string, VerificationStatus> = {
  verified: VerificationStatus.VERIFIED,
  'verified events': VerificationStatus.VERIFIED,
  'community submitted': VerificationStatus.COMMUNITY_SUBMITTED,
  community_submitted: VerificationStatus.COMMUNITY_SUBMITTED,
  'pending verification': VerificationStatus.PENDING_VERIFICATION,
  pending_verification: VerificationStatus.PENDING_VERIFICATION,
};

export const PUBLICATION_STATUS_MAP: Record<string, PublicationStatus> = {
  published: PublicationStatus.PUBLISHED,
  draft: PublicationStatus.DRAFT,
  archived: PublicationStatus.ARCHIVED,
};

// Enum to Display Label
export function formatArtForm(val: ArtForm): string {
  switch (val) {
    case ArtForm.MUSIC:
      return 'Music';
    case ArtForm.DANCE:
      return 'Dance';
    case ArtForm.THEATRE:
      return 'Theatre';
    case ArtForm.VISUAL_ARTS:
      return 'Visual Arts';
    case ArtForm.CRAFTS:
      return 'Crafts';
    case ArtForm.LITERATURE:
      return 'Literature';
    case ArtForm.TRADITIONAL_RITUAL_ARTS:
      return 'Traditional Ritual Arts';
    default:
      return String(val);
  }
}

export function formatEventType(val: EventType): string {
  switch (val) {
    case EventType.FESTIVAL:
      return 'Festival';
    case EventType.WORKSHOP:
      return 'Workshop';
    case EventType.PERFORMANCE:
      return 'Performance';
    case EventType.EXHIBITION:
      return 'Exhibition';
    case EventType.CULTURAL_GATHERING:
      return 'Cultural Gathering';
    case EventType.HERITAGE_EVENT:
      return 'Heritage Event';
    default:
      return String(val);
  }
}

export function formatCostType(val: CostType): string {
  switch (val) {
    case CostType.FREE:
      return 'Free';
    case CostType.PAID:
      return 'Paid';
    case CostType.UNKNOWN:
      return 'Unknown';
    default:
      return String(val);
  }
}

export function formatVerificationStatus(val: VerificationStatus): string {
  switch (val) {
    case VerificationStatus.VERIFIED:
      return 'Verified';
    case VerificationStatus.COMMUNITY_SUBMITTED:
      return 'Community Submitted';
    case VerificationStatus.PENDING_VERIFICATION:
      return 'Pending Verification';
    default:
      return String(val);
  }
}

export function formatDateToIso(d: Date): string {
  return d.toISOString().split('T')[0];
}

