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
 * Strip administrative suffixes from a Chinese city name.
 * "阿坝藏族羌族自治州" → "阿坝"
 * "神农架林区" → "神农架"
 * "杭州市" → "杭州"
 */
export function stripCitySuffix(name: string): string {
  return name
    .replace(/土家族苗族自治州$/, "")
    .replace(/蒙古族藏族自治州$/, "")
    .replace(/藏族羌族自治州$/, "")
    .replace(/哈萨克族自治州$/, "")
    .replace(/柯尔克孜自治州$/, "")
    .replace(/哈尼族自治州$/, "")
    .replace(/朝鲜族自治州$/, "")
    .replace(/蒙古族自治州$/, "")
    .replace(/白族自治州$/, "")
    .replace(/彝族自治州$/, "")
    .replace(/藏族自治州$/, "")
    .replace(/苗族自治州$/, "")
    .replace(/回族自治州$/, "")
    .replace(/壮族自治州$/, "")
    .replace(/傣族自治州$/, "")
    .replace(/蒙古自治州$/, "")
    .replace(/自治州$/, "")
    .replace(/自治县$/, "")
    .replace(/市$/, "")
    .replace(/地区$/, "")
    .replace(/盟$/, "")
    .replace(/林区$/, "")
    .replace(/省$/, "");
}

/**
 * Extract the Chinese city name from a location string.
 * "北京, 中国" → "北京"
 * "上海市, 中国" → "上海"
 * "杭州, 浙江, 中国" → "杭州"
 */
export function extractCityName(location: string): string {
  const parts = location.split(/[,，、\s]+/);
  const raw = parts[0]?.trim() ?? "";
  return stripCitySuffix(raw);
}

/**
 * Match a trip location to a city boundary GeoJSON feature.
 * Tries exact match, then strips suffixes progressively.
 */
export function matchCityBoundary(
  cityNameOrLocation: string,
  geoJSON: FeatureCollection,
): GeoJSONFeature | null {
  // Try exact match
  let feature = geoJSON.features.find(
    (f) => f.properties?.name === cityNameOrLocation,
  );
  if (feature) return feature;

  // Try with suffixes stripped
  const stripped = stripCitySuffix(cityNameOrLocation);
  if (stripped !== cityNameOrLocation) {
    feature = geoJSON.features.find(
      (f) => f.properties?.name === stripped,
    );
    if (feature) return feature;
  }

  return null;
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
