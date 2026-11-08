'use client';

import { deleteCulturalEvent } from './api-client';
import type { Listing } from '@/types';

const STORAGE_KEY = 'paaramparik_community_created_events_v1';
export const EVENT_CHANGE_EVENT = 'paaramparik:created_events_updated';

/**
 * Retrieves all user-created events from local storage.
 * Safe for SSR (returns [] if window is undefined).
 */
export function getStoredCreatedEvents(): Listing[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Error reading created events from localStorage:', err);
    return [];
  }
}

/**
 * Saves a newly created event into local storage and notifies active views.
 */
export function saveCreatedEvent(listing: Listing): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredCreatedEvents();
    // Prepend so the newest event is at the top
    const updated = [listing, ...existing.filter((item) => item.id !== listing.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_CHANGE_EVENT, { detail: { action: 'create', listing } }));
  } catch (err) {
    console.error('Error saving created event to localStorage:', err);
  }
}

/**
 * Deletes a created event by ID from both local storage and the backend API.
 */
export async function deleteStoredEvent(id: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    // 1. Remove from local storage
    const existing = getStoredCreatedEvents();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // 2. Dispatch change event to re-render all maps & cards immediately
    window.dispatchEvent(new CustomEvent(EVENT_CHANGE_EVENT, { detail: { action: 'delete', id } }));

    // 3. Inform backend API in background
    try {
      await deleteCulturalEvent(id);
    } catch (e) {
      // Non-fatal if backend is offline in local dev
    }

    return true;
  } catch (err) {
    console.error('Error deleting event:', err);
    return false;
  }
}

/**
 * Checks whether an event ID belongs to a user-created event.
 */
export function isStoredCreatedEvent(id: string): boolean {
  if (typeof window === 'undefined') return false;
  const list = getStoredCreatedEvents();
  return list.some((e) => e.id === id);
}

/**
 * Subscribes to event creation/deletion events to keep components synchronized.
 */
export function subscribeToEventChanges(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT_CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(EVENT_CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

/**
 * Converts form submission data into a fully-formed Listing compatible with map & grids
 */
export function buildListingFromSubmission(eventId: string, payload: any): Listing {
  const slug = `${payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${eventId.slice(-4)}`;

  return {
    id: eventId,
    title: payload.title,
    slug,
    listing_type: 'event',
    category_id: null,
    description: payload.description,
    cultural_background: payload.culturalBackground || null,
    district: payload.locality,
    location_name: payload.locality + (payload.neighborhood ? ` (${payload.neighborhood})` : ''),
    address: payload.address,
    latitude: payload.latitude,
    longitude: payload.longitude,
    cover_image: null,
    practitioner_name: payload.organizerName,
    experience_type: 'attend',
    contact_information: {
      email: payload.organizerEmail,
      phone: payload.organizerPhone,
    },
    external_links: (payload.resources || []).map((r: any) => ({
      label: r.resourceTitle,
      url: r.resourceUrl,
    })),
    event_start: payload.eventDate,
    event_end: payload.eventEnd || payload.eventDate,
    event_start_time: payload.startTime,
    event_end_time: payload.endTime,
    date_note: null,
    venue: payload.address,
    participation_info: payload.costType || 'Free',
    verification_status: 'verified',
    is_visible: true,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sources: (payload.resources || []).map((r: any) => ({
      source_name: r.resourceTitle,
      source_url: r.resourceUrl,
      source_type: r.resourceType,
    })),
  };
}
