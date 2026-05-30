"use client";

import { useState } from "react";
import { AGREEMENT_LABELS } from "@/lib/types";

const COLORS: Record<number, string> = {
  1: "bg-accent-teal/10 border-accent-teal/30 text-accent-teal",
  2: "bg-accent-teal/5 border-accent-teal/15 text-accent-teal/80",
  3: "bg-surface-card border-hairline text-muted",
  4: "bg-accent-amber/5 border-accent-amber/20 text-accent-amber",
  5: "bg-primary/10 border-primary/30 text-primary",
};

const ACTIVE: Record<number, string> = {
  1: "bg-accent-teal/20 border-accent-teal/60 text-accent-teal ring-1 ring-accent-teal/30",
  2: "bg-accent-teal/15 border-accent-teal/40 text-accent-teal/90",
  3: "bg-surface-cream-strong border-hairline text-ink ring-1 ring-hairline",
  4: "bg-accent-amber/15 border-accent-amber/40 text-accent-amber",
  5: "bg-primary/20 border-primary/60 text-primary ring-1 ring-primary/30",
};

export default function AgreementVote({ tripId }: { tripId: string }) {
  const [agreement, setAgreement] = useState<number | null>(null);
  const [nickname, setNickname] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreement || !nickname.trim()) return;
    setSubmitting(true);
    await fetch("/api/votes/agreement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId, agreement, nickname: nickname.trim(), comment: comment.trim() || null }),
    });
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return <p className="text-sm text-accent-teal font-medium py-4">✅ 你的评价已提交，感谢反馈！</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="py-8 border-t border-hairline">
      <h3 className="text-lg font-semibold text-ink mb-1 font-sans">你认同博主的这个评级吗？</h3>
      <p className="text-sm text-muted mb-5">选择你的认可度</p>
      <div className="flex gap-2 mb-4 flex-wrap">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setAgreement(v)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer ${COLORS[v]} ${agreement === v ? ACTIVE[v] : ""}`}
          >
            {AGREEMENT_LABELS[v]}
          </button>
        ))}
      </div>
      <div className="flex gap-3 items-center">
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="你的昵称"
          maxLength={20}
          className="w-40 bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink placeholder:text-muted-soft outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="说点什么吧（可选）"
          maxLength={200}
          className="flex-1 bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink placeholder:text-muted-soft outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        <button
          type="submit"
          disabled={!agreement || !nickname.trim() || submitting}
          className="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-medium disabled:opacity-30 hover:bg-primary-active transition-colors"
        >
          {submitting ? "提交中..." : "提交"}
        </button>
      </div>
    </form>
  );
}
