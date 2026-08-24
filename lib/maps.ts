// Zero-setup Google Maps integration: no API key, no billing account.
//
// `location` is the free-text address/venue line the host types and guests
// see displayed on the card as-is.
//
// `mapQuery` is optional and separate: a precise address or lat,lng pin the
// host can paste in (e.g. copied straight from Google Maps by right-clicking
// a pin → "copy coordinates", or a formatted address for an exact building).
// When present it's used instead of `location` to build the link, so a
// vague or informal `location` string ("the barn off Route 9") doesn't have
// to be precise for guests to get accurate directions.
//
// The link itself uses Google's directions endpoint (not just a search), so
// clicking it opens turn-by-turn directions immediately rather than a pin.
export function directionsUrl(location: string, mapQuery?: string | null): string {
  const destination = (mapQuery && mapQuery.trim()) || location;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
