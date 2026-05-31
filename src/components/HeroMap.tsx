"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type L from "leaflet";
import type { Trip } from "@/lib/types";
import { formatDateRange } from "@/lib/types";
import { matchCityBoundary, extractCityName } from "@/lib/city-data";
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

export default function HeroMap({ trips }: { trips: Trip[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // --- Init map ---
  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [35, 115],
        zoom: 4,
        scrollWheelZoom: false,
        dragging: true,
        zoomControl: false,
        attributionControl: false,
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

    import("leaflet").then(async (L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Clear previous
      layersRef.current.forEach((l) => l.remove());
      layersRef.current = [];

      // Load city boundary GeoJSON (static + dynamic from Supabase)
      let geoJSON: FeatureCollection | null = null;
      try {
        const res = await fetch("/api/city-boundaries");
        if (res.ok) geoJSON = await res.json();
      } catch { /* ignore */ }

      // Group trips by city name (prefer explicit city_name, fall back to parsing location)
      const cityMap = new Map<string, Trip[]>();
      trips.forEach((t) => {
        const c = t.city_name || extractCityName(t.location);
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
          // Fallback marker — convert WGS-84 to GCJ-02 for Gaode alignment
          const gcj = wgs84ToGcj02(cityTrips[0].latitude, cityTrips[0].longitude);

          const circle = L.circleMarker([gcj.lat, gcj.lng], {
            radius: 9, fillColor: c, color: c,
            weight: 2, opacity: 0.9, fillOpacity: 0.4,
          }).addTo(map);

          const pulse = L.circleMarker([gcj.lat, gcj.lng], {
            radius: 18, fillColor: "transparent", color: c,
            weight: 1.5, opacity: 0.35, fillOpacity: 0,
          }).addTo(map);

          const html = cityTrips.map(
            (t) =>
              `<div style="margin:3px 0;font-size:12px;border-left:2px solid ${color(t.rating)};padding-left:6px;">${t.title} <span style="color:#888;font-size:10px;">${formatDateRange(t.date, t.end_date)}</span></div>`,
          ).join("");
          circle.bindPopup(`
            <div style="color:#fff;background:#111;padding:10px 14px;border-radius:10px;font-family:system-ui;min-width:160px;">
              <div style="font-weight:700;font-size:14px;margin-bottom:6px;">${cityTrips[0].location}</div>
              ${html}
            </div>
          `);

          circle.on("mouseover", () => {
            pulse.setRadius(28); pulse.setStyle({ opacity: 0.65 });
          });
          circle.on("mouseout", () => {
            pulse.setRadius(18); pulse.setStyle({ opacity: 0.35 });
          });

          layersRef.current.push(circle, pulse);
        }
      });
    });
  }, [trips, mapReady]);

  return (
    <div className="relative w-full h-[500px] overflow-hidden">
      <div ref={mapRef} className="w-full h-full" role="img" aria-label="旅行足迹地图" />

      {/* Coral glow overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(204,120,92,0.05)_0%,transparent_70%)] pointer-events-none" />

      {/* Bottom gradient - deeper */}
      <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-canvas via-canvas/80 via-40% to-transparent pointer-events-none" />

      {/* Title overlay */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center z-[1000] pointer-events-none">
        <p data-animate className="text-xs uppercase tracking-[4px] text-on-dark/50 mb-3" style={{ animationDelay: "0.2s" }}>
          Where I&apos;ve Been
        </p>
        <h1 data-animate className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-[-0.5px] text-on-dark drop-shadow-[0_2px_40px_rgba(0,0,0,0.8)]" style={{ animationDelay: "0.4s" }}>
          Cloutains <span className="text-on-dark/60 font-light">的旅程</span>
        </h1>
        <div data-animate className="flex items-center gap-3 mt-3 justify-center" style={{ animationDelay: "0.6s" }}>
          <span className="text-sm text-on-dark/60">{trips.length} 段旅程</span>
          <span className="w-1 h-1 rounded-full bg-on-dark/30" />
          <span className="text-sm text-on-dark/60">用脚步丈量世界</span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 animate-bounce pointer-events-none">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-on-dark/30">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}
