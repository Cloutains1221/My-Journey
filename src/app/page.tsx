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

  const cityCount = new Set(tripList.map(t => t.city_name).filter(Boolean)).size;
  const latestDate = tripList[0]?.date || "—";

  return (
    <div>
      <HeroMap trips={tripList} />

      {/* Info section — below map */}
      <div className="bg-canvas border-b border-hairline">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-8 sm:py-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 sm:gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[4px] text-muted-soft mb-2 font-medium font-sans">
              Where I&apos;ve Been
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-normal tracking-[-0.5px] text-ink">
              Cloutains <span className="text-muted-soft font-light">的旅程</span>
            </h1>
            <p className="text-xs text-muted mt-1.5 tracking-wider font-sans">
              用脚步丈量世界
            </p>
          </div>

          <div className="flex items-end gap-5 sm:gap-7">
            <div className="flex flex-col">
              <span className="font-display text-3xl sm:text-4xl text-ink tabular-nums tracking-[-0.5px]">{tripList.length}</span>
              <span className="text-[10px] text-muted-soft mt-0.5 font-sans tracking-wide">段旅程</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-3xl sm:text-4xl text-primary tabular-nums tracking-[-0.5px]">{cityCount || "—"}</span>
              <span className="text-[10px] text-muted-soft mt-0.5 font-sans tracking-wide">座城市</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-2xl sm:text-3xl text-ink tabular-nums tracking-[-0.5px]">{latestDate || "—"}</span>
              <span className="text-[10px] text-muted-soft mt-0.5 font-sans tracking-wide">最近记录</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline section */}
      <section className="max-w-3xl mx-auto px-6 sm:px-8 py-24">
        {/* Year navigation sidebar */}
        <YearNav years={sortedYears} />

        <div className="relative">
          {/* Vertical timeline line - dashed pattern */}
          <div className="absolute left-[22px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-hairline via-hairline-soft to-transparent hidden md:block"
            style={{ backgroundImage: "repeating-linear-gradient(to bottom, var(--color-hairline-soft) 0px, var(--color-hairline-soft) 4px, transparent 4px, transparent 12px)" }}
          />

          <div className="flex flex-col gap-10">
            {sortedYears.map((year, yi) => (
              <div key={year} id={`year-${year}`} className="scroll-mt-24">
                {/* Year divider */}
                <div className="flex items-center gap-3 mb-10 md:ml-14">
                  <div className="hidden md:block w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-canvas" />
                  <span className="font-display text-3xl font-normal text-muted-soft tracking-[-1px] select-none">
                    {year}
                  </span>
                  <span className="text-[8px] text-primary/40">◆</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-hairline to-transparent" />
                </div>

                <div className="flex flex-col gap-6">
                  {yearGroups.get(year)!.map((trip, index) => (
                    <div key={trip.id} data-animate style={{ animationDelay: `${index * 0.08}s` }}>
                      <TripCard trip={trip} index={index} />
                    </div>
                  ))}
                </div>

                {yi < sortedYears.length - 1 && <div className="h-4" />}
              </div>
            ))}
          </div>
        </div>

        {tripList.length === 0 && (
          <p className="text-center text-muted py-20 text-base font-sans">
            还没有旅程记录，开始你的第一段旅程吧。
          </p>
        )}
      </section>
    </div>
  );
}
