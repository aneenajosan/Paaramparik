import Image from 'next/image';
import { TYPE_META } from '@/lib/listing-meta';
import type { Listing } from '@/types';

export const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  'performing-arts': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80',
  'music-percussion': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  'heritage-architecture': 'https://images.unsplash.com/photo-1621847468516-1ed5d0df56fe?auto=format&fit=crop&w=800&q=80',
  'crafts-textiles': 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
  'visual-arts': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
  'festivals-rituals': 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80',
};

export const DEFAULT_TYPE_IMAGES: Record<string, string> = {
  event: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80',
  place: 'https://images.unsplash.com/photo-1621847468516-1ed5d0df56fe?auto=format&fit=crop&w=800&q=80',
  artist: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80',
  performance: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80',
  workshop: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
  tradition: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
};

export default function CoverArt({
  listing,
  className = 'h-48',
}: {
  listing: Pick<Listing, 'cover_image' | 'listing_type' | 'title'> & { category_id?: string | null };
  className?: string;
}) {
  const { Icon, color } = TYPE_META[listing.listing_type];
  const imgSrc =
    listing.cover_image ||
    (listing.category_id && DEFAULT_CATEGORY_IMAGES[listing.category_id]) ||
    DEFAULT_TYPE_IMAGES[listing.listing_type];

  if (imgSrc) {
    return (
      <div className={`relative w-full overflow-hidden bg-crimson-950 ${className}`}>
        <Image
          src={imgSrc}
          alt={listing.title}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 hover:scale-105"
          sizes="(max-width:768px) 100vw, 400px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-crimson-950/80 via-transparent to-black/20 pointer-events-none" />
      </div>
    );
  }

  return (
    <div
      className={`flex w-full items-center justify-center bg-crimson-950 ${className}`}
      style={{ borderBottom: `3px solid ${color}` }}
      role="img"
      aria-label={`${TYPE_META[listing.listing_type].label} — no photograph yet`}
    >
      <Icon size={44} strokeWidth={1.25} style={{ color }} />
    </div>
  );
}
