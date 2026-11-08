'use client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import { TYPE_META } from '@/lib/listing-meta';
import { DEFAULT_CATEGORY_IMAGES, DEFAULT_TYPE_IMAGES } from '@/components/listings/CoverArt';
import { isStoredCreatedEvent, deleteStoredEvent } from '@/lib/created-events';
import type { Listing } from '@/types';

function extractState(locationName: string | null): string {
  if (!locationName) return '';
  const parts = locationName.split(',');
  return parts[parts.length - 1].trim();
}

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
      map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 12 });
    } else if (pts.length === 1) {
      map.setView(pts[0], 10);
    }
  }, [listings, user, map]);

  return null;
}

function MapClickHandler({
  listings,
  onSelectState,
}: {
  listings: Listing[];
  onSelectState?: (state: string) => void;
}) {
  useMapEvents({
    click(e) {
      const clickLat = e.latlng.lat;
      const clickLng = e.latlng.lng;
      let minDist = Infinity;
      let closest: Listing | null = null;
      for (const l of listings) {
        const dist = (l.latitude - clickLat) ** 2 + (l.longitude - clickLng) ** 2;
        if (dist < minDist) {
          minDist = dist;
          closest = l;
        }
      }
      if (closest) {
        const state = extractState(closest.location_name);
        if (state) {
          onSelectState?.(state);
          window.dispatchEvent(
            new CustomEvent('lcm:select-state', { detail: { state } })
          );
        }
      }
    },
  });
  return null;
}

export interface CultureMapProps {
  listings: Listing[];
  user?: { lat: number; lng: number } | null;
  height?: string;
  scrollZoom?: boolean;
  onSelectState?: (state: string) => void;
  onSelectListing?: (listing: Listing) => void;
}

export default function CultureMapInner({
  listings,
  user = null,
  height = '560px',
  scrollZoom = true,
  onSelectState,
  onSelectListing,
}: CultureMapProps) {
  // Compute count of events per state
  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of listings) {
      const st = extractState(l.location_name);
      if (st) counts[st] = (counts[st] || 0) + 1;
    }
    return counts;
  }, [listings]);

  return (
    <MapContainer
      center={[21.5, 78.5]}
      zoom={5}
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
      <MapClickHandler listings={listings} onSelectState={onSelectState} />
      {user && (
        <CircleMarker
          center={[user.lat, user.lng]}
          radius={8}
          pathOptions={{ color: '#F6EBDD', fillColor: '#E06000', fillOpacity: 1 }}
        >
          <Popup>You are here</Popup>
        </CircleMarker>
      )}
      {listings.map((l) => {
        const state = extractState(l.location_name);
        const stateCount = state ? stateCounts[state] || 1 : 1;
        const imgSrc =
          l.cover_image ||
          (l.category_id && DEFAULT_CATEGORY_IMAGES[l.category_id]) ||
          DEFAULT_TYPE_IMAGES[l.listing_type];

        return (
          <Marker
            key={l.id}
            position={[l.latitude, l.longitude]}
            icon={iconFor(l.listing_type)}
            title={l.title}
            eventHandlers={{
              click: () => {
                onSelectListing?.(l);
                if (state) {
                  window.dispatchEvent(
                    new CustomEvent('lcm:marker-selected', { detail: { state, listingId: l.id } })
                  );
                }
              },
            }}
          >
            <Popup className="lcm-custom-popup">
              <div className="w-64 max-w-[280px] overflow-hidden rounded-xl bg-crimson-950 text-cream p-0 -m-3 sm:-m-3.5">
                {/* Cover Photograph Thumbnail */}
                {imgSrc && (
                  <div className="relative h-28 w-full overflow-hidden bg-crimson-900">
                    <img
                      src={imgSrc}
                      alt={l.title}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-crimson-950 via-transparent to-black/30" />
                    <span
                      className="absolute top-2 left-2 rounded-md px-2 py-0.5 text-[10px] font-bold text-white shadow-md backdrop-blur-sm"
                      style={{ backgroundColor: `${TYPE_META[l.listing_type].color}ee` }}
                    >
                      {TYPE_META[l.listing_type].glyph} {TYPE_META[l.listing_type].label}
                    </span>
                  </div>
                )}

                <div className="p-3.5">
                  <Link href={`/listings/${l.slug}`} className="block group no-underline">
                    <h4 className="font-display text-sm font-bold text-cream group-hover:text-saffron-400 transition-colors leading-snug">
                      {l.title}
                    </h4>
                  </Link>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-cream-muted">
                    <span className="text-saffron-500">📍</span>
                    <span className="truncate">{l.location_name || l.district}</span>
                  </div>
                  {l.event_start && (
                    <div className="mt-1 text-[10px] text-saffron-400 font-semibold">
                      🗓️ {l.event_start} {l.event_start_time ? `• ${l.event_start_time.slice(0, 5)}` : ''}
                    </div>
                  )}
                  <p className="mt-1.5 text-[11px] text-cream/80 line-clamp-2 leading-relaxed">
                    {l.description}
                  </p>

                  {/* Actions: View Details and Filter by State */}
                  <div className="mt-3 pt-2.5 border-t border-crimson-800/80 flex items-center justify-between gap-1.5">
                    <Link
                      href={`/listings/${l.slug}`}
                      className="text-[11px] font-bold text-saffron-400 hover:text-saffron-300 underline"
                    >
                      Full Details →
                    </Link>
                    {state && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onSelectState?.(state);
                          window.dispatchEvent(
                            new CustomEvent('lcm:select-state', { detail: { state } })
                          );
                        }}
                        className="rounded bg-saffron-500/20 hover:bg-saffron-500 text-saffron-300 hover:text-crimson-950 border border-saffron-500/50 px-2 py-1 text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                        title={`Show all ${stateCount} famous events from ${state}`}
                      >
                        All {state} ({stateCount})
                      </button>
                    )}
                  </div>

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
                        className="inline-flex items-center gap-1 rounded bg-rose-950/90 border border-rose-700/60 px-2 py-1 text-[10px] font-semibold text-rose-300 hover:bg-rose-900 hover:text-white transition-colors cursor-pointer"
                      >
                        <span>🗑️ Delete Event</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
