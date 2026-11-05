import { haversineKm } from '@/lib/utils';
import type { Listing, ListingType } from '@/types';

export interface Filters { q: string; types: ListingType[]; category: string; location: string; from: string; to: string; experience: string; organiser: string }
export const EMPTY_FILTERS: Filters = { q: '', types: [], category: '', location: '', from: '', to: '', experience: '', organiser: '' };
export type Sort = 'relevance' | 'distance' | 'date';

const hay = (l: Listing) => [l.title, l.description, l.cultural_background, l.location_name, l.district, l.practitioner_name].join(' ').toLowerCase();

export function relevance(l: Listing, q: string) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return 0;
  const title = l.title.toLowerCase(), all = hay(l);
  return terms.reduce((s, t) => s + (title.includes(t) ? 3 : 0) + (all.includes(t) ? 1 : 0), 0);
}

export function filterListings(listings: Listing[], f: Filters): Listing[] {
  const terms = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  return listings.filter((l) => {
    if (terms.length && !terms.every((t) => hay(l).includes(t))) return false;
    if (f.types.length && !f.types.includes(l.listing_type)) return false;
    if (f.category && l.category_id !== f.category) return false;
    if (f.experience && l.experience_type !== f.experience) return false;
    if (f.location && ![l.location_name, l.district, l.address].join(' ').toLowerCase().includes(f.location.toLowerCase())) return false;
    if (f.organiser && !(l.practitioner_name ?? '').toLowerCase().includes(f.organiser.toLowerCase())) return false;
    if (f.from || f.to) {
      if (!l.event_start) return false; // date filters only match dated events
      const end = l.event_end ?? l.event_start;
      if (f.from && end < f.from) return false;
      if (f.to && l.event_start > f.to) return false;
    }
    return true;
  });
}

export function sortListings(list: Listing[], sort: Sort, q: string, pos: { lat: number; lng: number } | null) {
  const out = [...list];
  if (sort === 'distance' && pos) out.sort((a, b) => haversineKm(pos, { lat: a.latitude, lng: a.longitude }) - haversineKm(pos, { lat: b.latitude, lng: b.longitude }));
  else if (sort === 'date') out.sort((a, b) => (a.event_start ?? '9999').localeCompare(b.event_start ?? '9999') || a.title.localeCompare(b.title));
  else out.sort((a, b) => relevance(b, q) - relevance(a, q) || a.title.localeCompare(b.title));
  return out;
}
