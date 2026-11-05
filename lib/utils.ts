import type { Listing } from '@/types';

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const formatDate = (d: string | null) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

export function eventLabel(l: Listing): string | null {
  if (l.event_start) {
    const s = formatDate(l.event_start)!, e = l.event_end && l.event_end !== l.event_start ? ` – ${formatDate(l.event_end)}` : '';
    return s + e;
  }
  return l.date_note ? 'Dates not confirmed' : null;
}

export const isUpcoming = (l: Listing, today = new Date().toISOString().slice(0, 10)) =>
  !!l.event_start && (l.event_end ?? l.event_start) >= today;

/** Rotates through listings by calendar day so the story changes daily. */
export function storyOfTheDay(listings: Listing[], date = new Date()) {
  if (!listings.length) return null;
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return listings[day % listings.length];
}
