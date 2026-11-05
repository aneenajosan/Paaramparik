import Explorer from '@/components/listings/Explorer';
import DemoBanner from '@/components/listings/DemoBanner';
import { getCategories, getPublishedListings } from '@/lib/data';
export const metadata = { title: 'Cultural Directory' };
export const dynamic = 'force-dynamic';
export default async function DirectoryPage() {
  const [{ listings, source }, categories] = await Promise.all([getPublishedListings(), getCategories()]);
  return (<>{source === 'demo' && <DemoBanner />}
    <div className="container-page pt-10"><p className="eyebrow">Directory</p><h1 className="mt-1 text-4xl">Cultural Directory</h1>
      <p className="mt-2 max-w-2xl text-cream-muted">Places, artists, festivals, performances, workshops and traditions — filter by type, art form, place or date.</p></div>
    <Explorer listings={listings} categories={categories} defaultView="list" /></>);
}
