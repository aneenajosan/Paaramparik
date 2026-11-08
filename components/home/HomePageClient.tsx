'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Users,
  Compass,
  CalendarDays,
  MapPin,
  Clock,
  Trash2,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import CultureMap from '@/components/map/CultureMap';
import ListingGrid from '@/components/listings/ListingGrid';
import NearbyListings from '@/components/listings/NearbyListings';
import StoryOfTheDay from '@/components/listings/StoryOfTheDay';
import DemoBanner from '@/components/listings/DemoBanner';
import {
  getStoredCreatedEvents,
  deleteStoredEvent,
  subscribeToEventChanges,
} from '@/lib/created-events';
import { isUpcoming, storyOfTheDay, eventLabel } from '@/lib/utils';
import { TYPES } from '@/lib/listing-meta';
import type { Category, Listing } from '@/types';
import type { DataSource } from '@/lib/data';

interface HomePageClientProps {
  initialListings: Listing[];
  categories: Category[];
  source: DataSource;
}

export default function HomePageClient({
  initialListings,
  categories,
  source,
}: HomePageClientProps) {
  const [createdEvents, setCreatedEvents] = useState<Listing[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load created events on mount & listen for live changes
  useEffect(() => {
    setCreatedEvents(getStoredCreatedEvents());

    const unsubscribe = subscribeToEventChanges(() => {
      setCreatedEvents(getStoredCreatedEvents());
    });

    return () => unsubscribe();
  }, []);

  // Show auto-dismiss toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle deleting an event
  const handleDeleteEvent = async (id: string, title: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"? This will remove it from the front page and map.`
    );
    if (!confirmed) return;

    const ok = await deleteStoredEvent(id);
    if (ok) {
      triggerToast(`Event "${title}" has been deleted.`);
    }
  };

  // Combine created events with initial listings
  const allListings = [...createdEvents, ...initialListings];
  const story = storyOfTheDay(allListings);
  const featured = TYPES.map((t) => allListings.find((l) => l.listing_type === t))
    .filter((l): l is NonNullable<typeof l> => !!l)
    .slice(0, 3);

  const dated = allListings.filter((l) => l.listing_type === 'event' || l.event_start || l.date_note);
  const upcoming = dated
    .filter((l) => isUpcoming(l))
    .sort((a, b) => (a.event_start! > b.event_start! ? 1 : -1));
  const events = upcoming.length ? upcoming : dated;

  return (
    <>
      {source === 'demo' && <DemoBanner />}

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[1200] flex items-center gap-2 rounded-xl border border-saffron-500/80 bg-crimson-950/95 px-4 py-3 text-sm text-cream shadow-2xl backdrop-blur animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-crimson-800">
        <div className="container-page grid gap-10 py-16 md:grid-cols-[1.3fr_1fr] md:py-24">
          <div>
            <p className="eyebrow !text-saffron-500">Discover · Understand · Contribute</p>
            <h1 className="mt-3 text-4xl font-bold leading-[1.1] sm:text-6xl">
              <span className="font-samarkan block text-5xl sm:text-7xl md:text-8xl text-saffron-400 mb-2 tracking-wide font-normal">
                Paaramparik
              </span>
              Culture lives beyond the tourist trail.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-cream/90">
              Find the temples, performances, crafts and festivals your district has kept alive — with the stories, sources and people behind them.
            </p>
            <form action="/explore" className="mt-8 flex max-w-xl" role="search">
              <label htmlFor="hero-q" className="sr-only">Search cultural experiences</label>
              <input id="hero-q" name="q" className="input !border-cream/40 !py-3.5" placeholder="Try “Kathakali”, “drum”, “festival”…" />
              <button className="btn-saffron shrink-0 !px-5" type="submit"><Search size={18} /> Search</button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <Link href="/explore" className="btn-ghost">Open the map</Link>
              <Link href="/directory" className="btn-ghost">Browse the directory</Link>
              <Link href="/contribute" className="btn-saffron flex items-center gap-1.5 font-bold">
                + Create Event
              </Link>
            </div>
          </div>
          <ul className="space-y-4 self-end text-sm">
            {[
              [Compass, 'Explore by place', 'An interactive map of traditions near you.'],
              [ShieldCheck, 'Sources in the open', 'Every listing shows where its facts come from and whether it has been reviewed.'],
              [Users, 'Community-built', 'Anyone signed in can contribute; administrators review before anything is published.'],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof Compass;
              return (
                <li key={t as string} className="flex gap-3">
                  <I className="mt-0.5 shrink-0 text-saffron-500" size={20} aria-hidden />
                  <span>
                    <strong className="block text-base">{t as string}</strong>
                    <span className="text-cream/80">{d as string}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Front Page Interactive Map with Created Events */}
      <section className="section container-page" id="map-section">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">The map</p>
            <h2 className="mt-1 text-3xl">
              <span className="font-samarkan text-3xl text-saffron-400 mr-2 font-normal">Paaramparik</span>
              Cultural Map
            </h2>
          </div>
          <Link href="/explore" className="hidden items-center gap-1 text-sm font-semibold text-saffron-500 sm:flex">
            Open full map <ArrowRight size={14} />
          </Link>
        </div>
        <CultureMap listings={allListings} height="420px" scrollZoom={false} />
      </section>

      {/* RECENTLY CREATED EVENTS (Front & Center) */}
      {createdEvents.length > 0 && (
        <section className="container-page mb-12 animate-in fade-in duration-300">
          <div className="rounded-2xl border border-saffron-500/40 bg-gradient-to-br from-crimson-900/90 via-crimson-950 to-crimson-900/90 p-6 sm:p-8 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-crimson-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-saffron-400 animate-pulse" />
                  <span className="eyebrow !text-saffron-400">Newly Created on Platform</span>
                </div>
                <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-cream">
                  Community Submitted Events
                </h2>
                <p className="mt-1 text-xs text-cream-muted">
                  These events were created recently and are live on the map. You can manage or delete them anytime.
                </p>
              </div>

              <Link href="/contribute" className="btn-saffron text-xs font-bold py-2 px-4 shadow">
                + Add Another Event
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {createdEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="group relative flex flex-col justify-between rounded-xl border border-saffron-500/30 bg-crimson-950/90 p-5 shadow-lg transition-all hover:border-saffron-500 hover:shadow-saffron-500/10"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-saffron-500/20 border border-saffron-500/40 px-2.5 py-0.5 text-[11px] font-bold text-saffron-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-saffron-400 animate-pulse" />
                        Live Event
                      </span>
                      <span className="rounded bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                        {ev.participation_info || 'Free'}
                      </span>
                    </div>

                    <h3 className="mt-3 font-display text-lg font-bold text-cream group-hover:text-saffron-400 transition-colors">
                      {ev.title}
                    </h3>

                    {/* Date & Time */}
                    <div className="mt-2.5 flex items-center gap-2 text-xs text-saffron-400">
                      <CalendarDays size={13} className="shrink-0" />
                      <span>{ev.event_start}</span>
                      {ev.event_start_time && (
                        <span className="flex items-center gap-1 text-cream-muted">
                          <Clock size={11} /> {ev.event_start_time.slice(0, 5)} - {ev.event_end_time?.slice(0, 5)}
                        </span>
                      )}
                    </div>

                    {/* Location */}
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-cream-muted">
                      <MapPin size={13} className="shrink-0 text-saffron-500/70" />
                      <span className="truncate">{ev.location_name || ev.address}</span>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-cream/80 line-clamp-2">
                      {ev.description}
                    </p>

                    {/* Organizer & Verified Contact */}
                    {ev.practitioner_name && (
                      <div className="mt-3 text-[11px] text-cream-muted/90 border-t border-crimson-800/40 pt-2">
                        <span>Organized by: <strong className="text-cream">{ev.practitioner_name}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions: Delete Option */}
                  <div className="mt-4 pt-3 border-t border-crimson-800/60 flex items-center justify-between">
                    <span className="text-[10px] text-cream-muted/70">
                      Coordinates: {ev.latitude.toFixed(2)}, {ev.longitude.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(ev.id, ev.title)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-700/60 bg-rose-950/60 px-2.5 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-900 hover:text-white transition-colors"
                      title="Delete this event from the platform"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Experiences */}
      <section className="container-page">
        <div className="mb-6">
          <p className="eyebrow">Featured</p>
          <h2 className="mt-1 text-3xl">Featured experiences</h2>
        </div>
        {featured.length ? (
          <ListingGrid listings={featured} categories={categories} />
        ) : (
          <p className="text-cream-muted">No listings have been published yet.</p>
        )}
      </section>

      {/* Close to You */}
      <section className="section container-page">
        <div className="mb-6">
          <p className="eyebrow">Close to you</p>
          <h2 className="mt-1 text-3xl">Nearby cultural experiences</h2>
        </div>
        <NearbyListings listings={allListings} categories={categories} />
      </section>

      {/* Events & Festivals */}
      <section className="container-page">
        <div className="mb-6">
          <p className="eyebrow">Events & festivals</p>
          <h2 className="mt-1 text-3xl">
            {upcoming.length ? 'Upcoming cultural events' : 'Annual festivals'}
          </h2>
          {!upcoming.length && (
            <p className="mt-2 max-w-2xl text-sm text-cream-muted">
              No events with confirmed dates are listed yet, so these are recurring festivals whose dates must be checked with organisers.
            </p>
          )}
        </div>
        {events.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {events.slice(0, 4).map((l) => (
              <li key={l.id}>
                <Link
                  href={`/listings/${l.slug}`}
                  className="card flex h-full items-start justify-between gap-4 p-5 hover:border-saffron-500 transition-colors"
                >
                  <span>
                    <span className="block font-display text-xl font-bold">{l.title}</span>
                    <span className="mt-1 block text-sm text-cream-muted">{l.location_name}</span>
                  </span>
                  <span className="shrink-0 border border-saffron-500 px-2 py-1 text-xs font-semibold text-saffron-500">
                    {eventLabel(l)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="card p-8 text-center text-cream-muted">
            No events listed yet. Know of one?{' '}
            <Link href="/contribute" className="font-semibold text-saffron-500 underline">
              Contribute it.
            </Link>
          </div>
        )}
      </section>

      {/* Story of the Day */}
      {story && (
        <section className="section container-page">
          <StoryOfTheDay listing={story} />
        </section>
      )}

      {/* Community Call to Action */}
      <section className="container-page pb-16">
        <div className="bg-plum-800 p-8 md:p-12 md:flex md:items-center md:justify-between md:gap-8 rounded-2xl">
          <div className="max-w-xl">
            <p className="eyebrow !text-cream">Community</p>
            <h2 className="mt-2 text-3xl">Know a tradition that deserves to be found?</h2>
            <p className="mt-3 text-cream/90">
              Submit a place, artist, workshop or practice with your sources. A reviewer checks every submission before it appears on the map.
            </p>
          </div>
          <Link href="/contribute" className="btn-saffron mt-6 md:mt-0 font-bold">
            Contribute a listing <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
