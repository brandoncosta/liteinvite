// Zero-setup Google Maps integration: no API key, no billing account. A
// plain search-query URL opens Google Maps (app on mobile, web on desktop)
// with the typed location — works for a full address or just a venue name.
export function googleMapsUrl(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}
