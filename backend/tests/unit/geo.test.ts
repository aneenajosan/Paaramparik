import { calculateHaversineDistanceKm, getBoundingBox } from '../../src/utils/geo';

describe('Geo Utilities', () => {
  // Kunnamkulam coordinates: ~10.65, 76.07
  // Thrissur coordinates: ~10.5276, 76.2144
  const kunnamkulam = { lat: 10.65, lon: 76.07 };
  const thrissur = { lat: 10.5276, lon: 76.2144 };

  describe('calculateHaversineDistanceKm', () => {
    it('returns 0 when coordinates are identical', () => {
      const distance = calculateHaversineDistanceKm(
        kunnamkulam.lat,
        kunnamkulam.lon,
        kunnamkulam.lat,
        kunnamkulam.lon
      );
      expect(distance).toBe(0);
    });

    it('accurately calculates distance between Kunnamkulam and Thrissur (~20-25 km)', () => {
      const distance = calculateHaversineDistanceKm(
        kunnamkulam.lat,
        kunnamkulam.lon,
        thrissur.lat,
        thrissur.lon
      );
      expect(distance).toBeGreaterThan(20);
      expect(distance).toBeLessThan(25);
    });

    it('is symmetric: distance(A, B) === distance(B, A)', () => {
      const d1 = calculateHaversineDistanceKm(
        kunnamkulam.lat,
        kunnamkulam.lon,
        thrissur.lat,
        thrissur.lon
      );
      const d2 = calculateHaversineDistanceKm(
        thrissur.lat,
        thrissur.lon,
        kunnamkulam.lat,
        kunnamkulam.lon
      );
      expect(d1).toBe(d2);
    });
  });

  describe('getBoundingBox', () => {
    it('creates a bounding box covering the radius', () => {
      const box = getBoundingBox(kunnamkulam.lat, kunnamkulam.lon, 10);
      expect(box.minLat).toBeLessThan(kunnamkulam.lat);
      expect(box.maxLat).toBeGreaterThan(kunnamkulam.lat);
      expect(box.minLng).toBeLessThan(kunnamkulam.lon);
      expect(box.maxLng).toBeGreaterThan(kunnamkulam.lon);
    });

    it('clamps latitude within [-90, 90] and longitude within [-180, 180]', () => {
      const northPoleBox = getBoundingBox(89.5, 0, 100);
      expect(northPoleBox.maxLat).toBeLessThanOrEqual(90);

      const datelineBox = getBoundingBox(0, 179.5, 100);
      expect(datelineBox.maxLng).toBeLessThanOrEqual(180);
    });
  });
});

