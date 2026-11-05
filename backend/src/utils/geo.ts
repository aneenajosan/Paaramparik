/**
 * Geographical calculation utilities for location and radius filtering
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates Great-Circle distance using Haversine formula between two coordinates in kilometers
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 100) / 100; // 2 decimal places
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates a bounding box [minLat, maxLat, minLng, maxLng] for a given center coordinate and radius.
 * Enables fast database index scanning before precise spherical distance calculation.
 */
export function getBoundingBox(
  latitude: number,
  longitude: number,
  radiusKm: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const latDelta = radiusKm / 111.0; // 1 degree of latitude is ~111 km
  const lonDelta = radiusKm / (111.0 * Math.cos(toRadians(latitude)));

  return {
    minLat: Math.max(-90, latitude - latDelta),
    maxLat: Math.min(90, latitude + latDelta),
    minLng: Math.max(-180, longitude - Math.abs(lonDelta)),
    maxLng: Math.min(180, longitude + Math.abs(lonDelta)),
  };
}

