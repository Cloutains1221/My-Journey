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
      <div className="py-8 border-t border-border">
        <p className="text-xs uppercase tracking-[3px] text-text-muted mb-6">访客回声</p>
        <p className="text-sm text-text-muted">还没有人留下评价，来做第一个吧</p>
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
    <div className="py-8 border-t border-border">
      <p className="text-xs uppercase tracking-[3px] text-text-muted mb-6">访客回声</p>
      <div className="flex flex-col gap-5">
        {all.map((item, i) => (
          <div key={i} className="p-5 rounded-xl bg-surface border border-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/70 font-semibold text-sm">{item.nickname}</span>
              <span className={`text-xs px-2.5 py-1 rounded-lg border ${
                item.type === "agreement"
                  ? "bg-green-900/10 border-green-800/30 text-green-400"
                  : "bg-red-900/10 border-red-800/30 text-red-400"
              }`}>
                {item.type === "agreement" ? "✓ " : "🔥 "}{item.label}
              </span>
            </div>
            {item.comment && <p className="text-sm text-text-secondary leading-relaxed">{item.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
