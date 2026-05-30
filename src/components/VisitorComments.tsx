import type { AgreementVote, DesireVote } from "@/lib/types";
import { AGREEMENT_LABELS, DESIRE_LABELS } from "@/lib/types";

export default function VisitorComments({
  agreementVotes,
  desireVotes,
}: {
  agreementVotes: AgreementVote[];
  desireVotes: DesireVote[];
}) {
  if (agreementVotes.length === 0 && desireVotes.length === 0) {
    return (
      <div className="py-8 border-t border-hairline">
        <p className="text-xs uppercase tracking-[3px] text-muted-soft mb-6 font-medium">访客回声</p>
        <p className="text-sm text-muted">还没有人留下评价，来做第一个吧</p>
      </div>
    );
  }

  const all: { nickname: string; label: string; comment: string | null; time: string; type: "agreement" | "desire" }[] = [];
  agreementVotes.forEach((v) =>
    all.push({ nickname: v.nickname, label: AGREEMENT_LABELS[v.agreement], comment: v.comment, time: v.created_at, type: "agreement" })
  );
  desireVotes.forEach((v) =>
    all.push({ nickname: v.nickname, label: DESIRE_LABELS[v.desire_level], comment: v.comment, time: v.created_at, type: "desire" })
  );
  all.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="py-8 border-t border-hairline">
      <p className="text-xs uppercase tracking-[3px] text-muted-soft mb-6 font-medium">访客回声</p>
      <div className="flex flex-col gap-4">
        {all.map((item, i) => (
          <div key={i} className="p-5 rounded-xl bg-surface-card border border-hairline-soft">
            <div className="flex justify-between items-center mb-2">
              <span className="text-ink/80 font-semibold text-sm">{item.nickname}</span>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                item.type === "agreement"
                  ? "bg-accent-teal/10 border-accent-teal/30 text-accent-teal"
                  : "bg-primary/10 border-primary/30 text-primary"
              }`}>
                {item.type === "agreement" ? "✓ " : "🔥 "}{item.label}
              </span>
            </div>
            {item.comment && <p className="text-sm text-body leading-relaxed">{item.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
