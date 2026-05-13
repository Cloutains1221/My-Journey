import { supabase } from "@/lib/supabase";
import HeroMap from "@/components/HeroMap";
import type { Trip } from "@/lib/types";

export const revalidate = 3600;

export default async function HomePage() {
  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .order("date", { ascending: false });

  return (
    <div>
      <HeroMap trips={(trips as Trip[]) || []} />
      <section className="max-w-3xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[3px] text-text-muted">
            旅 · 程 · 时 · 间 · 线
          </p>
        </div>
        <div className="flex flex-col gap-12">
          {/* TripCard will be added in Task 5 */}
          {(trips as Trip[])?.map((trip) => (
            <div key={trip.id} className="p-6 rounded-2xl bg-surface border border-border">
              <p className="text-white font-bold">{trip.title}</p>
              <p className="text-text-muted text-sm">{trip.date} · {trip.location}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
