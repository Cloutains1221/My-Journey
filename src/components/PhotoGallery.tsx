"use client";

import { useState } from "react";
import type { Photo } from "@/lib/types";

export default function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (photos.length === 0) return null;

  return (
    <div>
      <p className="text-xs uppercase tracking-[3px] text-text-muted mb-5">
        旅途影像 · {photos.length} Photos
      </p>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setLightbox(photo.url)}
            className="aspect-square rounded-lg overflow-hidden bg-white/5 hover:ring-2 hover:ring-white/20 transition-all"
          >
            <img
              src={photo.url}
              alt={photo.caption || ""}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </button>
        ))}
      </div>
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" />
          <button className="absolute top-6 right-6 text-white/60 hover:text-white text-2xl" aria-label="关闭">✕</button>
        </div>
      )}
    </div>
  );
}
