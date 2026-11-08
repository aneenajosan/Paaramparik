'use client';

import React, { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';

const pin = L.divIcon({
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#E06000;border:3px solid #FFF8E7;box-shadow:0 0 14px rgba(224,96,0,0.85);color:#FFF8E7;font-weight:bold;font-size:16px;">📍</div>`,
});

function MapRecenter({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();

  useEffect(() => {
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      map.flyTo([lat, lng], 13, {
        animate: true,
        duration: 1.2,
      });
      // Invalidate size in case parent container resized
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [lat, lng, map]);

  return null;
}

function Clicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onPick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
}

export interface PickerProps {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
}

export default function LocationPickerInner({ lat, lng, onPick }: PickerProps) {
  const defaultPos: [number, number] = lat != null && lng != null ? [lat, lng] : [10.6508, 76.0694];

  return (
    <MapContainer
      center={defaultPos}
      zoom={lat != null ? 13 : 10}
      scrollWheelZoom={true}
      style={{ height: '340px', width: '100%', zIndex: 1 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Clicker onPick={onPick} />
      <MapRecenter lat={lat} lng={lng} />
      {lat != null && lng != null && (
        <Marker
          position={[lat, lng]}
          icon={pin}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const position = marker.getLatLng();
              onPick(Number(position.lat.toFixed(6)), Number(position.lng.toFixed(6)));
            },
          }}
        />
      )}
    </MapContainer>
  );
}
