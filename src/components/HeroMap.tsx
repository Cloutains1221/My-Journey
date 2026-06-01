"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type L from "leaflet";
import type { Trip } from "@/lib/types";
import { formatDateRange } from "@/lib/types";
import { matchCityBoundary } from "@/lib/city-data";
import type { FeatureCollection } from "@/lib/city-data";
import { wgs84ToGcj02 } from "@/lib/coords";

// ---- Rating color map ----
const RATING_COLORS: Record<number, string> = {
  1: "#6b7280", 2: "#94a3b8", 3: "#66bb6a", 4: "#ffa726", 5: "#ff6b6b",
};
function color(r: number) { return RATING_COLORS[r] ?? "#ff6b6b"; }

// ---- Gaode dark tile URL (Chinese labels, GCJ-02) ----
const GAODE_URL =
  "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}";

// ---- CARTO fallback (English labels, WGS-84) ----
const CARTO_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

// ---- Shared Leaflet import (dedup across effects) ----
let _L: typeof import("leaflet") | null = null;
async function getLeaflet() {
  if (!_L) _L = await import("leaflet");
  return _L;
}

// ---- Client-side GeoJSON cache ----
let _boundariesCache: FeatureCollection | null = null;
async function loadBoundaries(): Promise<FeatureCollection | null> {
  if (_boundariesCache) return _boundariesCache;
  try {
    const res = await fetch("/api/city-boundaries");
    if (res.ok) {
      _boundariesCache = await res.json();
      return _boundariesCache;
    }
  } catch { /* ignore */ }
  return null;
}

