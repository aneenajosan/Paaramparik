import Link from 'next/link';
import { Link2 } from 'lucide-react';
import { TypeBadge } from './Badges';
import type { RelatedListing } from '@/types';

const label = (t: string) => t.replace(/_/g, ' ');
export default function RelatedListings({ related }: { related: RelatedListing[] }) {
  if (!related.length) return <p className="text-sm text-stone-500">No connected practices have been recorded for this listing yet.</p>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {related.map(({ listing, relationship_type, description }) => (
        <li key={listing.id}>
          <Link href={`/listings/${listing.slug}`} className="card block h-full p-4 hover:border-saffron-500">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-saffron-600"><Link2 size={12} aria-hidden />{label(relationship_type)}</span>
            <span className="mt-1 block font-display text-lg font-bold text-crimson-950">{listing.title}</span>
            <span className="mt-1 block"><TypeBadge type={listing.listing_type} /></span>
            {description && <span className="mt-2 block text-sm text-stone-600">{description}</span>}
          </Link>
        </li>))}
    </ul>
  );
}
