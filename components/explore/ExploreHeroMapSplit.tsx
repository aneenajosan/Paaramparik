'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  CalendarDays,
} from 'lucide-react';
import CultureMap from '@/components/map/CultureMap';
import FilterModal from './FilterModal';
import { EXPERIENCE_LABEL } from '@/lib/listing-meta';
import type { Category, Listing } from '@/types';
import type { Filters } from '@/lib/filter';

const FAMOUS_STATES = [
  { label: 'All India', value: '', icon: '🇮🇳' },
  { label: 'Kerala', value: 'Kerala', icon: '🌴' },
  { label: 'Tamil Nadu', value: 'Tamil Nadu', icon: '🛕' },
  { label: 'Karnataka', value: 'Karnataka', icon: '🐘' },
  { label: 'Maharashtra', value: 'Maharashtra', icon: '🥁' },
  { label: 'Rajasthan', value: 'Rajasthan', icon: '🐪' },
  { label: 'West Bengal', value: 'West Bengal', icon: '🎭' },
  { label: 'Odisha', value: 'Odisha', icon: '🛞' },
  { label: 'Uttar Pradesh', value: 'Uttar Pradesh', icon: '🪔' },
  { label: 'Gujarat', value: 'Gujarat', icon: '🪅' },
  { label: 'Assam & NE', value: 'Northeast', icon: '🦏' },
  { label: 'Punjab', value: 'Punjab', icon: '🌾' },
];

interface ExploreHeroMapSplitProps {
  listings: Listing[];
  totalListingsCount?: number;
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
  totalListingsCount,
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
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  // Listen for state selection from map clicks or marker popups
  useEffect(() => {
    const handleSelectState = (e: Event) => {
      const customEvent = e as CustomEvent<{ state: string }>;
      if (customEvent.detail?.state) {
        onFilterChange('location', customEvent.detail.state);
      }
    };
    window.addEventListener('lcm:select-state', handleSelectState);
    return () => window.removeEventListener('lcm:select-state', handleSelectState);
  }, [onFilterChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    if (filters.datePreset || filters.from || filters.to) count++;
    if (filters.cost) count++;
    if (filters.types && filters.types.length > 0) count++;
    return count;
  }, [filters]);

  const total = totalListingsCount || listings.length;

