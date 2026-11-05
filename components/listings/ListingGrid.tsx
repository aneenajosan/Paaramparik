import ListingCard from './ListingCard';
import type { Category, Listing } from '@/types';
export default function ListingGrid({ listings, categories, distances }: { listings: Listing[]; categories: Category[]; distances?: Record<string, number> }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((l) => <ListingCard key={l.id} listing={l} category={categories.find((c) => c.id === l.category_id)} distanceKm={distances?.[l.id]} />)}
    </div>
  );
}
