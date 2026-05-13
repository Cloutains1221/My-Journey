"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Trip } from "@/lib/types";

function getRatingColor(rating: number): string {
  const colors: Record<number, string> = {
    1: "#6b7280",
    2: "#94a3b8",
    3: "#66bb6a",
    4: "#ffa726",
    5: "#ff6b6b",
  };
  return colors[rating] || "#ff6b6b";
}

export default function HeroMap({ trips }: { trips: Trip[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let L: any;
    import("leaflet").then((leaflet) => {
      L = leaflet.default;
      // Fix Leaflet default icon paths in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [35, 115],
        zoom: 4,
        scrollWheelZoom: false,
        dragging: true,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      trips.forEach((trip) => {
        const circle = L.circleMarker([trip.latitude, trip.longitude], {
          radius: 6,
          fillColor: getRatingColor(trip.rating),
          color: getRatingColor(trip.rating),
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.4,
        }).addTo(map);

        const pulse = L.circleMarker([trip.latitude, trip.longitude], {
          radius: 14,
          fillColor: "transparent",
          color: getRatingColor(trip.rating),
          weight: 1,
          opacity: 0.3,
          fillOpacity: 0,
        }).addTo(map);

        circle.bindPopup(`
          <div style="color:#fff;background:#1a1a2e;padding:8px 12px;border-radius:8px;font-family:system-ui;">
            <div style="font-weight:700;font-size:13px;">${trip.title}</div>
            <div style="color:#aaa;font-size:11px;">${trip.date}</div>
          </div>
        `);

        circle.on("mouseover", () => {
          pulse.setRadius(22);
          pulse.setStyle({ opacity: 0.6 });
        });
        circle.on("mouseout", () => {
          pulse.setRadius(14);
          pulse.setStyle({ opacity: 0.3 });
        });
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [trips]);

  return (
    <div className="relative w-full h-[500px] overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center z-[1000] pointer-events-none">
        <h1 className="text-3xl font-bold text-white drop-shadow-[0_0_40px_rgba(0,0,0,0.8)]">
          探索人生的版图
        </h1>
        <p className="text-sm text-white/50 mt-2">
          {trips.length} 段旅程 · 无数回忆
        </p>
      </div>
    </div>
  );
}
