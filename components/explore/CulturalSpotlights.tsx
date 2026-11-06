'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sun, ArrowRight, MapPin, Sparkles } from 'lucide-react';
import type { Listing } from '@/types';

interface CulturalSpotlightsProps {
  storyListing?: Listing | null;
  listings: Listing[];
  onSelectLocation?: (locationName: string) => void;
}

export default function CulturalSpotlights({
  storyListing,
  listings,
  onSelectLocation,
}: CulturalSpotlightsProps) {
  // Aggregate top localities with counts
  const locationCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    listings.forEach((l) => {
      const loc = l.location_name || l.district;
      if (loc) {
        counts[loc] = (counts[loc] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [listings]);

  const storyImg =
    storyListing?.cover_image ||
    'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
      {/* Daily Cultural Story Widget */}
      {storyListing && (
        <article className="overflow-hidden rounded-2xl border border-crimson-800/80 bg-crimson-900/60 p-5 shadow-lg transition-all hover:border-saffron-500/80">
          <div className="flex items-center gap-2 text-xs font-bold text-saffron-400 mb-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-saffron-500/20">
              <Sun size={13} className="text-saffron-400" />
            </span>
            <span className="uppercase tracking-wider">Daily Cultural Story</span>
          </div>

          <div className="relative h-40 w-full overflow-hidden rounded-xl bg-crimson-950 mb-3.5">
            <Image
              src={storyImg}
              alt={storyListing.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-crimson-950/80 via-transparent to-transparent pointer-events-none" />
          </div>

          <h3 className="font-display text-lg font-bold text-cream line-clamp-1">
            {storyListing.title}
          </h3>

          <p className="mt-1.5 text-xs text-cream-muted line-clamp-2 leading-relaxed">
            {storyListing.cultural_background || storyListing.description}
          </p>

          <div className="mt-4 flex items-center justify-between pt-2 border-t border-crimson-800/40">
            <Link
              href={`/listings/${storyListing.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-saffron-400 hover:text-saffron-300 transition-colors"
            >
              <span>Read story</span>
              <ArrowRight size={13} />
            </Link>

            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-4 rounded-full bg-saffron-500" />
              <span className="h-1.5 w-1.5 rounded-full bg-crimson-800" />
              <span className="h-1.5 w-1.5 rounded-full bg-crimson-800" />
            </div>
          </div>
        </article>
      )}

      {/* Popular Cultural Locations Widget */}
      <div className="overflow-hidden rounded-2xl border border-crimson-800/80 bg-crimson-900/60 p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-bold text-cream">
            Popular Locations
          </h3>
          <span className="text-xs font-semibold text-saffron-500">Thrissur District</span>
        </div>

        <div className="space-y-3">
          {locationCounts.map(([loc, count], idx) => {
            const locImages = [
              'https://images.unsplash.com/photo-1621847468516-1ed5d0df56fe?auto=format&fit=crop&w=400&q=80',
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
              'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=400&q=80',
            ];
            const img = locImages[idx % locImages.length];

            return (
              <button
                key={loc}
                type="button"
                onClick={() => {
                  if (onSelectLocation) onSelectLocation(loc);
                  const el = document.getElementById('cultural-directory-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-crimson-800/50 cursor-pointer"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-crimson-950">
                  <Image src={img} alt={loc} fill unoptimized className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="shrink-0 text-saffron-400" />
                    <span className="text-xs font-bold text-cream truncate group-hover:text-saffron-300">
                      {loc}
                    </span>
                  </div>
                  <p className="text-[11px] text-cream-muted mt-0.5">
                    {count} {count === 1 ? 'tradition' : 'traditions & events'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

