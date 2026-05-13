"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type L from "leaflet";
import type { Trip } from "@/lib/types";

function getRatingColor(rating: number): string {
  const colors: Record<number, string> = {
    1: "#6b7280", 2: "#94a3b8", 3: "#66bb6a", 4: "#ffa726", 5: "#ff6b6b",
  };
  return colors[rating] || "#ff6b6b";
}

export default function HeroMap({ trips }: { trips: Trip[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [35, 115], zoom: 4,
        scrollWheelZoom: false, dragging: true,
        zoomControl: false, attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    });

    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null; };
  }, []);

  // Update markers when trips change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Dynamic import to get L
    import("leaflet").then((L) => {
      // Clear old markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      // Fix icon paths
      if (L.Icon.Default.prototype) {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
      }

      trips.forEach((trip) => {
        const color = getRatingColor(trip.rating);
        const circle = L.circleMarker([trip.latitude, trip.longitude], {
          radius: 6, fillColor: color, color: color,
          weight: 2, opacity: 0.8, fillOpacity: 0.4,
        }).addTo(map);

        const pulse = L.circleMarker([trip.latitude, trip.longitude], {
          radius: 14, fillColor: "transparent", color: color,
          weight: 1, opacity: 0.3, fillOpacity: 0,
        }).addTo(map);

        circle.bindPopup(`
          <div style="color:#fff;background:#1a1a2e;padding:8px 12px;border-radius:8px;font-family:system-ui;">
            <div style="font-weight:700;font-size:13px;">${trip.title}</div>
            <div style="color:#aaa;font-size:11px;">${trip.date}</div>
          </div>
        `);

        circle.on("mouseover", () => { pulse.setRadius(22); pulse.setStyle({ opacity: 0.6 }); });
        circle.on("mouseout", () => { pulse.setRadius(14); pulse.setStyle({ opacity: 0.3 }); });

        markersRef.current.push(circle, pulse);
      });
    });
  }, [trips]);

  return (
    <div className="relative w-full h-[500px] overflow-hidden">
      <div ref={mapRef} className="w-full h-full" role="img" aria-label="旅行足迹地图" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-bg via-bg/60 to-transparent pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center z-[1000] pointer-events-none">
        <p className="text-xs uppercase tracking-[4px] text-white/30 mb-3">Where I&apos;ve Been</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_0_60px_rgba(0,0,0,0.9)]">
          Cloutains 的旅程
        </h1>
        <div className="flex items-center gap-3 mt-3 justify-center">
          <span className="text-sm text-white/40">{trips.length} 段旅程</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="text-sm text-white/40">用脚步丈量世界</span>
        </div>
      </div>
    </div>
  );
}