  return (
    <>
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
                Showing <strong className="text-saffron-400">{listings.length}</strong> of{' '}
                {total} living traditions
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

          {/* Right: Live Interactive Map with Full Clickable Filter Toolbar (7 cols on lg) */}
          <div className="relative flex flex-col rounded-3xl border border-crimson-800 bg-crimson-950/90 shadow-2xl lg:col-span-7">
            {/* Top Pill Filter Toolbar */}
            <div
              ref={toolbarRef}
              className="flex flex-wrap items-center gap-2 p-3 sm:p-4 border-b border-crimson-800/80 bg-crimson-900/60 backdrop-blur-sm relative z-[1001] rounded-t-3xl"
            >
              {/* Clickable Filters Master Button */}
              <button
                type="button"
                onClick={() => setFilterModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${
                  activeFilterCount > 0
                    ? 'border-saffron-400 bg-saffron-500 text-crimson-950 font-bold shadow-md shadow-saffron-500/20'
                    : 'border-crimson-700/80 bg-crimson-950 text-cream hover:bg-crimson-900'
                }`}
                aria-label="Open advanced filters"
              >
                <SlidersHorizontal size={13} className={activeFilterCount > 0 ? 'text-crimson-950' : 'text-saffron-400'} />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-crimson-950 text-[10px] font-bold text-saffron-400">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Art Form Filter Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('artForm')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    filters.category
                      ? 'border-saffron-400 bg-saffron-950/80 text-saffron-400 font-bold shadow-sm'
                      : 'border-crimson-800 bg-crimson-950/80 text-cream-muted hover:text-cream hover:border-crimson-700'
                  }`}
                >
                  <span>
                    {filters.category
                      ? categories.find((c) => c.id === filters.category)?.name.split('&')[0].trim() || 'Art Form'
                      : 'Art Form'}
                  </span>
                  {filters.category ? (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onFilterChange('category', '');
                      }}
                      className="hover:text-cream ml-0.5"
                    >
                      <X size={12} />
                    </span>
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>

                {activeDropdown === 'artForm' && (
                  <div className="absolute top-full left-0 z-[1002] mt-1.5 w-52 rounded-xl border border-crimson-700 bg-crimson-950 p-1.5 shadow-2xl max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        onFilterChange('category', '');
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-crimson-900 text-cream font-medium"
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
                        className={`w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-crimson-900 transition-colors ${
                          filters.category === c.id
                            ? 'text-saffron-400 font-bold bg-crimson-900/60'
                            : 'text-cream/90'
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    filters.location
                      ? 'border-saffron-400 bg-saffron-950/80 text-saffron-400 font-bold shadow-sm'
                      : 'border-crimson-800 bg-crimson-950/80 text-cream-muted hover:text-cream hover:border-crimson-700'
                  }`}
                >
                  <MapPin size={11} className={filters.location ? 'text-saffron-400' : 'text-cream-muted'} />
                  <span>{filters.location || 'Location'}</span>
                  {filters.location ? (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onFilterChange('location', '');
                      }}
                      className="hover:text-cream ml-0.5"
                    >
                      <X size={12} />
                    </span>
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>

                {activeDropdown === 'location' && (
                  <div className="absolute top-full left-0 z-[1002] mt-1.5 w-48 max-h-56 overflow-y-auto rounded-xl border border-crimson-700 bg-crimson-950 p-1.5 shadow-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        onFilterChange('location', '');
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-crimson-900 text-cream font-medium"
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
                        className={`w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-crimson-900 transition-colors ${
                          filters.location === loc
                            ? 'text-saffron-400 font-bold bg-crimson-900/60'
                            : 'text-cream/90'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Filter Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('date')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    filters.datePreset || filters.from || filters.to
                      ? 'border-saffron-400 bg-saffron-950/80 text-saffron-400 font-bold shadow-sm'
                      : 'border-crimson-800 bg-crimson-950/80 text-cream-muted hover:text-cream hover:border-crimson-700'
                  }`}
                >
                  <CalendarDays size={11} className={filters.datePreset ? 'text-saffron-400' : 'text-cream-muted'} />
                  <span>
                    {filters.datePreset === 'upcoming'
                      ? 'Upcoming'
                      : filters.datePreset === 'today'
                      ? 'Today'
                      : filters.datePreset === 'month'
                      ? 'This Month'
                      : filters.from || filters.to
                      ? 'Custom Date'
                      : 'Date'}
                  </span>
                  {filters.datePreset || filters.from || filters.to ? (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onFilterChange('datePreset', '');
                        onFilterChange('from', '');
                        onFilterChange('to', '');
                      }}
                      className="hover:text-cream ml-0.5"
                    >
                      <X size={12} />
                    </span>
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>

                {activeDropdown === 'date' && (
                  <div className="absolute top-full left-0 z-[1002] mt-1.5 w-48 rounded-xl border border-crimson-700 bg-crimson-950 p-1.5 shadow-2xl">
                    {[
                      { id: '', label: 'All Dates' },
                      { id: 'upcoming', label: 'Upcoming Events' },
                      { id: 'today', label: 'Today Only' },
                      { id: 'month', label: 'This Month' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          onFilterChange('datePreset', d.id as any);
                          setActiveDropdown(null);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-crimson-900 transition-colors ${
                          (filters.datePreset || '') === d.id
                            ? 'text-saffron-400 font-bold bg-crimson-900/60'
                            : 'text-cream/90'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                    <div className="border-t border-crimson-800/60 my-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterModalOpen(true);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs rounded-lg text-saffron-400 hover:bg-crimson-900 font-medium"
                      >
                        Custom Date Range…
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Experience Type Filter Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('experience')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    filters.experience
                      ? 'border-saffron-400 bg-saffron-950/80 text-saffron-400 font-bold shadow-sm'
                      : 'border-crimson-800 bg-crimson-950/80 text-cream-muted hover:text-cream hover:border-crimson-700'
                  }`}
                >
                  <Layers size={11} className={filters.experience ? 'text-saffron-400' : 'text-cream-muted'} />
                  <span>
                    {filters.experience
                      ? EXPERIENCE_LABEL[filters.experience as keyof typeof EXPERIENCE_LABEL] || 'Experience'
                      : 'Experience Type'}
                  </span>
                  {filters.experience ? (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onFilterChange('experience', '');
                      }}
                      className="hover:text-cream ml-0.5"
                    >
                      <X size={12} />
                    </span>
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>

                {activeDropdown === 'experience' && (
                  <div className="absolute top-full left-0 z-[1002] mt-1.5 w-48 rounded-xl border border-crimson-700 bg-crimson-950 p-1.5 shadow-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        onFilterChange('experience', '');
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-crimson-900 text-cream font-medium"
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
                        className={`w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-crimson-900 transition-colors ${
                          filters.experience === k
                            ? 'text-saffron-400 font-bold bg-crimson-900/60'
                            : 'text-cream/90'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Cost Filter Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('cost')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    filters.cost
                      ? 'border-saffron-400 bg-saffron-950/80 text-saffron-400 font-bold shadow-sm'
                      : 'border-crimson-800 bg-crimson-950/80 text-cream-muted hover:text-cream hover:border-crimson-700'
                  }`}
                >
                  <CircleDollarSign size={11} className={filters.cost ? 'text-saffron-400' : 'text-cream-muted'} />
                  <span>
                    {filters.cost === 'free' ? 'Free Only' : filters.cost === 'paid' ? 'Ticketed' : 'Cost'}
                  </span>
                  {filters.cost ? (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onFilterChange('cost', '');
                      }}
                      className="hover:text-cream ml-0.5"
                    >
                      <X size={12} />
                    </span>
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>

                {activeDropdown === 'cost' && (
                  <div className="absolute top-full left-0 z-[1002] mt-1.5 w-44 rounded-xl border border-crimson-700 bg-crimson-950 p-1.5 shadow-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        onFilterChange('cost', '');
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-crimson-900 text-cream font-medium"
                    >
                      All Costs
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onFilterChange('cost', 'free');
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-crimson-900 transition-colors ${
                        filters.cost === 'free' ? 'text-emerald-400 font-bold bg-crimson-900/60' : 'text-cream/90'
                      }`}
                    >
                      Free Only
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onFilterChange('cost', 'paid');
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-crimson-900 transition-colors ${
                        filters.cost === 'paid' ? 'text-saffron-400 font-bold bg-crimson-900/60' : 'text-cream/90'
                      }`}
                    >
                      Ticketed / Paid
                    </button>
                  </div>
                )}
              </div>

              {/* Reset All Filters action */}
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="flex items-center gap-1 text-xs text-saffron-400 hover:text-saffron-300 ml-auto font-semibold px-2 py-1 rounded hover:bg-crimson-900/40 transition-colors"
                >
                  <X size={12} />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Interactive Famous State Cultural Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2 bg-crimson-950/90 border-b border-crimson-800/60 scrollbar-none text-xs z-20">
              <span className="text-[11px] font-bold text-cream-muted uppercase tracking-wider shrink-0 mr-1">
                Explore Culture:
              </span>
              {FAMOUS_STATES.map((st) => {
                const isActive =
                  st.value === ''
                    ? !filters.location
                    : (filters.location || '').toLowerCase().includes(st.value.toLowerCase()) ||
                      (st.value === 'Northeast' &&
                        ['assam', 'nagaland', 'manipur', 'meghalaya', 'northeast'].some((n) =>
                          (filters.location || '').toLowerCase().includes(n)
                        ));
                return (
                  <button
                    key={st.label}
                    type="button"
                    onClick={() => onFilterChange('location', st.value)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-saffron-500 text-crimson-950 font-bold shadow-sm'
                        : 'bg-crimson-900/70 text-cream/90 hover:bg-crimson-800 hover:text-white border border-crimson-800/60'
                    }`}
                  >
                    <span>{st.icon}</span>
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active State Feedback Bar */}
            {filters.location && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-saffron-500/15 border-b border-saffron-500/30 text-xs text-saffron-300 z-20">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={12} className="text-saffron-400" />
                  <span>
                    Showing famous cultural traditions in <strong>{filters.location}</strong> ({listings.length} traditions found)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onFilterChange('location', '')}
                  className="text-[11px] underline hover:text-white ml-2 font-semibold cursor-pointer"
                >
                  Show All India
                </button>
              </div>
            )}

            {/* Interactive Map */}
            <div className="relative h-[360px] sm:h-[420px] w-full overflow-hidden rounded-b-3xl z-10">
              <CultureMap
                listings={listings}
                user={userPosition}
                height="100%"
                scrollZoom={false}
                onSelectState={(st) => onFilterChange('location', st)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Filter Modal / Drawer */}
      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={filters}
        categories={categories}
        localities={localities}
        onFilterChange={onFilterChange}
        onResetFilters={onResetFilters}
        totalCount={total}
        filteredCount={listings.length}
      />
    </>
  );
}
