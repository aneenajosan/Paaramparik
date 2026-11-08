'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Menu,
  Search,
  Map as MapIcon,
  LayoutGrid,
  List,
  SlidersHorizontal,
  LocateFixed,
  ArrowUpDown,
  Sparkles,
  X,
  Layers,
} from 'lucide-react';
import CultureMap from '@/components/map/CultureMap';
import ListingCard from './ListingCard';
import ListingGrid from './ListingGrid';
import ExploreSidebar from '@/components/explore/ExploreSidebar';
import CategoryPillGrid from '@/components/explore/CategoryPillGrid';
import CulturalSpotlights from '@/components/explore/CulturalSpotlights';
import ExploreHeroMapSplit from '@/components/explore/ExploreHeroMapSplit';
import ShareEventBanner from '@/components/explore/ShareEventBanner';
import { TYPE_META, TYPES } from '@/lib/listing-meta';
import { EMPTY_FILTERS, filterListings, sortListings, type Filters, type Sort } from '@/lib/filter';
import { haversineKm, storyOfTheDay, cn } from '@/lib/utils';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getStoredCreatedEvents, subscribeToEventChanges } from '@/lib/created-events';
import type { Category, Listing } from '@/types';

export default function Explorer({
  listings,
  categories,
  defaultView = 'grid',
  initialQuery = '',
  isDirectoryPage = false,
}: {
  listings: Listing[];
  categories: Category[];
  defaultView?: 'map' | 'grid' | 'list';
  initialQuery?: string;
  isDirectoryPage?: boolean;
}) {
  const [f, setF] = useState<Filters>({ ...EMPTY_FILTERS, q: initialQuery });
  const [view, setView] = useState<'map' | 'grid' | 'list'>(isDirectoryPage ? 'list' : defaultView);
  const [sort, setSort] = useState<Sort>('relevance');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [activeSidebarType, setActiveSidebarType] = useState<string>(isDirectoryPage ? 'directory' : '');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [createdEvents, setCreatedEvents] = useState<Listing[]>([]);

  // Synchronize created events with local storage & events
  useEffect(() => {
    setCreatedEvents(getStoredCreatedEvents());
    return subscribeToEventChanges(() => {
      setCreatedEvents(getStoredCreatedEvents());
    });
  }, []);

  const combinedListings = useMemo(() => {
    return [...createdEvents, ...listings];
  }, [createdEvents, listings]);

  const { position, status, locate } = useGeolocation();

  // Track saved listings in localStorage
  useEffect(() => {
    const updateSavedCount = () => {
      try {
        const stored = localStorage.getItem('lcm_saved_listings');
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) setSavedCount(list.length);
        } else {
          setSavedCount(0);
        }
      } catch {
        // ignore
      }
    };
    updateSavedCount();

    const handleSavedUpdated = () => updateSavedCount();
    window.addEventListener('lcm:saved-updated', handleSavedUpdated);
    return () => window.removeEventListener('lcm:saved-updated', handleSavedUpdated);
  }, []);

  const setFilter = useCallback(<K extends keyof Filters>(k: K, v: Filters[K]) => {
    setF((prev) => ({ ...prev, [k]: v }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setF(EMPTY_FILTERS);
    setActiveSidebarType('');
  }, []);

  // Quick sidebar navigation action
  const handleSelectQuickType = (type: string) => {
    if (type === 'saved') {
      try {
        const stored = localStorage.getItem('lcm_saved_listings');
        const list: string[] = stored ? JSON.parse(stored) : [];
        setActiveSidebarType('saved');
        // Filter by matching IDs if any
        if (list.length > 0) {
          setFilter('types', []);
        }
      } catch {
        // ignore
      }
    } else if (type === 'event') {
      setActiveSidebarType('event');
      setFilter('types', ['event']);
    } else if (type === 'artist') {
      setActiveSidebarType('artist');
      setFilter('types', ['artist', 'workshop']);
    } else if (type === 'directory') {
      setActiveSidebarType('directory');
      setView('list');
      setFilter('types', []);
      const el = document.getElementById('cultural-directory-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setActiveSidebarType('');
      setFilter('types', []);
    }
  };

  // Curate Featured events & traditions (top 4 events / places)
  const featuredListings = useMemo(() => {
    const events = combinedListings.filter((l) => l.listing_type === 'event' || l.event_start);
    if (events.length >= 4) return events.slice(0, 4);
    return combinedListings.slice(0, 4);
  }, [combinedListings]);

  // Daily cultural story
  const dailyStory = useMemo(() => storyOfTheDay(combinedListings), [combinedListings]);

  // Filter & sort results
  const results = useMemo(() => {
    let filtered = filterListings(combinedListings, f);

    // If "saved" filter is active, further filter by saved IDs
    if (activeSidebarType === 'saved') {
      try {
        const stored = localStorage.getItem('lcm_saved_listings');
        const list: string[] = stored ? JSON.parse(stored) : [];
        filtered = filtered.filter((l) => list.includes(l.id));
      } catch {
        // ignore
      }
    }

    return sortListings(filtered, sort, f.q, position);
  }, [combinedListings, f, sort, position, activeSidebarType]);

  const distances = useMemo(
    () =>
      position
        ? Object.fromEntries(
            results.map((l) => [l.id, haversineKm(position, { lat: l.latitude, lng: l.longitude })])
          )
        : undefined,
    [results, position]
  );

  const isFiltered = useMemo(() => {
    return (
      JSON.stringify(f) !== JSON.stringify(EMPTY_FILTERS) || activeSidebarType !== ''
    );
  }, [f, activeSidebarType]);

  return (
    <div className="flex min-h-screen bg-crimson-950 text-cream">
      {/* Left Sidebar Navigation (Influenced by Reference Dashboard) */}
      <ExploreSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        savedCount={savedCount}
        onSelectQuickType={handleSelectQuickType}
        activeType={activeSidebarType}
      />

      {/* Main Explore Content Stream */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Floating Dashboard Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-crimson-800/80 bg-crimson-950/95 px-4 sm:px-8 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-cream-muted hover:bg-crimson-900/60 hover:text-cream lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>

            {/* Top Quick Search Bar */}
            <div className="relative w-48 sm:w-80">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cream-muted"
                aria-hidden
              />
              <input
                type="search"
                value={f.q}
                onChange={(e) => setFilter('q', e.target.value)}
                placeholder="Search traditions, places, artists…"
                className="w-full rounded-full border border-crimson-800/80 bg-crimson-900/60 py-2 pl-9 pr-4 text-xs text-cream placeholder:text-cream-muted/60 focus:border-saffron-400 focus:outline-none"
                aria-label="Quick search"
              />
            </div>
          </div>

          {/* Top Quick Navigation Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Explore Top Nav">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-cream-muted hover:text-saffron-400 hover:bg-crimson-900/40 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/explore"
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-saffron-400 bg-crimson-900/80 border border-crimson-800"
            >
              Explore
            </Link>
            <Link
              href="/story"
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-cream-muted hover:text-saffron-400 hover:bg-crimson-900/40 transition-colors"
            >
              Stories
            </Link>
            <Link
              href="/contribute"
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-cream-muted hover:text-saffron-400 hover:bg-crimson-900/40 transition-colors"
            >
              Create Event
            </Link>
            <button
              type="button"
              onClick={() => handleSelectQuickType('directory')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                activeSidebarType === 'directory'
                  ? 'bg-saffron-500 text-crimson-950 font-bold shadow-sm'
                  : 'text-cream-muted hover:text-saffron-400 hover:bg-crimson-900/40'
              }`}
            >
              Cultural Directory
            </button>
          </nav>

          {/* User Location Action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={locate}
              disabled={status === 'loading'}
              className="flex items-center gap-1.5 rounded-full border border-crimson-700/80 bg-crimson-900/50 px-3 py-1.5 text-xs font-semibold text-cream hover:bg-crimson-800/60 transition-colors"
              title="Detect nearby traditions using geolocation"
            >
              <LocateFixed size={13} className="text-saffron-400" />
              <span className="hidden sm:inline">
                {status === 'granted' ? 'Nearby' : status === 'loading' ? 'Locating…' : 'Near me'}
              </span>
            </button>
          </div>
        </header>

        {/* Dashboard Main Scrollable Area */}
        <main className="flex-1 space-y-10 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {isDirectoryPage ? (
            /* Dedicated Cultural Directory Header */
            <div className="rounded-3xl border border-crimson-800 bg-gradient-to-br from-crimson-950 via-crimson-900 to-crimson-950 p-6 sm:p-10 shadow-xl space-y-3">
              <p className="eyebrow !text-saffron-500">Paaramparik Cultural Archive</p>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-cream">
                Cultural Directory
              </h1>
              <p className="text-sm leading-relaxed text-cream-muted max-w-2xl">
                Explore verified heritage places, master artists, traditional performances, craft workshops and seasonal festivals across Indian states and living cultural traditions. Filter by art form, location, or experience.
              </p>
            </div>
          ) : (
            /* Section 1: Hero Spotlight & Interactive Map Split */
            <ExploreHeroMapSplit
              listings={results}
              totalListingsCount={combinedListings.length}
              categories={categories}
              filters={f}
              onFilterChange={setFilter}
              onResetFilters={clearAllFilters}
              userPosition={position}
              onLocate={locate}
              locateStatus={status}
            />
          )}

          {/* Section 2: Featured Events & Traditions Row (Influenced by Reference Grid) */}
          <section className="space-y-4" aria-label="Featured Cultural Events">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-cream">Featured Events</h2>
                <p className="text-xs text-cream-muted mt-0.5">
                  Handpicked authentic rituals, masterclass workshops and seasonal festivals
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSelectQuickType('event')}
                className="text-xs font-bold text-saffron-400 hover:text-saffron-300 transition-colors"
              >
                View all events →
              </button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredListings.map((item) => {
                const cat = categories.find((c) => c.id === item.category_id);
                const dist = distances ? distances[item.id] : undefined;
                return (
                  <ListingCard
                    key={item.id}
                    listing={item}
                    category={cat}
                    distanceKm={dist}
                  />
                );
              })}
            </div>
          </section>

          {/* Section 3: Explore by Category (Category Pills Strip) */}
          <CategoryPillGrid
            categories={categories}
            selectedCategory={f.category}
            onSelectCategory={(catId) => setFilter('category', catId)}
          />

          {/* Section 4: All Traditions & Cultural Spotlights (Split) */}
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Left Column (8 cols): Filterable Listings Stream */}
            <section
              id="cultural-directory-section"
              className="space-y-4 lg:col-span-8 scroll-mt-24"
              aria-label="Browse Traditions"
            >
              {/* Toolbar & Filter Meta */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-crimson-800/80 bg-crimson-900/40 p-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-cream">
                    {activeSidebarType === 'directory'
                      ? 'Cultural Directory'
                      : activeSidebarType === 'saved'
                      ? 'Saved Traditions'
                      : f.category
                      ? categories.find((c) => c.id === f.category)?.name
                      : 'All Cultural Listings'}
                  </h3>
                  <p className="text-xs text-cream-muted mt-0.5">
                    Showing <strong className="text-saffron-400">{results.length}</strong> of{' '}
                    {listings.length} traditions
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-1.5 rounded-lg border border-crimson-700/80 bg-crimson-950 px-2.5 py-1.5 text-xs text-cream">
                    <ArrowUpDown size={12} className="text-saffron-400" />
                    <select
                      id="results-sort"
                      value={sort}
                      onChange={(e) => setSort(e.target.value as Sort)}
                      className="bg-transparent text-xs text-cream focus:outline-none cursor-pointer"
                    >
                      <option value="relevance" className="bg-crimson-950 text-cream">
                        Relevance
                      </option>
                      <option
                        value="distance"
                        disabled={!position}
                        className="bg-crimson-950 text-cream"
                      >
                        Distance {position ? '' : '(Near me required)'}
                      </option>
                      <option value="date" className="bg-crimson-950 text-cream">
                        Upcoming Date
                      </option>
                    </select>
                  </div>

                  {/* View Switcher: Grid, Map, Directory */}
                  <div className="flex rounded-lg border border-crimson-800 bg-crimson-950 p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setView('grid');
                        if (activeSidebarType === 'directory') setActiveSidebarType('');
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        view === 'grid' && activeSidebarType !== 'directory'
                          ? 'bg-saffron-500 text-crimson-950 font-bold shadow-sm'
                          : 'text-cream-muted hover:text-cream'
                      }`}
                      title="Grid view"
                      aria-label="Grid view"
                    >
                      <LayoutGrid size={13} />
                      <span className="hidden sm:inline">Grid</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setView('map');
                        if (activeSidebarType === 'directory') setActiveSidebarType('');
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        view === 'map'
                          ? 'bg-saffron-500 text-crimson-950 font-bold shadow-sm'
                          : 'text-cream-muted hover:text-cream'
                      }`}
                      title="Map view"
                      aria-label="Map view"
                    >
                      <MapIcon size={13} />
                      <span className="hidden sm:inline">Map</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setView('list');
                        setActiveSidebarType('directory');
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        view === 'list' || activeSidebarType === 'directory'
                          ? 'bg-saffron-500 text-crimson-950 font-bold shadow-sm'
                          : 'text-cream-muted hover:text-cream'
                      }`}
                      title="Cultural Directory list view"
                      aria-label="Cultural Directory view"
                    >
                      <List size={13} />
                      <span>Cultural Directory</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Empty Results State */}
              {results.length === 0 ? (
                <div className="rounded-2xl border border-crimson-800 bg-crimson-900/40 p-12 text-center">
                  <h3 className="font-display text-2xl font-bold text-cream">
                    No matching cultural traditions found
                  </h3>
                  <p className="mt-2 text-sm text-cream-muted max-w-md mx-auto">
                    Try adjusting your filters or search keywords to discover more Kerala cultural
                    events and heritage sites.
                  </p>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="mt-6 rounded-full bg-saffron-500 hover:bg-saffron-400 text-crimson-950 font-bold px-6 py-2.5 text-xs transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : view === 'map' ? (
                <div className="rounded-2xl overflow-hidden border border-crimson-800 bg-crimson-950">
                  <CultureMap
                    listings={results}
                    user={position}
                    height="480px"
                    onSelectState={(st) => setFilter('location', st)}
                  />
                </div>
              ) : view === 'grid' ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  {results.map((l) => {
                    const cat = categories.find((c) => c.id === l.category_id);
                    const dist = distances ? distances[l.id] : undefined;
                    return (
                      <ListingCard
                        key={l.id}
                        listing={l}
                        category={cat}
                        distanceKm={dist}
                      />
                    );
                  })}
                </div>
              ) : (
                <ListingGrid listings={results} categories={categories} distances={distances} />
              )}
            </section>

            {/* Right Column (4 cols): Cultural Spotlights (Daily Story & Popular Locations) */}
            <aside className="space-y-6 lg:col-span-4" aria-label="Cultural Spotlights">
              <CulturalSpotlights
                storyListing={dailyStory}
                listings={listings}
                onSelectLocation={(loc) => setFilter('location', loc)}
              />
            </aside>
          </div>

          {/* Section 5: Community Contribution Banner (Influenced by Reference CTA) */}
          <ShareEventBanner />
        </main>
      </div>
    </div>
  );
}
