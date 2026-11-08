import HomePageClient from '@/components/home/HomePageClient';
import { getCategories, getPublishedListings } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [{ listings, source }, categories] = await Promise.all([
    getPublishedListings(),
    getCategories(),
  ]);

  return (
    <HomePageClient
      initialListings={listings}
      categories={categories}
      source={source}
    />
  );
}
