import Link from 'next/link';
import { Search, ArrowRight, ShieldCheck, Users, Compass } from 'lucide-react';
import CultureMap from '@/components/map/CultureMap';
import ListingGrid from '@/components/listings/ListingGrid';
import NearbyListings from '@/components/listings/NearbyListings';
import StoryOfTheDay from '@/components/listings/StoryOfTheDay';
import DemoBanner from '@/components/listings/DemoBanner';
import { getCategories, getPublishedListings } from '@/lib/data';
import { isUpcoming, storyOfTheDay, eventLabel } from '@/lib/utils';
import { TYPES } from '@/lib/listing-meta';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [{ listings, source }, categories] = await Promise.all([getPublishedListings(), getCategories()]);
  const story = storyOfTheDay(listings);
  const featured = TYPES.map((t) => listings.find((l) => l.listing_type === t)).filter((l): l is NonNullable<typeof l> => !!l).slice(0, 3);
  const dated = listings.filter((l) => l.listing_type === 'event' || l.event_start || l.date_note);
  const upcoming = dated.filter((l) => isUpcoming(l)).sort((a, b) => (a.event_start! > b.event_start! ? 1 : -1));
  const events = upcoming.length ? upcoming : dated; // fall back to annual/undated events, labelled honestly

  return (
    <>
      {source === 'demo' && <DemoBanner />}
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
            <p className="mt-5 max-w-xl text-lg text-cream/90">Find the temples, performances, crafts and festivals your district has kept alive — with the stories, sources and people behind them.</p>
            <form action="/explore" className="mt-8 flex max-w-xl" role="search">
              <label htmlFor="hero-q" className="sr-only">Search cultural experiences</label>
              <input id="hero-q" name="q" className="input !border-cream/40 !py-3.5" placeholder="Try “Kathakali”, “drum”, “festival”…" />
              <button className="btn-saffron shrink-0 !px-5" type="submit"><Search size={18} /> Search</button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3 text-sm"><Link href="/explore" className="btn-ghost">Open the map</Link><Link href="/directory" className="btn-ghost">Browse the directory</Link></div>
          </div>
          <ul className="space-y-4 self-end text-sm">
            {[[Compass, 'Explore by place', 'An interactive map of traditions near you.'], [ShieldCheck, 'Sources in the open', 'Every listing shows where its facts come from and whether it has been reviewed.'], [Users, 'Community-built', 'Anyone signed in can contribute; administrators review before anything is published.']].map(([Icon, t, d]) => {
              const I = Icon as typeof Compass; return <li key={t as string} className="flex gap-3"><I className="mt-0.5 shrink-0 text-saffron-500" size={20} aria-hidden /><span><strong className="block text-base">{t as string}</strong><span className="text-cream/80">{d as string}</span></span></li>; })}
          </ul>
        </div>
      </section>

      <section className="section container-page">
        <div className="mb-6 flex items-end justify-between gap-4"><div><p className="eyebrow">The map</p><h2 className="mt-1 text-3xl"><span className="font-samarkan text-3xl text-saffron-400 mr-2 font-normal">Paaramparik</span>Cultural Map</h2></div><Link href="/explore" className="hidden items-center gap-1 text-sm font-semibold text-saffron-500 sm:flex">Open full map <ArrowRight size={14} /></Link></div>
        <CultureMap listings={listings} height="420px" scrollZoom={false} />
      </section>

      <section className="container-page"><div className="mb-6"><p className="eyebrow">Featured</p><h2 className="mt-1 text-3xl">Featured experiences</h2></div>
        {featured.length ? <ListingGrid listings={featured} categories={categories} /> : <p className="text-cream-muted">No listings have been published yet.</p>}</section>

      <section className="section container-page"><div className="mb-6"><p className="eyebrow">Close to you</p><h2 className="mt-1 text-3xl">Nearby cultural experiences</h2></div>
        <NearbyListings listings={listings} categories={categories} /></section>

      <section className="container-page"><div className="mb-6"><p className="eyebrow">Events & festivals</p><h2 className="mt-1 text-3xl">{upcoming.length ? 'Upcoming cultural events' : 'Annual festivals'}</h2>
        {!upcoming.length && <p className="mt-2 max-w-2xl text-sm text-cream-muted">No events with confirmed dates are listed yet, so these are recurring festivals whose dates must be checked with organisers.</p>}</div>
        {events.length ? <ul className="grid gap-4 sm:grid-cols-2">{events.slice(0, 4).map((l) => (
          <li key={l.id}><Link href={`/listings/${l.slug}`} className="card flex h-full items-start justify-between gap-4 p-5 hover:border-saffron-500"><span><span className="block font-display text-xl font-bold">{l.title}</span><span className="mt-1 block text-sm text-cream-muted">{l.location_name}</span></span><span className="shrink-0 border border-saffron-500 px-2 py-1 text-xs font-semibold text-saffron-500">{eventLabel(l)}</span></Link></li>))}</ul>
          : <div className="card p-8 text-center text-cream-muted">No events listed yet. Know of one? <Link href="/contribute" className="font-semibold text-saffron-500 underline">Contribute it.</Link></div>}</section>

      {story && <section className="section container-page"><StoryOfTheDay listing={story} /></section>}

      <section className="container-page"><div className="bg-plum-800 p-8 md:p-12 md:flex md:items-center md:justify-between md:gap-8">
        <div className="max-w-xl"><p className="eyebrow !text-cream">Community</p><h2 className="mt-2 text-3xl">Know a tradition that deserves to be found?</h2><p className="mt-3 text-cream/90">Submit a place, artist, workshop or practice with your sources. A reviewer checks every submission before it appears on the map.</p></div>
        <Link href="/contribute" className="btn-saffron mt-6 md:mt-0">Contribute a listing <ArrowRight size={16} /></Link></div></section>
    </>
  );
}
