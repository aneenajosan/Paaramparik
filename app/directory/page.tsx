import Explorer from '@/components/listings/Explorer';
import DemoBanner from '@/components/listings/DemoBanner';
import { getCategories, getPublishedListings } from '@/lib/data';
export const metadata = { title: 'Cultural Directory · Paaramparik' };
export const dynamic = 'force-dynamic';
export default async function DirectoryPage() {
  const [{ listings, source }, categories] = await Promise.all([getPublishedListings(), getCategories()]);
  return (
    <>
      {source === 'demo' && <DemoBanner />}
      <Explorer listings={listings} categories={categories} defaultView="list" />
    </>
  );
}
