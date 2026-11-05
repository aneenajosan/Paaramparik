import Link from 'next/link';
import { MapPin, CalendarDays, Navigation } from 'lucide-react';
import CoverArt from './CoverArt';
import { TypeBadge, VerificationBadge } from './Badges';
import { eventLabel } from '@/lib/utils';
import type { Category, Listing } from '@/types';

export default function ListingCard({ listing, category, distanceKm }: { listing: Listing; category?: Category; distanceKm?: number }) {
  const when = eventLabel(listing);
  return (
    <article className="card flex flex-col transition-colors hover:border-saffron-500">
      <Link href={`/listings/${listing.slug}`} className="flex flex-1 flex-col">
        <CoverArt listing={listing} />
        <div className="flex flex-1 flex-col gap-2 p-5">
          <TypeBadge type={listing.listing_type} />
          <h3 className="text-xl font-bold leading-snug">{listing.title}</h3>
          <p className="flex items-center gap-1.5 text-sm text-cream-muted"><MapPin size={14} aria-hidden />{listing.location_name ?? listing.district}
            {distanceKm !== undefined && <span className="ml-1 inline-flex items-center gap-1 text-saffron-500"><Navigation size={12} aria-hidden />{distanceKm.toFixed(1)} km</span>}</p>
          {when && <p className="flex items-center gap-1.5 text-sm text-saffron-500"><CalendarDays size={14} aria-hidden />{when}</p>}
          <p className="line-clamp-3 text-sm text-cream/90">{listing.description}</p>
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
            <VerificationBadge status={listing.verification_status} />
            {category && <span className="text-xs text-cream-muted">{category.name}</span>}
          </div>
        </div>
      </Link>
    </article>
  );
}
