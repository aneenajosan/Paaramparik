import Image from 'next/image';
import { TYPE_META } from '@/lib/listing-meta';
import type { Listing } from '@/types';

/** Real cover image when one exists; otherwise a plain palette block with the category icon (no fake imagery). */
export default function CoverArt({ listing, className = 'h-44' }: { listing: Pick<Listing, 'cover_image' | 'listing_type' | 'title'>; className?: string }) {
  const { Icon, color } = TYPE_META[listing.listing_type];
  if (listing.cover_image) {
    return <div className={`relative w-full overflow-hidden ${className}`}><Image src={listing.cover_image} alt={listing.title} fill className="object-cover" sizes="(max-width:768px) 100vw, 400px" /></div>;
  }
  return (
    <div className={`flex w-full items-center justify-center bg-crimson-950 ${className}`} style={{ borderBottom: `3px solid ${color}` }} role="img" aria-label={`${TYPE_META[listing.listing_type].label} — no photograph yet`}>
      <Icon size={44} strokeWidth={1.25} style={{ color }} />
    </div>
  );
}
