'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from 'react-leaflet';
import { TYPE_META } from '@/lib/listing-meta';
import type { Listing } from '@/types';

// Bounding box strictly encompassing Kerala and immediate cultural border regions
const KERALA_MAX_BOUNDS: L.LatLngBoundsExpression = [
  [7.5, 73.5], // South-West
  [13.8, 79.5], // North-East
];

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
  isLocked,
}: {
  listings: Listing[];
  user: { lat: number; lng: number } | null;
  isLocked: boolean;
}) {
  const map = useMap();
  const fittedRef = useRef<string>('');

  // Synchronize dragging state based on lock
  useEffect(() => {
    if (isLocked) {
      map.dragging.disable();
      if (map.touchZoom) map.touchZoom.disable();
    } else {
      map.dragging.enable();
      if (map.touchZoom) map.touchZoom.enable();
    }
    map.invalidateSize();
  }, [map, isLocked]);

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
      map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 13, animate: false });
    } else if (pts.length === 1) {
      map.setView(pts[0], 12);
    }
  }, [listings, user, map]);

  return null;
}

function MapOverlayControls({
  listings,
  user,
  isLocked,
  onToggleLock,
  showLockToggle,
}: {
  listings: Listing[];
  user: { lat: number; lng: number } | null;
  isLocked: boolean;
  onToggleLock: () => void;
  showLockToggle: boolean;
}) {
  const map = useMap();

  const handleRecenter = (e: React.MouseEvent) => {
    e.stopPropagation();
    const pts = listings.map((l) => [l.latitude, l.longitude] as [number, number]);
    if (user) pts.push([user.lat, user.lng]);

    if (pts.length > 1) {
      map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 13, animate: true });
    } else if (pts.length === 1) {
      map.setView(pts[0], 12, { animate: true });
    } else {
      map.setView([10.52, 76.21], 9, { animate: true });
    }
  };

  return (
    <div
      className="leaflet-top leaflet-right"
      style={{ pointerEvents: 'auto', margin: '12px', zIndex: 1000 }}
    >
      <div className="flex items-center gap-2">
        {showLockToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock();
            }}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur transition-all ${
              isLocked
                ? 'bg-crimson-950/95 text-saffron-300 border border-saffron-500/60 hover:bg-crimson-900 hover:border-saffron-400'
                : 'bg-emerald-950/95 text-emerald-300 border border-emerald-500/60 hover:bg-emerald-900'
            }`}
            title={
              isLocked
                ? 'Scroll-Safe Mode active. Prevents map from sliding while scrolling page. Click to enable dragging.'
                : 'Dragging active. Click to lock map and scroll page freely.'
            }
          >
            {isLocked ? (
              <>
                <span>🔒 Scroll-Safe</span>
                <span className="hidden sm:inline text-[10px] text-cream-muted font-normal">
                  (Click to drag)
                </span>
              </>
            ) : (
              <>
                <span>🖐️ Drag Active</span>
                <span className="hidden sm:inline text-[10px] text-emerald-400 font-normal">
                  (Click to lock)
                </span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={handleRecenter}
          className="flex items-center gap-1.5 rounded-full border border-crimson-800 bg-crimson-950/95 px-3 py-1.5 text-xs font-semibold text-cream shadow-lg backdrop-blur hover:border-saffron-500 hover:text-saffron-300 transition-all"
          title="Recenter view on Kerala cultural listings"
        >
          <span>🎯</span>
          <span>Recenter Kerala</span>
        </button>
      </div>
    </div>
  );
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
  // When embedded in a scrollable page (scrollZoom=false), start in Scroll-Safe mode so scrolling doesn't slide the map
  const isEmbedded = !scrollZoom;
  const [isLocked, setIsLocked] = useState(isEmbedded);
  const [showHint, setShowHint] = useState(false);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleContainerClick = () => {
    if (isLocked) {
      setIsLocked(false);
    }
  };

  const handleMouseEnter = () => {
    if (isLocked) {
      setShowHint(true);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => setShowHint(false), 2500);
    }
  };

  const handleMouseLeave = () => {
    setShowHint(false);
    // Auto-relock embedded map when mouse leaves so scrolling is never hijacked
    if (isEmbedded && !isLocked) {
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => {
        setIsLocked(true);
      }, 3000);
    }
  };

  return (
    <div
      className="relative w-full h-full select-none"
      onClick={handleContainerClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <MapContainer
        center={[10.52, 76.21]}
        zoom={9}
        minZoom={7}
        maxZoom={16}
        maxBounds={KERALA_MAX_BOUNDS}
        maxBoundsViscosity={1.0}
        dragging={!isLocked}
        touchZoom={!isLocked}
        doubleClickZoom={true}
        boxZoom={true}
        keyboard={true}
        scrollWheelZoom={scrollZoom}
        zoomControl={true}
        style={{
          height,
          width: '100%',
          cursor: isLocked ? 'default' : 'grab',
          touchAction: isLocked ? 'pan-y' : 'none',
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController listings={listings} user={user} isLocked={isLocked} />
        <MapOverlayControls
          listings={listings}
          user={user}
          isLocked={isLocked}
          onToggleLock={() => setIsLocked(!isLocked)}
          showLockToggle={isEmbedded}
        />

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
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Subtle overlay hint when user hovers while locked */}
      {isEmbedded && isLocked && showHint && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-saffron-500/40 bg-crimson-950/90 px-4 py-1.5 text-xs text-saffron-300 shadow-xl backdrop-blur transition-opacity animate-in fade-in duration-200 z-[1000]">
          💡 Click map to drag &bull; Scroll naturally to read page
        </div>
      )}
    </div>
  );
}
