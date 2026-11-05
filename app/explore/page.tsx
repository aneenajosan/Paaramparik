import Explorer from '@/components/listings/Explorer';
import DemoBanner from '@/components/listings/DemoBanner';
import { getCategories, getPublishedListings } from '@/lib/data';
export const metadata = { title: 'Explore the map' };
export const dynamic = 'force-dynamic';
export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [{ listings, source }, categories] = await Promise.all([getPublishedListings(), getCategories()]);
  return (<>{source === 'demo' && <DemoBanner />}
    <div className="container-page pt-10"><p className="eyebrow">Explore</p><h1 className="mt-1 text-4xl">The cultural map</h1></div>
    <Explorer listings={listings} categories={categories} defaultView="map" initialQuery={q ?? ''} /></>);
}
