'use client';
import { useMemo, useState } from 'react';
import { Search, Map as MapIcon, List, LocateFixed, X, SlidersHorizontal } from 'lucide-react';
import CultureMap from '@/components/map/CultureMap';
import ListingGrid from './ListingGrid';
import { TYPE_META, TYPES, EXPERIENCE_LABEL } from '@/lib/listing-meta';
import { EMPTY_FILTERS, filterListings, sortListings, type Filters, type Sort } from '@/lib/filter';
import { haversineKm, cn } from '@/lib/utils';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { Category, Listing } from '@/types';

export default function Explorer({ listings, categories, defaultView = 'map', initialQuery = '' }: { listings: Listing[]; categories: Category[]; defaultView?: 'map' | 'list'; initialQuery?: string }) {
  const [f, setF] = useState<Filters>({ ...EMPTY_FILTERS, q: initialQuery });
  const [view, setView] = useState<'map' | 'list'>(defaultView);
  const [sort, setSort] = useState<Sort>('relevance');
  const [panel, setPanel] = useState(false);
  const { position, status, locate } = useGeolocation();
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((p) => ({ ...p, [k]: v }));
  const localities = useMemo(() => [...new Set(listings.flatMap((l) => [l.location_name, l.district]).filter(Boolean))] as string[], [listings]);

  const results = useMemo(() => sortListings(filterListings(listings, f), sort, f.q, position), [listings, f, sort, position]);
  const distances = useMemo(() => position ? Object.fromEntries(results.map((l) => [l.id, haversineKm(position, { lat: l.latitude, lng: l.longitude })])) : undefined, [results, position]);
  const active = JSON.stringify(f) !== JSON.stringify(EMPTY_FILTERS);
  const clear = () => setF(EMPTY_FILTERS);

  return (
    <div className="container-page py-8">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cream-muted" aria-hidden />
          <input className="input pl-9" type="search" aria-label="Search cultural experiences" placeholder="Search traditions, places, artists, festivals…" value={f.q} onChange={(e) => set('q', e.target.value)} />
        </div>
        <button className="btn-ghost lg:hidden" aria-expanded={panel} onClick={() => setPanel(!panel)}><SlidersHorizontal size={16} /> Filters</button>
        <div className="flex" role="group" aria-label="View">
          <button className={cn('btn border border-crimson-800', view === 'map' ? 'bg-saffron-500 text-crimson-950' : 'bg-crimson-900')} aria-pressed={view === 'map'} onClick={() => setView('map')}><MapIcon size={16} /> Map</button>
          <button className={cn('btn border border-crimson-800', view === 'list' ? 'bg-saffron-500 text-crimson-950' : 'bg-crimson-900')} aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={16} /> List</button>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className={cn('space-y-5 lg:block', panel ? 'block' : 'hidden')} aria-label="Filters">
          <fieldset><legend className="label">Listing type</legend>
            <div className="space-y-1.5">{TYPES.map((t) => (
              <label key={t} className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" className="accent-saffron-500" checked={f.types.includes(t)} onChange={() => set('types', f.types.includes(t) ? f.types.filter((x) => x !== t) : [...f.types, t])} />
                <span className="inline-block h-2.5 w-2.5" style={{ background: TYPE_META[t].color }} aria-hidden />{TYPE_META[t].plural}
              </label>))}</div></fieldset>
          <div><label className="label" htmlFor="f-cat">Art form</label>
            <select id="f-cat" className="input" value={f.category} onChange={(e) => set('category', e.target.value)}><option value="">All art forms</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="label" htmlFor="f-exp">Experience</label>
            <select id="f-exp" className="input" value={f.experience} onChange={(e) => set('experience', e.target.value)}><option value="">Any</option>{Object.entries(EXPERIENCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><label className="label" htmlFor="f-loc">Location</label>
            <input id="f-loc" list="localities" className="input" placeholder="District or locality" value={f.location} onChange={(e) => set('location', e.target.value)} />
            <datalist id="localities">{localities.map((x) => <option key={x} value={x} />)}</datalist></div>
          <div><label className="label" htmlFor="f-org">Artist or organiser</label>
            <input id="f-org" className="input" value={f.organiser} onChange={(e) => set('organiser', e.target.value)} /></div>
          <fieldset><legend className="label">Event dates</legend>
            <div className="grid grid-cols-2 gap-2"><input aria-label="From date" type="date" className="input" value={f.from} onChange={(e) => set('from', e.target.value)} /><input aria-label="To date" type="date" className="input" value={f.to} onChange={(e) => set('to', e.target.value)} /></div>
            <p className="hint">Only listings with confirmed dates match a date filter.</p></fieldset>
          {active && <button className="btn-ghost w-full" onClick={clear}><X size={14} /> Clear all filters</button>}
        </aside>

        <section aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-cream-muted"><strong className="text-cream">{results.length}</strong> of {listings.length} listings</p>
            <div className="flex flex-wrap items-center gap-2">
              <button className="btn-ghost !py-1.5" onClick={locate} disabled={status === 'loading'}><LocateFixed size={14} /> {status === 'granted' ? 'Located' : status === 'loading' ? 'Locating…' : 'Near me'}</button>
              <label className="sr-only" htmlFor="sort">Sort by</label>
              <select id="sort" className="input !w-auto !py-1.5" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="relevance">Sort: Relevance</option><option value="distance" disabled={!position}>Sort: Distance{position ? '' : ' (enable Near me)'}</option><option value="date">Sort: Upcoming date</option>
              </select>
            </div>
          </div>
          {status === 'denied' && <p className="mb-3 text-xs text-saffron-500">Location permission was denied. Distance sorting needs it.</p>}
          {status === 'unsupported' && <p className="mb-3 text-xs text-saffron-500">This browser does not support location.</p>}

          {results.length === 0 ? (
            <div className="card p-10 text-center"><h2 className="text-2xl">Nothing matches those filters</h2><p className="mt-2 text-sm text-cream-muted">Try fewer filters, or clear them to see everything.</p><button onClick={clear} className="btn-saffron mt-5">Clear all filters</button></div>
          ) : view === 'map' ? (
            <>
              <CultureMap listings={results} user={position} />
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-cream-muted" aria-label="Marker legend">{TYPES.map((t) => <li key={t} className="flex items-center gap-1.5"><span className="inline-flex h-4 w-4 items-center justify-center text-[10px] font-bold text-cream" style={{ background: TYPE_META[t].color }} aria-hidden>{TYPE_META[t].glyph}</span>{TYPE_META[t].label}</li>)}</ul>
            </>
          ) : <ListingGrid listings={results} categories={categories} distances={distances} />}
        </section>
      </div>
    </div>
  );
}
