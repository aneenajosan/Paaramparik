'use client';
import { LocateFixed } from 'lucide-react';
import { useMemo } from 'react';
import ListingGrid from './ListingGrid';
import { useGeolocation } from '@/hooks/useGeolocation';
import { haversineKm } from '@/lib/utils';
import type { Category, Listing } from '@/types';

export default function NearbyListings({ listings, categories }: { listings: Listing[]; categories: Category[] }) {
  const { position, status, locate } = useGeolocation();
  const nearest = useMemo(() => position
    ? [...listings].map((l) => ({ l, d: haversineKm(position, { lat: l.latitude, lng: l.longitude }) })).sort((a, b) => a.d - b.d).slice(0, 3) : [], [listings, position]);
  if (!position) return (
    <div className="card flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-xl text-sm text-cream-muted">Share your location to see the cultural experiences closest to you. Your position stays in your browser and is not stored.</p>
      <div><button className="btn-saffron" onClick={locate} disabled={status === 'loading'}><LocateFixed size={16} />{status === 'loading' ? 'Locating…' : 'Find experiences near me'}</button>
        {status === 'denied' && <p className="error-text">Permission denied — allow location access in your browser to use this.</p>}
        {status === 'unsupported' && <p className="error-text">Location is not supported in this browser.</p>}</div>
    </div>);
  return <ListingGrid listings={nearest.map((n) => n.l)} categories={categories} distances={Object.fromEntries(nearest.map((n) => [n.l.id, n.d]))} />;
}
