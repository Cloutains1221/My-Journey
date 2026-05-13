import { supabase } from "@/lib/supabase";
import type { Trip, Photo, AgreementVote, DesireVote } from "@/lib/types";
import RatingBadge from "@/components/RatingBadge";
import PhotoGallery from "@/components/PhotoGallery";
import AgreementVoteComponent from "@/components/AgreementVote";
import DesireVoteComponent from "@/components/DesireVote";
import VisitorComments from "@/components/VisitorComments";
import { notFound } from "next/navigation";

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
          <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center text-white/10 text-6xl">📷</div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg to-transparent" />
      </div>

      <article className="max-w-3xl mx-auto px-8 py-10">
        <div className="flex items-center gap-4 mb-8">
          <div>
            <p className="text-sm text-text-muted mb-2">{t.date} · {t.location}</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">{t.title}</h1>
          </div>
          <RatingBadge rating={t.rating} size="lg" />
        </div>

        {t.content && (
          <div className="text-base text-text-secondary leading-relaxed space-y-4 mb-12 whitespace-pre-line">
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
