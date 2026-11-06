'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  CircleDollarSign,
  LocateFixed,
  X,
} from 'lucide-react';
import CultureMap from '@/components/map/CultureMap';
import { EXPERIENCE_LABEL } from '@/lib/listing-meta';
import type { Category, Listing } from '@/types';
import type { Filters } from '@/lib/filter';

interface ExploreHeroMapSplitProps {
  listings: Listing[];
  categories: Category[];
  filters: Filters;
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onResetFilters: () => void;
  userPosition?: { lat: number; lng: number } | null;
  onLocate: () => void;
  locateStatus: string;
}

export default function ExploreHeroMapSplit({
  listings,
  categories,
  filters,
  onFilterChange,
  onResetFilters,
  userPosition,
  onLocate,
  locateStatus,
}: ExploreHeroMapSplitProps) {
  const [localQuery, setLocalQuery] = useState(filters.q || '');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange('q', localQuery);
  };

  const localities = React.useMemo(() => {
    return Array.from(
      new Set(listings.flatMap((l) => [l.location_name, l.district]).filter(Boolean))
    ) as string[];
  }, [listings]);

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.location) count++;
    if (filters.experience) count++;
    if (filters.from || filters.to) count++;
    if (filters.types.length > 0) count++;
    return count;
  }, [filters]);

  return (
    <section className="space-y-4" aria-label="Explore Hero & Interactive Map">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Cultural Hero Banner (5 cols on lg) */}
        <div className="relative overflow-hidden rounded-3xl border border-crimson-800 bg-gradient-to-br from-crimson-950 via-crimson-900 to-crimson-950 p-6 sm:p-8 flex flex-col justify-between shadow-2xl lg:col-span-5">
          {/* Subtle Background Pattern & Cultural Glow */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-saffron-500/10 blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80"
              alt="Kathakali classical dancer"
              fill
              unoptimized
              className="object-cover object-center"
            />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-saffron-500/20 text-saffron-400">
                <Sparkles size={13} />
              </span>
              <p className="eyebrow !text-saffron-400">DISCOVER • CONNECT • PRESERVE</p>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15] text-cream">
              Explore{' '}
              <span className="font-samarkan text-4xl sm:text-5xl lg:text-6xl text-saffron-400 font-normal tracking-wide block">
                Paaramparik
              </span>
              traditions around you
            </h1>

            <p className="text-sm leading-relaxed text-cream/80 max-w-md">
              Find local cultural events, master artisans, historic temple rituals, classical
              dance performances and craft workshops — all in one unified map.
            </p>

            {/* In-Hero Search Input */}
            <form onSubmit={handleSearchSubmit} className="pt-2">
              <div className="relative flex items-center rounded-full border border-crimson-700/80 bg-crimson-950/90 p-1.5 shadow-inner backdrop-blur-md transition-all focus-within:border-saffron-400 focus-within:ring-2 focus-within:ring-saffron-400/20">
                <Search size={18} className="ml-3 text-cream-muted shrink-0" />
                <input
                  type="text"
                  value={localQuery}
                  onChange={(e) => {
                    setLocalQuery(e.target.value);
                    onFilterChange('q', e.target.value);
                  }}
                  placeholder="Search events, places, artists…"
                  className="w-full bg-transparent px-3 py-2 text-sm text-cream placeholder:text-cream-muted/60 focus:outline-none"
                  aria-label="Search cultural events"
                />
                <button
                  type="submit"
                  className="rounded-full bg-crimson-600 hover:bg-crimson-500 text-cream px-5 py-2 text-xs font-bold shadow-md transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Quick stats counter */}
          <div className="relative z-10 mt-6 pt-4 border-t border-crimson-800/40 flex items-center justify-between text-xs text-cream-muted">
            <span>
              Showing <strong className="text-saffron-400">{listings.length}</strong> living
              traditions
            </span>
            <button
              type="button"
              onClick={onLocate}
              className="inline-flex items-center gap-1.5 text-xs text-saffron-400 hover:text-saffron-300 font-semibold transition-colors"
            >
              <LocateFixed size={13} />
              <span>{locateStatus === 'granted' ? 'Nearby located' : 'Near me'}</span>
            </button>
          </div>
        </div>

        {/* Right: Live Interactive Map with Pill Filter Toolbar (7 cols on lg) */}
        <div className="flex flex-col rounded-3xl border border-stone-200/90 bg-white shadow-md overflow-hidden lg:col-span-7">
          {/* Top Pill Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4 border-b border-stone-200 bg-[#FAF7F2] backdrop-blur-sm">
            {/* Filter Toggle Button */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-stone-300 text-xs font-semibold text-stone-800 shadow-2xs">
              <SlidersHorizontal size={13} className="text-saffron-600" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-saffron-500 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </div>

            {/* Art Form Filter Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('artForm')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors shadow-2xs ${
                  filters.category
                    ? 'border-saffron-500 bg-saffron-50 text-saffron-800 font-semibold'
                    : 'border-stone-300 bg-white text-stone-700 hover:text-stone-900 hover:border-stone-400'
                }`}
              >
                <span>
                  {filters.category
                    ? categories.find((c) => c.id === filters.category)?.name || 'Art Form'
                    : 'Art Form'}
                </span>
                <ChevronDown size={12} />
              </button>

              {activeDropdown === 'artForm' && (
                <div className="absolute top-full left-0 z-50 mt-1.5 w-48 rounded-xl border border-stone-200 bg-white p-1.5 shadow-2xl text-stone-800">
                  <button
                    type="button"
                    onClick={() => {
                      onFilterChange('category', '');
                      setActiveDropdown(null);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-stone-50 text-stone-800"
                  >
                    All Art Forms
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onFilterChange('category', c.id);
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-stone-50 transition-colors ${
                        filters.category === c.id
                          ? 'text-saffron-800 font-bold bg-saffron-50'
                          : 'text-stone-800'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Location Filter Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('location')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors shadow-2xs ${
                  filters.location
                    ? 'border-saffron-500 bg-saffron-50 text-saffron-800 font-semibold'
                    : 'border-stone-300 bg-white text-stone-700 hover:text-stone-900 hover:border-stone-400'
                }`}
              >
                <MapPin size={11} className="text-saffron-600" />
                <span>{filters.location || 'Location'}</span>
                <ChevronDown size={12} />
              </button>

              {activeDropdown === 'location' && (
                <div className="absolute top-full left-0 z-50 mt-1.5 w-48 max-h-56 overflow-y-auto rounded-xl border border-stone-200 bg-white p-1.5 shadow-2xl text-stone-800">
                  <button
                    type="button"
                    onClick={() => {
                      onFilterChange('location', '');
                      setActiveDropdown(null);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-stone-50 text-stone-800"
                  >
                    All Locations
                  </button>
                  {localities.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        onFilterChange('location', loc);
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-stone-50 transition-colors ${
                        filters.location === loc
                          ? 'text-saffron-800 font-bold bg-saffron-50'
                          : 'text-stone-800'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Experience Type Filter Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('experience')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors shadow-2xs ${
                  filters.experience
                    ? 'border-saffron-500 bg-saffron-50 text-saffron-800 font-semibold'
                    : 'border-stone-300 bg-white text-stone-700 hover:text-stone-900 hover:border-stone-400'
                }`}
              >
                <Layers size={11} className="text-saffron-600" />
                <span>
                  {filters.experience
                    ? EXPERIENCE_LABEL[filters.experience as keyof typeof EXPERIENCE_LABEL] ||
                      'Experience'
                    : 'Experience Type'}
                </span>
                <ChevronDown size={12} />
              </button>

              {activeDropdown === 'experience' && (
                <div className="absolute top-full left-0 z-50 mt-1.5 w-48 rounded-xl border border-stone-200 bg-white p-1.5 shadow-2xl text-stone-800">
                  <button
                    type="button"
                    onClick={() => {
                      onFilterChange('experience', '');
                      setActiveDropdown(null);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-stone-50 text-stone-800"
                  >
                    Any Experience
                  </button>
                  {Object.entries(EXPERIENCE_LABEL).map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        onFilterChange('experience', k);
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-stone-50 transition-colors ${
                        filters.experience === k
                          ? 'text-saffron-800 font-bold bg-saffron-50'
                          : 'text-stone-800'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reset Filters action */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                className="flex items-center gap-1 text-xs text-saffron-600 hover:text-saffron-700 ml-auto font-semibold"
              >
                <X size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Interactive Map */}
          <div className="relative h-[360px] sm:h-[420px] w-full">
            <CultureMap listings={listings} user={userPosition} height="100%" scrollZoom={false} />
          </div>
        </div>
      </div>
    </section>
  );
}