export default function HeroMap({ trips }: { trips: Trip[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // --- Init map ---
  useEffect(() => {
    if (!mapRef.current) return;

    getLeaflet().then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [35, 115],
        zoom: 4,
        scrollWheelZoom: false,
        dragging: true,
        zoomControl: false,
        attributionControl: false,
        renderer: L.canvas(),
      });

      // Gaode tiles with CARTO fallback
      let tileFailCount = 0;
      const gaode = L.tileLayer(GAODE_URL, {
        maxZoom: 18,
        subdomains: ["1", "2", "3", "4"],
      }).addTo(map);

      gaode.on("tileerror", () => {
        tileFailCount++;
        if (tileFailCount >= 5) {
          gaode.remove();
          L.tileLayer(CARTO_URL, { maxZoom: 19 }).addTo(map);
          tileFailCount = -999;
        }
      });

      mapInstanceRef.current = map;
      setMapReady(true);
    });

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // --- Render city polygons + markers ---
  useEffect(() => {
    if (!mapReady) return;

    getLeaflet().then(async (L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Clear previous
      layersRef.current.forEach((l) => l.remove());
      layersRef.current = [];

      // Load city boundary GeoJSON (cached after first fetch)
      const geoJSON = await loadBoundaries();

      // Group trips by city name (prefer explicit city_name, fall back to parsing location)
      const cityMap = new Map<string, Trip[]>();
      trips.forEach((t) => {
        const c = t.city_name || t.location;
        const arr = cityMap.get(c);
        if (arr) arr.push(t);
        else cityMap.set(c, [t]);
      });

      cityMap.forEach((cityTrips, cityName) => {
        const avgRating = Math.round(cityTrips.reduce((s, t) => s + t.rating, 0) / cityTrips.length);
        const c = color(avgRating);

        // Try boundary polygon (use city_name as the primary key for matching)
        const feature = geoJSON
          ? matchCityBoundary(cityName, geoJSON)
          : null;

        if (feature) {
          // Glow halo
          const glow = L.geoJSON(feature, {
            style: () => ({
              color: c, weight: 8, opacity: 0.15,
              fillColor: "transparent", fillOpacity: 0,
            }),
          }).addTo(map);

          // Fill + border (solid line, outer perimeter only)
          const main = L.geoJSON(feature, {
            style: () => ({
              color: c, weight: 2, opacity: 0.8,
              fillColor: c, fillOpacity: 0.1,
            }),
          }).addTo(map);

          // Popup
          const html = cityTrips.map(
            (t) =>
              `<div style="margin:3px 0;font-size:12px;border-left:2px solid ${color(t.rating)};padding-left:6px;">${t.title} <span style="color:#888;font-size:10px;">${formatDateRange(t.date, t.end_date)}</span></div>`,
          ).join("");
          main.bindPopup(`
            <div style="color:#fff;background:#111;padding:10px 14px;border-radius:10px;font-family:system-ui;min-width:160px;">
              <div style="font-weight:700;font-size:14px;margin-bottom:6px;">${cityName}</div>
              ${html}
            </div>
          `);

          // Hover
          main.on("mouseover", () => {
            main.setStyle({ fillOpacity: 0.25, opacity: 1, weight: 3 });
            glow.setStyle({ opacity: 0.35, weight: 14 });
          });
          main.on("mouseout", () => {
            main.setStyle({ color: c, weight: 2, opacity: 0.8, fillColor: c, fillOpacity: 0.1 });
            glow.setStyle({ color: c, weight: 8, opacity: 0.15, fillColor: "transparent", fillOpacity: 0 });
          });

          layersRef.current.push(glow, main);
        } else {
          // No boundary found — show clickable circle marker with pulse ring
          const gcj = wgs84ToGcj02(cityTrips[0].latitude, cityTrips[0].longitude);

          const pulse = L.circleMarker([gcj.lat, gcj.lng], {
            radius: 14, fillColor: c, color: c,
            weight: 1.5, opacity: 0.35, fillOpacity: 0.12,
          }).addTo(map);

          const circle = L.circleMarker([gcj.lat, gcj.lng], {
            radius: 7, fillColor: c, color: c,
            weight: 2, opacity: 0.9, fillOpacity: 0.45,
          }).addTo(map);

          const html = cityTrips.map(
            (t) =>
              `<div style="margin:3px 0;font-size:12px;border-left:2px solid ${color(t.rating)};padding-left:6px;">${t.title} <span style="color:#888;font-size:10px;">${formatDateRange(t.date, t.end_date)}</span></div>`,
          ).join("");
          const popupContent = `
            <div style="color:#fff;background:#111;padding:10px 14px;border-radius:10px;font-family:system-ui;min-width:160px;">
              <div style="font-weight:700;font-size:14px;margin-bottom:6px;">${cityTrips[0].location}</div>
              ${html}
            </div>
          `;

          circle.bindPopup(popupContent);
          // Explicit click handler on the larger pulse ring for easier targeting
          pulse.bindPopup(popupContent);

          circle.on("mouseover", () => {
            pulse.setRadius(22); pulse.setStyle({ opacity: 0.6, weight: 2 });
          });
          circle.on("mouseout", () => {
            pulse.setRadius(14); pulse.setStyle({ opacity: 0.35, weight: 1.5 });
          });

          layersRef.current.push(pulse, circle);
        }
      });
    });
  }, [trips, mapReady]);

  return (
    <div className="relative w-full h-[500px] overflow-hidden">
      <div ref={mapRef} className="w-full h-full" role="img" aria-label="旅行足迹地图" />

      {/* Zoom controls */}
      <div className="absolute right-4 bottom-6 z-[1000] flex flex-col rounded-lg overflow-hidden border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="w-9 h-9 flex items-center justify-center bg-black/25 backdrop-blur-md text-white/70 hover:bg-white/15 hover:text-white transition-colors text-lg leading-none select-none"
          aria-label="放大"
        >
          +
        </button>
        <div className="h-px bg-white/10" />
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="w-9 h-9 flex items-center justify-center bg-black/25 backdrop-blur-md text-white/70 hover:bg-white/15 hover:text-white transition-colors text-lg leading-none select-none"
          aria-label="缩小"
        >
          −
        </button>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-canvas to-transparent pointer-events-none" />
    </div>
  );
}
