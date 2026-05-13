"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Trip } from "@/lib/types";

function getRatingColor(rating: number): string {
  const colors: Record<number, string> = { 1: "#6b7280", 2: "#94a3b8", 3: "#66bb6a", 4: "#ffa726", 5: "#ff6b6b" };
  return colors[rating] || "#ff6b6b";
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    supabase
      .from("trips")
      .select("*")
      .order("date", { ascending: false })
      .then(({ data }) => {
        if (data) setTrips(data as Trip[]);
      });
  }, []);

  useEffect(() => {
    if (!mapRef.current || trips.length === 0) return;

    import("leaflet").then((L) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current!, {
        center: [35, 115],
        zoom: 4,
        scrollWheelZoom: true,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      trips.forEach((trip) => {
        const marker = L.circleMarker([trip.latitude, trip.longitude], {
          radius: 8,
          fillColor: getRatingColor(trip.rating),
          color: getRatingColor(trip.rating),
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.5,
        }).addTo(map);

        marker.bindPopup(`
          <div style="color:#fff;background:#1a1a2e;padding:10px 14px;border-radius:10px;font-family:system-ui;min-width:160px;">
            <a href="/trip/${trip.slug}" style="color:#fff;text-decoration:none;font-weight:700;font-size:14px;display:block;margin-bottom:4px;">
              ${trip.title}
            </a>
            <div style="color:#aaa;font-size:11px;">${trip.date} · ${trip.location}</div>
            ${trip.cover_image ? `<img src="${trip.cover_image}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;margin-top:6px;" />` : ""}
          </div>
        `);
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
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div ref={mapRef} className="flex-1 w-full" role="img" aria-label="旅行足迹全屏地图" />
      <div className="bg-bg border-t border-border px-8 py-4 flex gap-4 overflow-x-auto">
        {trips.map((trip) => (
          <Link key={trip.id} href={`/trip/${trip.slug}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border hover:border-white/15 flex-shrink-0 min-w-[200px] transition-colors">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex-shrink-0 overflow-hidden">
              {trip.cover_image && <img src={trip.cover_image} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{trip.title}</p>
              <p className="text-xs text-text-muted">{trip.date}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
