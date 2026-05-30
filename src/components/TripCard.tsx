import Link from "next/link";
import type { Trip } from "@/lib/types";
import { formatDateRange } from "@/lib/types";
import { supabase } from "@/lib/supabase";

export default async function TripCard({ trip, index = 0 }: { trip: Trip; index?: number }) {
  const { count } = await supabase
    .from("photos")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", trip.id);
  const photoCount = count || 0;

  return (
    <Link href={`/trip/${trip.slug}`} className="group block relative">
      {/* Timeline dot — desktop only */}
      <div className="hidden md:flex absolute left-[22px] top-9 -translate-x-1/2 z-10">
        <div className="w-2.5 h-2.5 rounded-full bg-hairline border-2 border-canvas group-hover:bg-primary group-hover:scale-125 transition-all duration-300" />
      </div>

      <article className="flex gap-5 md:gap-7 p-5 md:pl-14 rounded-xl bg-surface-card border border-hairline-soft hover:border-hairline hover:shadow-sm transition-all duration-300">
        <div className="w-[130px] h-[100px] md:w-[170px] md:h-[130px] rounded-lg overflow-hidden flex-shrink-0 bg-surface-cream-strong">
          {trip.cover_image ? (
            <img src={trip.cover_image} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-surface-cream-strong text-2xl">🏔️</div>
          )}
        </div>
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-xs text-muted">{formatDateRange(trip.date, trip.end_date)}</span>
              <RatingBadge rating={trip.rating} />
            </div>
            <h3 className="text-lg font-semibold text-ink mb-1.5 truncate group-hover:text-primary transition-colors font-sans">
              {trip.title}
            </h3>
            {trip.location && (
              <p className="text-xs text-muted-soft mb-1.5">📍 {trip.location}</p>
            )}
            <p className="text-sm text-body leading-relaxed line-clamp-2">
              {trip.content?.replace(/[#*`>]/g, "").slice(0, 120) || "暂无文字记录"}
            </p>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <p className="text-xs text-muted-soft">{photoCount} 张照片</p>
            <span className="text-xs text-primary/0 group-hover:text-primary transition-all ml-auto font-medium">
              查看详情 →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

/** Inline rating badge matching the warm palette */
function RatingBadge({ rating }: { rating: number }) {
  const labels: Record<number, string> = { 1: "拉完了", 2: "npc", 3: "人上人", 4: "顶级", 5: "夯" };
  const colors: Record<number, string> = {
    1: "bg-hairline text-muted",
    2: "bg-hairline text-muted",
    3: "bg-accent-teal/15 text-accent-teal",
    4: "bg-accent-amber/15 text-accent-amber",
    5: "bg-primary/15 text-primary",
  };
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${colors[rating] ?? colors[5]}`}>
      {labels[rating] ?? "?"}
    </span>
  );
}
