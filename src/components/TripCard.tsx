import Link from "next/link";
import type { Trip } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import RatingBadge from "./RatingBadge";

export default async function TripCard({ trip }: { trip: Trip }) {
  const { count } = await supabase
    .from("photos")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", trip.id);
  const photoCount = count || 0;

  return (
    <Link href={`/trip/${trip.slug}`} className="group block">
      <article className="flex gap-8 p-6 rounded-2xl bg-surface border border-border hover:border-white/15 hover:bg-white/[0.05] transition-all duration-300">
        <div className="w-[180px] h-[140px] rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-white/5 to-white/10">
          {trip.cover_image ? (
            <img src={trip.cover_image} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/10 text-2xl">📷</div>
          )}
        </div>
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-text-muted">{trip.date}</span>
              <RatingBadge rating={trip.rating} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 truncate">{trip.title}</h2>
            <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
              {trip.content?.replace(/[#*`>]/g, "").slice(0, 120) || "暂无文字记录"}
            </p>
          </div>
          <p className="text-xs text-text-muted">{photoCount} 张照片</p>
        </div>
      </article>
    </Link>
  );
}
