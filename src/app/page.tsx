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
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-teal">
          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      value: tripList.length,
      unit: "段旅程",
      label: "足迹遍布",
      accent: "from-accent-teal via-accent-teal/50 to-accent-teal",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-amber">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
      value: cityCount || "—",
      unit: cityCount ? "座城市" : "",
      label: "到访地点",
      accent: "from-accent-amber via-accent-amber/50 to-accent-amber",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      value: latestDate,
      unit: "",
      label: "最近记录",
      accent: "from-primary via-primary/50 to-primary",
    },
  ];

  return (
    <div>
      <HeroMap trips={tripList} />

      {/* Stats bar */}
      <div className="max-w-2xl mx-auto px-6 sm:px-8 -mt-6 relative z-10">
        <div className="flex flex-col sm:flex-row gap-3">
          {stats.map(({ icon, value, unit, label, accent }, i) => (
            <div
              key={label}
              data-animate
              style={{ animationDelay: `${i * 0.1}s` }}
              className="relative flex-1 rounded-xl bg-canvas border border-hairline shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 pattern-dots overflow-hidden"
            >
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accent} opacity-80`} />
              <div className="flex flex-col items-center py-5 sm:py-6 px-3">
                <span className="mb-3">{icon}</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="font-display text-4xl font-normal text-ink tracking-tight tabular-nums">{value}</span>
                  {unit && <span className="text-xs text-muted font-sans font-medium">{unit}</span>}
                </div>
                <p className="text-[11px] text-muted-soft mt-2 tracking-wider font-sans">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

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
