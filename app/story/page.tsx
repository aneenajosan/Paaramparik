import StoryOfTheDay from '@/components/listings/StoryOfTheDay';
import ListingGrid from '@/components/listings/ListingGrid';
import DemoBanner from '@/components/listings/DemoBanner';
import { getCategories, getPublishedListings } from '@/lib/data';
import { storyOfTheDay } from '@/lib/utils';
export const metadata = { title: 'Cultural Story of the Day' };
export const dynamic = 'force-dynamic';
export default async function StoryPage() {
  const [{ listings, source }, categories] = await Promise.all([getPublishedListings(), getCategories()]);
  const story = storyOfTheDay(listings);
  return (<>{source === 'demo' && <DemoBanner />}
    <div className="container-page section">
      <p className="eyebrow !text-saffron-600">Today</p><h1 className="mb-8 mt-1 text-4xl font-display font-bold text-crimson-950">Cultural Story of the Day</h1>
      {story ? <StoryOfTheDay listing={story} full /> : <p className="text-stone-500">Nothing is published yet.</p>}
      {story && <><h2 className="mb-6 mt-16 text-2xl font-display font-bold text-crimson-950">More to discover</h2><ListingGrid listings={listings.filter((l) => l.id !== story.id).slice(0, 6)} categories={categories} /></>}
    </div></>);
}
