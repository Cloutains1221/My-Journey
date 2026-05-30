"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Trip } from "@/lib/types";
import { formatDateRange } from "@/lib/types";
import { matchCityBoundary, extractCityName } from "@/lib/city-data";
import type { FeatureCollection } from "@/lib/city-data";
import { wgs84ToGcj02 } from "@/lib/coords";

const RATING_COLORS: Record<number, string> = {
  1: "#6b7280", 2: "#94a3b8", 3: "#66bb6a", 4: "#ffa726", 5: "#ff6b6b",
};
function color(r: number) { return RATING_COLORS[r] ?? "#ff6b6b"; }

const GAODE_URL =
  "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}";
const CARTO_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Fetch trips
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("trips")
      .select("*")
      .order("date", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.warn("Failed to fetch trips:", error.message); return; }
        if (data) setTrips(data as Trip[]);
      });
    return () => { cancelled = true; };
  }, []);

  // Init map
  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      if (mapInstanceRef.current) return;

      const map = L.map(mapRef.current!, {
        center: [35, 115],
        zoom: 4,
        scrollWheelZoom: true,
        zoomControl: true,
      });

      let tileFailCount = 0;
      const gaode = L.tileLayer(GAODE_URL, {
        maxZoom: 18,
        subdomains: ["1", "2", "3", "4"],
        attribution: "高德地图",
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
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Render city polygons + markers
  useEffect(() => {
    if (!mapReady || trips.length === 0) return;

    import("leaflet").then(async (L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      layersRef.current.forEach((l) => l.remove());
      layersRef.current = [];

      let geoJSON: FeatureCollection | null = null;
      try {
        const res = await fetch("/api/city-boundaries");
        if (res.ok) geoJSON = await res.json();
      } catch { /* ignore */ }

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

        const feature = geoJSON
          ? matchCityBoundary(cityName, geoJSON)
          : null;

        if (feature) {
          const glow = L.geoJSON(feature, {
            style: () => ({
              color: c, weight: 8, opacity: 0.15,
              fillColor: "transparent", fillOpacity: 0,
            }),
          }).addTo(map);

          const main = L.geoJSON(feature, {
            style: () => ({
              color: c, weight: 2, opacity: 0.8,
              fillColor: c, fillOpacity: 0.1,
            }),
          }).addTo(map);

          const html = cityTrips.map(
            (t) =>
              `<a href="/trip/${t.slug}" style="color:#fff;text-decoration:none;display:block;margin:3px 0;font-size:12px;border-left:2px solid ${color(t.rating)};padding-left:6px;">${t.title} <span style="color:#888;font-size:10px;">${formatDateRange(t.date, t.end_date)}</span></a>`,
          ).join("");
          main.bindPopup(`
            <div style="color:#fff;background:#111;padding:10px 14px;border-radius:10px;font-family:system-ui;min-width:180px;">
              <div style="font-weight:700;font-size:14px;margin-bottom:6px;">${cityName}</div>
              ${html}
            </div>
          `);

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
          const gcj = wgs84ToGcj02(cityTrips[0].latitude, cityTrips[0].longitude);

          const circle = L.circleMarker([gcj.lat, gcj.lng], {
            radius: 10, fillColor: c, color: c,
            weight: 2, opacity: 0.9, fillOpacity: 0.5,
          }).addTo(map);

          const html = cityTrips.map(
            (t) =>
              `<a href="/trip/${t.slug}" style="color:#fff;text-decoration:none;display:block;margin:3px 0;font-size:12px;border-left:2px solid ${color(t.rating)};padding-left:6px;">${t.title} <span style="color:#888;font-size:10px;">${formatDateRange(t.date, t.end_date)}</span></a>`,
          ).join("");
          circle.bindPopup(`
            <div style="color:#fff;background:#111;padding:10px 14px;border-radius:10px;font-family:system-ui;min-width:180px;">
              <div style="font-weight:700;font-size:14px;margin-bottom:6px;">${cityTrips[0].location}</div>
              ${cityTrips[0].cover_image ? `<img src="${cityTrips[0].cover_image}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;margin-bottom:6px;" />` : ""}
              ${html}
            </div>
          `);

          layersRef.current.push(circle);
        }
      });
    });
  }, [trips, mapReady]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div ref={mapRef} className="flex-1 w-full" role="img" aria-label="旅行足迹全屏地图" />
      <div className="bg-canvas border-t border-hairline px-8 py-4 flex gap-4 overflow-x-auto">
        {trips.map((trip) => (
          <Link
            key={trip.id}
            href={`/trip/${trip.slug}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-surface-card border border-hairline-soft hover:border-hairline hover:shadow-sm flex-shrink-0 min-w-[200px] transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-surface-cream-strong flex-shrink-0 overflow-hidden">
              {trip.cover_image && (
                <img src={trip.cover_image} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{trip.title}</p>
              <p className="text-xs text-muted">{formatDateRange(trip.date, trip.end_date)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
