/**
 * Geocoding Utility for Paaramparik
 * Provides instant local resolution for Kerala & Indian cultural hubs
 * plus live OpenStreetMap Nominatim geocoding for any place or address worldwide.
 */

interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

// Fast dictionary for instantaneous (<1ms) response for key cultural locations
const KNOWN_PLACES: Record<string, { lat: number; lng: number; name: string }> = {
  kunnamkulam: { lat: 10.6508, lng: 76.0694, name: 'Kunnamkulam, Thrissur, Kerala' },
  thrissur: { lat: 10.5276, lng: 76.2144, name: 'Thrissur (Trichur), Kerala' },
  trichur: { lat: 10.5276, lng: 76.2144, name: 'Thrissur, Kerala' },
  guruvayur: { lat: 10.5946, lng: 76.0407, name: 'Guruvayur, Thrissur, Kerala' },
  cheruthuruthy: { lat: 10.7483, lng: 76.2798, name: 'Cheruthuruthy (Kerala Kalamandalam), Kerala' },
  kalamandalam: { lat: 10.7483, lng: 76.2798, name: 'Kerala Kalamandalam, Cheruthuruthy, Kerala' },
  irinjalakuda: { lat: 10.3549, lng: 76.2081, name: 'Irinjalakuda (Koodalmanikyam), Thrissur, Kerala' },
  kochi: { lat: 9.9312, lng: 76.2673, name: 'Kochi (Cochin), Kerala' },
  cochin: { lat: 9.9312, lng: 76.2673, name: 'Cochin, Kerala' },
  ernakulam: { lat: 9.9816, lng: 76.2999, name: 'Ernakulam, Kochi, Kerala' },
  'fort kochi': { lat: 9.9658, lng: 76.2421, name: 'Fort Kochi, Kerala' },
  mattancherry: { lat: 9.9579, lng: 76.2595, name: 'Mattancherry, Kochi, Kerala' },
  tripunithura: { lat: 9.9482, lng: 76.3533, name: 'Tripunithura, Kerala' },
  palakkad: { lat: 10.7867, lng: 76.6548, name: 'Palakkad, Kerala' },
  kozhikode: { lat: 11.2588, lng: 75.7804, name: 'Kozhikode (Calicut), Kerala' },
  calicut: { lat: 11.2588, lng: 75.7804, name: 'Kozhikode (Calicut), Kerala' },
  kannur: { lat: 11.8745, lng: 75.3704, name: 'Kannur (Cannanore), Kerala' },
  kollam: { lat: 8.8932, lng: 76.6141, name: 'Kollam (Quilon), Kerala' },
  alappuzha: { lat: 9.4981, lng: 76.3388, name: 'Alappuzha (Alleppey), Kerala' },
  alleppey: { lat: 9.4981, lng: 76.3388, name: 'Alappuzha (Alleppey), Kerala' },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366, name: 'Thiruvananthapuram (Trivandrum), Kerala' },
  trivandrum: { lat: 8.5241, lng: 76.9366, name: 'Thiruvananthapuram, Kerala' },
  kottayam: { lat: 9.5916, lng: 76.5222, name: 'Kottayam, Kerala' },
  malappuram: { lat: 11.0732, lng: 76.0740, name: 'Malappuram, Kerala' },
  wayanad: { lat: 11.6050, lng: 76.0828, name: 'Wayanad (Kalpetta), Kerala' },
  kalpetta: { lat: 11.6050, lng: 76.0828, name: 'Kalpetta, Wayanad, Kerala' },
  kasaragod: { lat: 12.5102, lng: 74.9852, name: 'Kasaragod, Kerala' },
  vaikom: { lat: 9.7497, lng: 76.3958, name: 'Vaikom, Kottayam, Kerala' },
  aranmula: { lat: 9.3338, lng: 76.6853, name: 'Aranmula, Pathanamthitta, Kerala' },
  changanassery: { lat: 9.4447, lng: 76.5414, name: 'Changanassery, Kottayam, Kerala' },
  payyanur: { lat: 12.1009, lng: 75.2017, name: 'Payyanur, Kannur, Kerala' },
  thalassery: { lat: 11.7480, lng: 75.4894, name: 'Thalassery, Kannur, Kerala' },
  nilambur: { lat: 11.2776, lng: 76.2244, name: 'Nilambur, Malappuram, Kerala' },
  tirur: { lat: 10.9167, lng: 75.9236, name: 'Tirur, Malappuram, Kerala' },
  kodungallur: { lat: 10.2227, lng: 76.1953, name: 'Kodungallur, Thrissur, Kerala' },
  chalakudy: { lat: 10.3070, lng: 76.3335, name: 'Chalakudy, Thrissur, Kerala' },
  wadakkanchery: { lat: 10.6657, lng: 76.2452, name: 'Wadakkanchery, Thrissur, Kerala' },
  kanhangad: { lat: 12.3082, lng: 75.0906, name: 'Kanhangad, Kasaragod, Kerala' },
  madurai: { lat: 9.9252, lng: 78.1198, name: 'Madurai, Tamil Nadu' },
  thanjavur: { lat: 10.7870, lng: 79.1378, name: 'Thanjavur (Tanjore), Tamil Nadu' },
  chennai: { lat: 13.0827, lng: 80.2707, name: 'Chennai, Tamil Nadu' },
  bangalore: { lat: 12.9716, lng: 77.5946, name: 'Bengaluru (Bangalore), Karnataka' },
  bengaluru: { lat: 12.9716, lng: 77.5946, name: 'Bengaluru, Karnataka' },
  mysore: { lat: 12.2958, lng: 76.6394, name: 'Mysuru (Mysore), Karnataka' },
  mysuru: { lat: 12.2958, lng: 76.6394, name: 'Mysuru, Karnataka' },
  hampi: { lat: 15.3350, lng: 76.4600, name: 'Hampi Heritage Site, Karnataka' },
  varanasi: { lat: 25.3176, lng: 82.9739, name: 'Varanasi, Uttar Pradesh' },
  delhi: { lat: 28.6139, lng: 77.2090, name: 'Delhi, India' },
  mumbai: { lat: 19.0760, lng: 72.8777, name: 'Mumbai, Maharashtra' },
  jaipur: { lat: 26.9124, lng: 75.7873, name: 'Jaipur, Rajasthan' },
  kolkata: { lat: 22.5726, lng: 88.3639, name: 'Kolkata, West Bengal' },
};

