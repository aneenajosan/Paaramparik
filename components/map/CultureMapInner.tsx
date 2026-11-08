'use client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import { TYPE_META } from '@/lib/listing-meta';
import { isStoredCreatedEvent, deleteStoredEvent } from '@/lib/created-events';
import type { Listing } from '@/types';

const iconCache: Record<string, L.DivIcon> = {};
const iconFor = (type: Listing['listing_type']) =>
  (iconCache[type] ??= L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
    html: `<div class="lcm-marker" style="background:${TYPE_META[type].color}"><span>${TYPE_META[type].glyph}</span></div>`,
  }));

function MapController({
  listings,
  user,
}: {
  listings: Listing[];
  user: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const fittedRef = useRef<string>('');

  useEffect(() => {
    // Enable dragging explicitly and invalidate container dimensions
    map.dragging.enable();
    map.invalidateSize();
    const t = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(t);
  }, [map]);

  useEffect(() => {
    const key =
      listings.map((l) => l.id).sort().join(',') +
      (user ? `:${user.lat},${user.lng}` : '');

    // Prevent re-centering while user is actively dragging or browsing
    if (key === fittedRef.current) return;
    fittedRef.current = key;

    const pts = listings.map((l) => [l.latitude, l.longitude] as [number, number]);
    if (user) pts.push([user.lat, user.lng]);

    if (pts.length > 1) {
      map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 13 });
    } else if (pts.length === 1) {
      map.setView(pts[0], 12);
    }
  }, [listings, user, map]);

  return null;
}

export interface CultureMapProps {
  listings: Listing[];
  user?: { lat: number; lng: number } | null;
  height?: string;
  scrollZoom?: boolean;
}

export default function CultureMapInner({
  listings,
  user = null,
  height = '560px',
  scrollZoom = true,
}: CultureMapProps) {
  return (
    <MapContainer
      center={[10.52, 76.21]}
      zoom={9}
      dragging={true}
      touchZoom={true}
      doubleClickZoom={true}
      boxZoom={true}
      keyboard={true}
      scrollWheelZoom={scrollZoom}
      zoomControl={true}
      style={{ height, width: '100%', cursor: 'grab', zIndex: 1 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController listings={listings} user={user} />
      {user && (
        <CircleMarker
          center={[user.lat, user.lng]}
          radius={8}
          pathOptions={{ color: '#F6EBDD', fillColor: '#E06000', fillOpacity: 1 }}
        >
          <Popup>You are here</Popup>
        </CircleMarker>
      )}
      {listings.map((l) => (
        <Marker
          key={l.id}
          position={[l.latitude, l.longitude]}
          icon={iconFor(l.listing_type)}
          title={l.title}
        >
          <Popup>
            <Link href={`/listings/${l.slug}`} className="block w-56 no-underline">
              <span
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{
                  color: TYPE_META[l.listing_type].color === '#DB0016' ? '#E06000' : '#E06000',
                }}
              >
                {TYPE_META[l.listing_type].label}
              </span>
              <span className="mt-1 block font-display text-base font-bold text-cream">
                {l.title}
              </span>
              <span className="mt-1 block text-xs text-cream-muted">{l.location_name}</span>
              <span className="mt-2 line-clamp-3 block text-xs text-cream">
                {l.description}
              </span>
              <span className="mt-2 block text-xs font-bold text-saffron-500 underline">
                Open full listing →
              </span>
            </Link>
            {isStoredCreatedEvent(l.id) && (
              <div className="mt-2 border-t border-crimson-800/80 pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.confirm(`Delete "${l.title}" from the platform?`)) {
                      deleteStoredEvent(l.id);
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded bg-rose-950/90 border border-rose-700/60 px-2 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-900 hover:text-white transition-colors cursor-pointer"
                >
                  <span>🗑️ Delete Event</span>
                </button>
              </div>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
