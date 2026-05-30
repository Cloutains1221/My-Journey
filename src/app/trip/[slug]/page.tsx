import { supabase } from "@/lib/supabase";
import type { Trip, Photo, AgreementVote, DesireVote } from "@/lib/types";
import { formatDateRange } from "@/lib/types";
import PhotoGallery from "@/components/PhotoGallery";
import AgreementVoteComponent from "@/components/AgreementVote";
import DesireVoteComponent from "@/components/DesireVote";
import VisitorComments from "@/components/VisitorComments";
import { notFound } from "next/navigation";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const { data: trips } = await supabase.from("trips").select("slug");
  return (trips || []).map((t: any) => ({ slug: t.slug }));
}

export default async function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: trip } = await supabase
    .from("trips")
    .select("*, photos(*), agreement_votes(*), desire_votes(*)")
    .eq("slug", slug)
    .single();

  if (!trip) notFound();

  const t = trip as Trip & { photos: Photo[]; agreement_votes: AgreementVote[]; desire_votes: DesireVote[] };

  return (
    <div>
      <div className="relative w-full h-[420px] overflow-hidden">
        {t.cover_image ? (
          <img src={t.cover_image} alt={t.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-surface-cream-strong flex items-center justify-center text-surface-cream-strong text-6xl">📷</div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-canvas to-transparent" />
      </div>

      <article className="max-w-3xl mx-auto px-8 py-10">
        <div className="flex items-center gap-4 mb-8">
          <div>
            <p className="text-sm text-muted mb-2">{formatDateRange(t.date, t.end_date)} · {t.location}</p>
            <h1 className="font-display text-4xl font-normal tracking-[-0.5px] text-ink">
              {t.title}
            </h1>
          </div>
          <RatingBadge rating={t.rating} />
        </div>

        {t.content && (
          <div className="text-base text-body leading-relaxed space-y-4 mb-12 whitespace-pre-line">
            {t.content}
          </div>
        )}

        <PhotoGallery photos={t.photos || []} />

        <AgreementVoteComponent tripId={t.id} />
        <DesireVoteComponent tripId={t.id} />
        <VisitorComments agreementVotes={t.agreement_votes || []} desireVotes={t.desire_votes || []} />
      </article>
    </div>
  );
}

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
    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${colors[rating] ?? colors[5]}`}>
      {labels[rating] ?? "?"}
    </span>
  );
}