// In-memory cache for dynamic Nominatim query responses
const cache = new Map<string, GeocodeResult>();

export async function geocodePlace(rawQuery: string): Promise<GeocodeResult | null> {
  const query = rawQuery.trim().toLowerCase();
  if (!query || query.length < 2) return null;

  // 1. Check known cultural places dictionary
  if (KNOWN_PLACES[query]) {
    const item = KNOWN_PLACES[query];
    return {
      lat: item.lat,
      lng: item.lng,
      displayName: item.name,
    };
  }

  // Check if query contains any known city/town key
  for (const [key, value] of Object.entries(KNOWN_PLACES)) {
    if (query === key || query.startsWith(key + ' ') || query.endsWith(' ' + key) || query.includes(`, ${key}`) || query.includes(` ${key} `)) {
      return {
        lat: value.lat,
        lng: value.lng,
        displayName: value.name,
      };
    }
  }

  // 2. Check local memory cache
  if (cache.has(query)) {
    return cache.get(query)!;
  }

  // 3. Query OpenStreetMap Nominatim for live geocoding
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(rawQuery)}&limit=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PaaramparikLivingCultureMap/1.0',
      },
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const results = await res.json();
    if (Array.isArray(results) && results.length > 0) {
      const top = results[0];
      const result: GeocodeResult = {
        lat: Number(parseFloat(top.lat).toFixed(6)),
        lng: Number(parseFloat(top.lon).toFixed(6)),
        displayName: top.display_name,
      };
      cache.set(query, result);
      return result;
    }
  } catch (err) {
    // If external fetch aborts or fails due to network, gracefully return null
    console.warn('[GEOCODING] OSM Nominatim lookup skipped:', (err as Error).message);
  }

  return null;
}
