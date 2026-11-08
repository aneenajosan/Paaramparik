'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, CalendarDays, Navigation, Clock, Trash2 } from 'lucide-react';
import CoverArt from './CoverArt';
import FavoriteButton from './FavoriteButton';
import { TYPE_META } from '@/lib/listing-meta';
import { eventLabel } from '@/lib/utils';
import { isStoredCreatedEvent, deleteStoredEvent } from '@/lib/created-events';
import type { Category, Listing } from '@/types';

export default function ListingCard({
  listing,
  category,
  distanceKm,
}: {
  listing: Listing;
  category?: Category;
  distanceKm?: number;
}) {
  const [isDeletable, setIsDeletable] = useState(false);

  useEffect(() => {
    setIsDeletable(isStoredCreatedEvent(listing.id));
  }, [listing.id]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to delete "${listing.title}"? This cannot be undone.`
    );
    if (!confirmed) return;
    await deleteStoredEvent(listing.id);
  };

  const when = eventLabel(listing);
  const typeMeta = TYPE_META[listing.listing_type];

  // Determine cost display (from experience_type or participation_info or default free)
  const isFree =
    !listing.participation_info ||
    listing.participation_info.toLowerCase().includes('free') ||
    listing.experience_type === 'visit';

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-crimson-800/80 bg-crimson-900/50 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-saffron-500/80 hover:shadow-xl hover:shadow-crimson-950/60">
      <div className="relative">
        <CoverArt listing={listing} className="h-44 w-full" />

        {/* Top-left category/type badge overlay */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold backdrop-blur-md shadow-sm text-cream"
            style={{ backgroundColor: `${typeMeta.color}dd` }}
          >
            <span>{typeMeta.glyph}</span>
            <span>{typeMeta.label}</span>
          </span>
        </div>

        {/* Top-right overlay actions: Delete if created + Favorite */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          {isDeletable && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-full bg-rose-950/90 border border-rose-600/70 p-1.5 text-rose-300 hover:bg-rose-900 hover:text-white transition-colors shadow-md cursor-pointer"
              title="Delete this created event"
            >
              <Trash2 size={13} />
            </button>
          )}
          <FavoriteButton listingId={listing.id} />
        </div>
      </div>

      <Link href={`/listings/${listing.slug}`} className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-display text-lg font-bold leading-snug text-cream transition-colors group-hover:text-saffron-400">
          {listing.title}
        </h3>

        {/* Date & Time */}
        <div className="mt-2.5 flex items-center gap-2 text-xs text-saffron-400">
          <CalendarDays size={13} className="shrink-0" />
          <span className="truncate">{when || 'Annual / Ongoing tradition'}</span>
          {listing.event_start_time && (
            <span className="flex items-center gap-1 text-cream-muted/70">
              <Clock size={11} />
              {listing.event_start_time.slice(0, 5)}
            </span>
          )}
        </div>

        {/* Location */}
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-cream-muted">
          <MapPin size={13} className="shrink-0 text-cream-muted/80" />
          <span className="truncate">{listing.location_name ?? listing.district}</span>
          {distanceKm !== undefined && (
            <span className="ml-auto inline-flex items-center gap-1 font-medium text-saffron-500">
              <Navigation size={11} />
              {distanceKm.toFixed(1)} km
            </span>
          )}
        </p>

        {/* Short description */}
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-cream/80">
          {listing.description}
        </p>

        {/* Bottom Tags & Cost */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-crimson-800/40">
          <div className="flex flex-wrap items-center gap-1.5">
            {category && (
              <span className="rounded bg-crimson-950/80 px-2 py-0.5 text-[11px] font-medium text-cream-muted">
                {category.name.split('&')[0].trim()}
              </span>
            )}
            <span className="rounded bg-crimson-950/80 px-2 py-0.5 text-[11px] font-medium text-cream-muted">
              {listing.experience_type || 'Heritage'}
            </span>
          </div>

          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              isFree
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                : 'bg-saffron-950/80 text-saffron-400 border border-saffron-800/60'
            }`}
          >
            {isFree ? 'Free' : 'Ticketed'}
          </span>
        </div>
      </Link>
    </article>
  );
}
