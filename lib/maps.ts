// Maps for the invite page.
//
// The goal is a real interactive map embedded in the page — guests should
// never have to leave for a separate Google Maps tab just to see where
// they're going. There are two ways to get one here, and the app picks
// automatically:
//
//   1. Google Maps Embed API — used when NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY
//      is set. Nicest looking, but Google requires a billing account on
//      file to issue a key, even though the Embed API itself is free.
//   2. OpenStreetMap — the default. No API key, no account, no billing,
//      works the moment you deploy. Needs coordinates rather than a text
//      address, so we geocode once (see geocode below) and cache the
//      result on the event row.
//
// Either way the map is an <iframe> in the page, not a link out.

export function destinationFor(location: string, mapQuery?: string | null): string {
  return (mapQuery && mapQuery.trim()) || location;
}

// A host can paste raw coordinates ("38.8977, -77.0365") straight from
// Google Maps' right-click menu — no geocoding round-trip needed then.
export function parseLatLng(value?: string | null): { lat: number; lng: number } | null {
  if (!value) return null;
  const m = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

// Address → coordinates via Nominatim, OpenStreetMap's free geocoder. No
// key required. Their usage policy asks for an identifying User-Agent and
// at most one request per second, which is why we call this once when an
// event is created and store the answer, rather than on every page view.
export async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const direct = parseLatLng(query);
  if (direct) return direct;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LiteInvite/1.0 (self-hosted invite app)' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as { lat?: string; lon?: string }[];
    const first = rows?.[0];
    if (!first?.lat || !first?.lon) return null;
    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  } catch {
    // Geocoding is a nicety — a failure just means no embedded map, and
    // the directions link below still works.
    return null;
  }
}

export interface MapEmbed {
  src: string;
  provider: 'google' | 'osm';
}

// Builds the <iframe> source for whichever provider is available.
// Returns null only when there's nothing to show at all.
export function mapEmbed(
  location: string,
  mapQuery?: string | null,
  coords?: { lat: number | null; lng: number | null } | null
): MapEmbed | null {
  const destination = destinationFor(location, mapQuery);
  if (!destination) return null;

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  if (key) {
    return {
      provider: 'google',
      src: `https://www.google.com/maps/embed/v1/place?key=${key}&q=${encodeURIComponent(destination)}`,
    };
  }

  const point = parseLatLng(mapQuery) || (coords?.lat != null && coords?.lng != null ? { lat: coords.lat, lng: coords.lng } : null);
  if (!point) return null;

  // A small bounding box around the point gives a street-level view.
  const d = 0.004;
  const bbox = [point.lng - d, point.lat - d, point.lng + d, point.lat + d].join(',');
  return {
    provider: 'osm',
    src: `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${point.lat},${point.lng}`,
  };
}

// Turn-by-turn directions still need to open in a maps app — an embedded
// map can't navigate. Shown as a link beneath the embed.
export function directionsUrl(location: string, mapQuery?: string | null): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationFor(location, mapQuery))}`;
}
