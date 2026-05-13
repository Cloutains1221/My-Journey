import Link from "next/link";
import type { Trip } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import RatingBadge from "./RatingBadge";

export default async function TripCard({ trip, index = 0 }: { trip: Trip; index?: number }) {
  const { count } = await supabase
    .from("photos")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", trip.id);
  const photoCount = count || 0;

  return (
    <Link href={`/trip/${trip.slug}`} className="group block relative">
      {/* Timeline dot — desktop only */}
      <div className="hidden md:flex absolute left-[22px] top-10 -translate-x-1/2 z-10">
        <div className="w-3 h-3 rounded-full bg-white/20 border-2 border-bg group-hover:bg-white/60 group-hover:scale-125 transition-all duration-300" />
      </div>

      <article className="flex gap-6 md:gap-8 p-5 md:pl-14 rounded-2xl bg-surface border border-border hover:border-white/15 hover:bg-white/[0.05] transition-all duration-300">
        <div className="w-[140px] h-[110px] md:w-[180px] md:h-[140px] rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-white/5 to-white/10">
          {trip.cover_image ? (
            <img src={trip.cover_image} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/10 text-2xl">🏔️</div>
          )}
        </div>
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs md:text-sm text-text-muted">{trip.date}</span>
              <RatingBadge rating={trip.rating} />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white mb-2 truncate group-hover:text-white/90 transition-colors">{trip.title}</h2>
            {trip.location && (
              <p className="text-xs text-text-muted/60 mb-2">📍 {trip.location}</p>
            )}
            <p className="text-xs md:text-sm text-text-secondary line-clamp-2 leading-relaxed">
              {trip.content?.replace(/[#*`>]/g, "").slice(0, 120) || "暂无文字记录"}
            </p>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <p className="text-xs text-text-muted">{photoCount} 张照片</p>
            <span className="text-xs text-white/10 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
              查看详情 →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
