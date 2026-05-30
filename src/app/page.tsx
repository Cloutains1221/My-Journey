import { supabase } from "@/lib/supabase";
import HeroMap from "@/components/HeroMap";
import TripCard from "@/components/TripCard";
import YearNav from "@/components/YearNav";
import type { Trip } from "@/lib/types";

export const revalidate = 3600;

export default async function HomePage() {
  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .order("date", { ascending: false });

  const tripList = (trips as Trip[]) || [];

  // Group trips by year for timeline
  const yearGroups = new Map<number, Trip[]>();
  for (const trip of tripList) {
    const y = Number(trip.date.slice(0, 4));
    const list = yearGroups.get(y);
    if (list) list.push(trip);
    else yearGroups.set(y, [trip]);
  }
  const sortedYears = Array.from(yearGroups.keys()).sort((a, b) => b - a);

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
              className="flex-1 relative rounded-xl bg-canvas border border-hairline shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
            >
              <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${accent}`} />
              <div className="flex flex-col items-center py-6 px-3">
                <span className="text-2xl mb-3">{icon}</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-3xl font-bold text-ink tracking-tight tabular-nums font-sans">{value}</span>
                  {unit && <span className="text-xs text-muted font-medium">{unit}</span>}
                </div>
                <p className="text-[11px] text-muted-soft mt-2 tracking-wider">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline section */}
      <section className="max-w-3xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[5px] text-muted-soft mb-4 font-medium">
            旅 · 程 · 时 · 间 · 线
          </p>
          <h2 className="font-display text-5xl font-normal tracking-[-0.5px] text-ink">
            走过的路，都算数
          </h2>
          <p className="text-base text-muted mt-3 leading-relaxed">
            每一段旅程都是生命中独特的印记
          </p>
        </div>

        {/* Year navigation sidebar */}
        <YearNav years={sortedYears} />

        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[22px] top-0 bottom-0 w-px bg-gradient-to-b from-hairline via-hairline-soft to-transparent hidden md:block" />

          <div className="flex flex-col gap-10">
            {sortedYears.map((year, yi) => (
              <div key={year} id={`year-${year}`} className="scroll-mt-24">
                {/* Year divider */}
                <div className="flex items-center gap-5 mb-10 md:ml-14">
                  <div className="hidden md:block w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-canvas" />
                  <span className="font-display text-5xl font-normal text-hairline tracking-[-1px] select-none">
                    {year}
                  </span>
                  <div className="flex-1 h-px bg-hairline" />
                </div>

                <div className="flex flex-col gap-6">
                  {yearGroups.get(year)!.map((trip, index) => (
                    <TripCard key={trip.id} trip={trip} index={index} />
                  ))}
                </div>

                {yi < sortedYears.length - 1 && <div className="h-4" />}
              </div>
            ))}
          </div>
        </div>

        {tripList.length === 0 && (
          <p className="text-center text-muted py-20 text-base">
            还没有旅程记录，开始你的第一段旅程吧。
          </p>
        )}
      </section>
    </div>
  );
}
