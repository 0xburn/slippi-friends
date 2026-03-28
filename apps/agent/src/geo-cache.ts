let cachedGeo: { lat: number; lon: number; region: string } | null = null;

export function setCachedGeo(geo: { lat: number; lon: number; region: string }) {
  cachedGeo = geo;
}

export function getCachedGeo() {
  return cachedGeo;
}
