// `location` is the free-text address/venue line the host types and guests
// see displayed on the card as-is.
//
// `mapQuery` is optional and separate: a precise address or lat,lng pin the
// host can paste in (e.g. copied straight from Google Maps by right-clicking
// a pin → "copy coordinates", or a formatted address for an exact building).
// When present it's used instead of `location`, so a vague or informal
// `location` string ("the barn off Route 9") doesn't have to be precise for
// guests to get an accurate map/directions.
function destinationFor(location: string, mapQuery?: string | null): string {
  return (mapQuery && mapQuery.trim()) || location;
}

// A real embedded, interactive map right on the invite page — no separate
// tab, no leaving the site. Uses Google's Maps Embed API, which needs a
// (free-tier) API key set as NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY. Returns
// null when no key is configured or there's nothing to show, so callers
// can fall back to a plain directions link instead.
export function embedMapSrc(location: string, mapQuery?: string | null): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const destination = destinationFor(location, mapQuery);
  if (!key || !destination) return null;
  return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${encodeURIComponent(destination)}`;
}

// A plain "open directions" link — used as the fallback when no Maps
// Embed API key is configured, and shown alongside the embedded map too
// (an embed doesn't give turn-by-turn navigation by itself).
export function directionsUrl(location: string, mapQuery?: string | null): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationFor(location, mapQuery))}`;
}
