'use client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

const pin = L.divIcon({ className: '', iconSize: [30, 30], iconAnchor: [15, 30], html: '<div class="lcm-marker" style="background:#FF933E"><span>•</span></div>' });
function Clicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))) });
  return null;
}
export interface PickerProps { lat: number | null; lng: number | null; onPick: (lat: number, lng: number) => void }
export default function LocationPickerInner({ lat, lng, onPick }: PickerProps) {
  return (
    <MapContainer center={lat != null && lng != null ? [lat, lng] : [10.52, 76.21]} zoom={lat != null ? 13 : 9} style={{ height: '320px', width: '100%' }}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Clicker onPick={onPick} />
      {lat != null && lng != null && <Marker position={[lat, lng]} icon={pin} />}
    </MapContainer>
  );
}
