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

export default function HeroMap({ trips, cityCount, latestDate }: { trips: Trip[]; cityCount?: number; latestDate?: string }) {
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

      {/* Frosted glass card — bottom-left */}
      <div className="absolute bottom-10 left-6 sm:left-10 z-[1000] max-w-md">
        <div className="rounded-2xl bg-black/25 backdrop-blur-xl border border-white/10 px-6 py-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <p className="text-[11px] uppercase tracking-[4px] text-white/50 mb-2 font-sans">
            Where I&apos;ve Been
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-normal tracking-[-0.5px] text-white">
            Cloutains <span className="text-white/50 font-light">的旅程</span>
          </h1>
          <p className="text-xs text-white/40 mt-2 tracking-wider font-sans">
            用脚步丈量世界
          </p>

          {/* Stats row */}
          <div className="flex items-end gap-5 mt-5 pt-5 border-t border-white/10">
            <div className="flex flex-col">
              <span className="font-display text-3xl text-white tabular-nums tracking-[-0.5px]">{trips.length}</span>
              <span className="text-[10px] text-white/40 mt-0.5 font-sans tracking-wide">段旅程</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-3xl text-primary tabular-nums tracking-[-0.5px]">{cityCount || "—"}</span>
              <span className="text-[10px] text-white/40 mt-0.5 font-sans tracking-wide">座城市</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-2xl text-white tabular-nums tracking-[-0.5px]">{latestDate || "—"}</span>
              <span className="text-[10px] text-white/40 mt-0.5 font-sans tracking-wide">最近记录</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient — lighter, no need to hide title */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-canvas/80 to-transparent pointer-events-none" />

      {/* Scroll indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 animate-bounce pointer-events-none z-[1000]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}
