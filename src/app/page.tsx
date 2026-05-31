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
      <HeroMap trips={tripList} cityCount={cityCount} latestDate={latestDate} />

      {/* Timeline section */}
      <section className="max-w-3xl mx-auto px-6 sm:px-8 py-24">
        <div className="text-center mb-16">
          <div className="w-12 h-px bg-primary/30 mx-auto mb-6" />
          <p className="text-xs uppercase tracking-[5px] text-muted-soft mb-4 font-medium font-sans">
            旅 · 程 · 时 · 间 · 线
          </p>
          <h2 className="font-display text-5xl font-normal tracking-[-0.5px] text-ink">
            走过的路，都算数
          </h2>
          <p className="text-base text-muted mt-3 leading-relaxed font-sans">
            每一段旅程都是生命中独特的印记
          </p>
          <div className="w-8 h-px bg-primary/20 mx-auto mt-6" />
        </div>

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
