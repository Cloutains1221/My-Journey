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
          {(trips as Trip[])?.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </section>
    </div>
  );
}
