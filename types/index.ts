export type ListingType = 'place' | 'artist' | 'event' | 'performance' | 'workshop' | 'practice';
export type ExperienceType = 'visit' | 'attend' | 'learn' | 'meet';
export type VerificationStatus = 'demo' | 'unverified' | 'under_review' | 'verified';
export type SubmissionStatus = 'pending_review' | 'approved' | 'changes_requested' | 'rejected';
export type Role = 'user' | 'contributor' | 'admin';

export interface Category { id: string; name: string; description: string | null; icon: string | null }
export interface Source { source_name: string; source_url: string; source_type: string | null; description?: string | null }
export interface ExternalLink { label: string; url: string }
export interface ContactInfo { website?: string; email?: string; phone?: string; social?: string }

export interface Listing {
  id: string; title: string; slug: string; listing_type: ListingType; category_id: string | null;
  description: string; cultural_background: string | null; district: string | null; location_name: string | null;
  address: string | null; latitude: number; longitude: number; cover_image: string | null;
  practitioner_name: string | null; experience_type: ExperienceType | null;
  contact_information: ContactInfo; external_links: ExternalLink[];
  event_start: string | null; event_end: string | null; event_start_time: string | null; event_end_time: string | null;
  date_note: string | null; venue: string | null; participation_info: string | null;
  verification_status: VerificationStatus; is_visible: boolean; published_at: string | null;
  created_at: string; updated_at: string; sources: Source[];
}

export interface Relationship { id: string; source_listing_id: string; related_listing_id: string; relationship_type: string; description: string | null }
export interface RelatedListing { listing: Listing; relationship_type: string; description: string | null }

export interface Profile { id: string; full_name: string | null; email: string | null; role: Role; created_at: string }

/** Shape stored in submissions.listing_data (and edited by the contribution form). */
export interface SubmissionData {
  listing_type: ListingType; title: string; category_id: string; description: string; cultural_background: string;
  district: string; location_name: string; address: string; latitude: number | null; longitude: number | null;
  practitioner_name: string; experience_type: ExperienceType; contact_information: ContactInfo; external_links: ExternalLink[];
  event_start: string; event_end: string; event_start_time: string; event_end_time: string; venue: string; participation_info: string;
  sources: Source[]; images: string[]; contributor_note: string;
}
export interface Submission {
  id: string; contributor_id: string; listing_id: string | null; listing_data: SubmissionData; status: SubmissionStatus;
  admin_feedback: string | null; reviewed_by: string | null; reviewed_at: string | null; created_at: string; updated_at: string;
}
export interface Review { id: string; submission_id: string; admin_id: string; decision: SubmissionStatus; comments: string | null; created_at: string }
