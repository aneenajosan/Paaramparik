import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import CoverArt from './CoverArt';
import { TypeBadge, VerificationBadge } from './Badges';
import type { Listing } from '@/types';

export default function StoryOfTheDay({ listing, full = false }: { listing: Listing; full?: boolean }) {
  return (
    <article className="grid overflow-hidden border border-saffron-800 bg-saffron-950 md:grid-cols-2">
      <CoverArt listing={listing} className="h-56 md:h-full md:min-h-[320px]" />
      <div className="flex flex-col justify-center gap-3 p-6 md:p-10">
        <p className="eyebrow">Cultural Story of the Day</p>
        <TypeBadge type={listing.listing_type} />
        <h2 className="text-3xl font-bold">{listing.title}</h2>
        <p className="text-cream">{listing.description}</p>
        {listing.cultural_background && <div><h3 className="text-sm font-semibold uppercase tracking-wider text-saffron-500">Why it matters</h3><p className={`mt-1 text-sm text-cream-muted ${full ? '' : 'line-clamp-4'}`}>{listing.cultural_background}</p></div>}
        <div className="flex flex-wrap items-center gap-3 pt-2"><VerificationBadge status={listing.verification_status} />
          <Link href={`/listings/${listing.slug}`} className="btn-saffron">Read the full listing <ArrowRight size={16} /></Link></div>
      </div>
    </article>
  );
}
