'use client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import { TYPE_META } from '@/lib/listing-meta';
import type { Listing } from '@/types';

const iconCache: Record<string, L.DivIcon> = {};
const iconFor = (type: Listing['listing_type']) =>
  (iconCache[type] ??= L.divIcon({
    className: '', iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28],
    html: `<div class="lcm-marker" style="background:${TYPE_META[type].color}"><span>${TYPE_META[type].glyph}</span></div>`,
  }));

function Fit({ listings, user }: { listings: Listing[]; user: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    const pts = listings.map((l) => [l.latitude, l.longitude] as [number, number]);
    if (user) pts.push([user.lat, user.lng]);
    if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 13 });
    else if (pts.length === 1) map.setView(pts[0], 12);
  }, [listings, user, map]);
  return null;
}

export interface CultureMapProps { listings: Listing[]; user?: { lat: number; lng: number } | null; height?: string; scrollZoom?: boolean }

export default function CultureMapInner({ listings, user = null, height = '560px', scrollZoom = true }: CultureMapProps) {
  return (
    <MapContainer center={[10.52, 76.21]} zoom={9} scrollWheelZoom={scrollZoom} style={{ height, width: '100%' }} zoomControl>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Fit listings={listings} user={user} />
      {user && <CircleMarker center={[user.lat, user.lng]} radius={8} pathOptions={{ color: '#FFF5EB', fillColor: '#FF933E', fillOpacity: 1 }}><Popup>You are here</Popup></CircleMarker>}
      {listings.map((l) => (
        <Marker key={l.id} position={[l.latitude, l.longitude]} icon={iconFor(l.listing_type)} title={l.title}>
          <Popup>
            <Link href={`/listings/${l.slug}`} className="block w-56 no-underline">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF933E]">{TYPE_META[l.listing_type].label}</span>
              <span className="mt-1 block font-display text-base font-bold text-cream">{l.title}</span>
              <span className="mt-1 block text-xs text-cream-muted">{l.location_name}</span>
              <span className="mt-2 line-clamp-3 block text-xs text-cream">{l.description}</span>
              <span className="mt-2 block text-xs font-bold text-[#FF933E] hover:underline">Open full listing →</span>
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
