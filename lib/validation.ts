import type { SubmissionData } from '@/types';

export type Errors = Partial<Record<string, string>>;
const isUrl = (v: string) => { try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } };
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function validateSubmission(d: SubmissionData): Errors {
  const e: Errors = {};
  if (d.title.trim().length < 3) e.title = 'Enter a name of at least 3 characters.';
  if (!d.category_id) e.category_id = 'Choose an art-form category.';
  if (d.description.trim().length < 40) e.description = 'Describe the listing in at least 40 characters.';
  if (d.latitude == null || d.longitude == null) e.location = 'Pick the location on the map or enter coordinates.';
  else if (Math.abs(d.latitude) > 90 || Math.abs(d.longitude) > 180) e.location = 'Coordinates are out of range.';
  if (!d.district.trim()) e.district = 'Enter the district.';
  if (d.contact_information.email && !isEmail(d.contact_information.email)) e.email = 'Enter a valid email address.';
  if (d.contact_information.website && !isUrl(d.contact_information.website)) e.website = 'Website must start with http:// or https://';
  d.external_links.forEach((l, i) => { if (l.url && !isUrl(l.url)) e[`link${i}`] = 'Enter a valid http(s) URL.'; });
  const real = d.sources.filter((s) => s.source_url.trim() || s.source_name.trim());
  if (!real.length) e.sources = 'Add at least one source or reference.';
  real.forEach((s, i) => {
    if (!s.source_name.trim()) e[`source${i}`] = 'Name the source.';
    else if (!isUrl(s.source_url)) e[`source${i}`] = 'Enter a valid http(s) URL for this source.';
  });
  if (d.event_start && d.event_end && d.event_end < d.event_start) e.event_end = 'End date is before the start date.';
  if (d.listing_type === 'event' && !d.event_start) e.event_start = 'Events need a start date.';
  return e;
}
