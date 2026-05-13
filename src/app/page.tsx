import { supabase } from "@/lib/supabase";
import HeroMap from "@/components/HeroMap";
import TripCard from "@/components/TripCard";
import type { Trip } from "@/lib/types";

export const revalidate = 3600;

export default async function HomePage() {
  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .order("date", { ascending: false });

  const tripList = (trips as Trip[]) || [];
  const cityCount = new Set(tripList.map(t => t.location).filter(Boolean)).size;
  const latestDate = tripList[0]?.date || "—";

  const stats = [
    { icon: "🗺️", value: tripList.length, unit: "段旅程", label: "足迹遍布", accent: "from-emerald-400 via-emerald-500/50 to-emerald-400", glow: "shadow-emerald-500/10" },
    { icon: "📍", value: cityCount || "—", unit: cityCount ? "座城市" : "", label: "到访地点", accent: "from-amber-400 via-amber-500/50 to-amber-400", glow: "shadow-amber-500/10" },
    { icon: "📅", value: latestDate, unit: "", label: "最近记录", accent: "from-sky-400 via-sky-500/50 to-sky-400", glow: "shadow-sky-500/10" },
  ];

  return (
    <div>
      <HeroMap trips={tripList} />

      {/* Stats bar */}
      <div className="max-w-2xl mx-auto px-8 -mt-6 relative z-10">
        <div className="flex gap-3">
          {stats.map(({ icon, value, unit, label, accent, glow }) => (
            <div
              key={label}
              className={`flex-1 relative rounded-2xl bg-surface/80 border border-white/[0.07] backdrop-blur-md overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.25)] ${glow} hover:-translate-y-0.5 hover:border-white/[0.12] transition-all duration-300`}
            >
              <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${accent}`} />
              <div className="flex flex-col items-center py-6 px-3">
                <span className="text-2xl mb-3 opacity-80">{icon}</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-3xl font-extrabold text-white tracking-tight tabular-nums">{value}</span>
                  {unit && <span className="text-xs text-text-muted font-medium">{unit}</span>}
                </div>
                <p className="text-[11px] text-text-muted/60 mt-2 tracking-wider">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline section */}
      <section className="max-w-3xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[5px] text-text-muted mb-4">
            旅 · 程 · 时 · 间 · 线
          </p>
          <h2 className="text-2xl font-bold text-white">
            走过的路，都算数
          </h2>
          <p className="text-sm text-text-muted mt-2">
            每一段旅程都是生命中独特的印记
          </p>
        </div>

        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[22px] top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent hidden md:block" />

          <div className="flex flex-col gap-10">
            {tripList.map((trip, index) => (
              <TripCard key={trip.id} trip={trip} index={index} />
            ))}
          </div>
        </div>

        {tripList.length === 0 && (
          <p className="text-center text-text-muted py-20 text-sm">
            还没有旅程记录，开始你的第一段旅程吧。
          </p>
        )}
      </section>
    </div>
  );
}
