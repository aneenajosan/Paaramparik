import { Landmark, Palette, CalendarDays, Drama, Hammer, Sparkles, type LucideIcon } from 'lucide-react';
import type { ExperienceType, ListingType, SubmissionStatus, VerificationStatus } from '@/types';

export const TYPE_META: Record<ListingType, { label: string; plural: string; color: string; glyph: string; Icon: LucideIcon; blurb: string }> = {
  place: { label: 'Cultural Place', plural: 'Places & Heritage Sites', color: '#CC6F00', glyph: 'P', Icon: Landmark, blurb: 'A temple, mosque, institution or heritage site.' },
  artist: { label: 'Artist / Artisan', plural: 'Artists & Artisans', color: '#FF933E', glyph: 'A', Icon: Palette, blurb: 'A practitioner, craftsperson or performer.' },
  event: { label: 'Event / Festival', plural: 'Events & Festivals', color: '#E67E00', glyph: 'E', Icon: CalendarDays, blurb: 'A festival or one-off cultural event.' },
  performance: { label: 'Traditional Performance', plural: 'Traditional Performances', color: '#FF933E', glyph: 'T', Icon: Drama, blurb: 'A staged or ritual performance tradition.' },
  workshop: { label: 'Craft Workshop', plural: 'Craft Workshops', color: '#CC6F00', glyph: 'W', Icon: Hammer, blurb: 'A place or programme where a craft is taught.' },
  practice: { label: 'Art Form / Practice', plural: 'Art Forms & Practices', color: '#FFAF6E', glyph: 'F', Icon: Sparkles, blurb: 'A traditional art form, instrument or practice.' },
};
export const TYPES = Object.keys(TYPE_META) as ListingType[];
export const EXPERIENCE_LABEL: Record<ExperienceType, string> = { visit: 'Visit', attend: 'Attend', learn: 'Learn', meet: 'Meet makers' };
export const EXPERIENCE_FOR_TYPE: Record<ListingType, ExperienceType> = { place: 'visit', event: 'attend', performance: 'attend', workshop: 'learn', artist: 'meet', practice: 'learn' };
export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  demo: 'Demo record — not verified', unverified: 'Unverified', under_review: 'Under review', verified: 'Verified by reviewer',
};
export const SUBMISSION_LABEL: Record<SubmissionStatus, string> = {
  pending_review: 'Pending Review', approved: 'Approved', changes_requested: 'Changes Requested', rejected: 'Rejected',
};
