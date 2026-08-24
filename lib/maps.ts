
export function directionsUrl(location: string, mapQuery?: string | null): string {
  const destination = (mapQuery && mapQuery.trim()) || location;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
