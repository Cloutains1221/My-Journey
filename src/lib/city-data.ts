// ---------------------------------------------------------------------------
// Minimal GeoJSON types (no external dependency needed)
// ---------------------------------------------------------------------------
export interface GeoJSONFeature {
  type: "Feature";
  properties: Record<string, any>;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: any;
  };
}

export interface FeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

// ---------------------------------------------------------------------------
// City matching utilities
// ---------------------------------------------------------------------------

/**
 * Extract the Chinese city name from a location string.
 * "北京, 中国" → "北京"
 * "上海市, 中国" → "上海"
 * "杭州, 浙江, 中国" → "杭州"
 */
export function extractCityName(location: string): string {
  const parts = location.split(/[,，、\s]+/);
  const raw = parts[0]?.trim() ?? "";
  return raw.replace(/[市省]$/, "");
}

/**
 * Match a trip location to a city boundary GeoJSON feature.
 * Uses explicit city_name if available; falls back to parsing from location string.
 */
export function matchCityBoundary(
  cityNameOrLocation: string,
  geoJSON: FeatureCollection,
): GeoJSONFeature | null {
  // Try exact match first (for explicit city_name from admin form)
  let feature = geoJSON.features.find(
    (f) => f.properties?.name === cityNameOrLocation,
  );
  if (feature) return feature;

  // Fall back to extracted name from location string
  const city = extractCityName(cityNameOrLocation);
  feature = geoJSON.features.find(
    (f) => f.properties?.name === city,
  );
  return feature ?? null;
}

/**
 * Generate Leaflet path style for a city boundary polygon.
 * Neon-glow dashed border on dark map backgrounds.
 */
export function getCityPolygonStyle(rating: number) {
  return {
    color: getRatingColor(rating),
    weight: 2,
    opacity: 0.7,
    fillColor: getRatingColor(rating),
    fillOpacity: 0.12,
    dashArray: "6 8",
    className: "city-boundary",
  };
}

/** Glow halo style — wider, fainter stroke behind the main boundary */
export function getCityGlowStyle(rating: number) {
  return {
    color: getRatingColor(rating),
    weight: 6,
    opacity: 0.15,
    fillColor: "transparent",
    fillOpacity: 0,
    className: "city-boundary-glow",
  };
}

export function getRatingColor(rating: number): string {
  const colors: Record<number, string> = {
    1: "#6b7280",
    2: "#94a3b8",
    3: "#66bb6a",
    4: "#ffa726",
    5: "#ff6b6b",
  };
  return colors[rating] ?? "#ff6b6b";
}
