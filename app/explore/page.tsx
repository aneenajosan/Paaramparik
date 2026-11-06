import Explorer from '@/components/listings/Explorer';
import DemoBanner from '@/components/listings/DemoBanner';
import { getCategories, getPublishedListings } from '@/lib/data';
export const metadata = { title: 'Explore the map' };
export const dynamic = 'force-dynamic';
export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [{ listings, source }, categories] = await Promise.all([getPublishedListings(), getCategories()]);
  return (<>{source === 'demo' && <DemoBanner />}
    <div className="container-page pt-10">
      <p className="eyebrow">Explore</p>
      <h1 className="mt-1 font-samarkan text-5xl sm:text-6xl text-saffron-400 tracking-wide">Paaramparik</h1>
      <p className="mt-2 text-cream-muted text-sm max-w-xl">Explore traditional art forms, rituals, heritage places and cultural gatherings across the region.</p>
    </div>
    <Explorer listings={listings} categories={categories} defaultView="map" initialQuery={q ?? ''} /></>);
}
