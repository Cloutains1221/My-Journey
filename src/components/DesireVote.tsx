"use client";

import { useState } from "react";
import { DESIRE_LABELS } from "@/lib/types";

const COLORS: Record<number, string> = {
  1: "bg-primary/10 border-primary/30 text-primary",
  2: "bg-accent-amber/5 border-accent-amber/20 text-accent-amber",
  3: "bg-surface-card border-hairline text-muted",
  4: "bg-surface-card border-hairline text-muted",
  5: "bg-surface-soft border-hairline-soft text-muted-soft",
};

const ACTIVE: Record<number, string> = {
  1: "bg-primary/20 border-primary/60 text-primary ring-1 ring-primary/30",
  2: "bg-accent-amber/15 border-accent-amber/40 text-accent-amber",
  3: "bg-surface-cream-strong border-hairline text-ink ring-1 ring-hairline",
  4: "bg-surface-cream-strong border-hairline text-ink ring-1 ring-hairline",
  5: "bg-hairline border-hairline text-muted-soft",
};

export default function DesireVote({ tripId }: { tripId: string }) {
  const [desire, setDesire] = useState<number | null>(null);
  const [nickname, setNickname] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!desire || !nickname.trim()) return;
    setSubmitting(true);
    await fetch("/api/votes/desire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId, desireLevel: desire, nickname: nickname.trim(), comment: comment.trim() || null }),
    });
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return <p className="text-sm text-accent-teal font-medium py-4">✅ 你的想法已记录，感谢分享！</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="py-8 border-t border-hairline">
      <h3 className="text-lg font-semibold text-ink mb-1 font-sans">看完之后，你有多想去这里？</h3>
      <p className="text-sm text-muted mb-5">选择你的心动指数</p>
      <div className="flex gap-2 mb-4 flex-wrap">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setDesire(v)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer ${COLORS[v]} ${desire === v ? ACTIVE[v] : ""}`}
          >
            {DESIRE_LABELS[v]}
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
          placeholder="说说为什么（可选）"
          maxLength={200}
          className="flex-1 bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink placeholder:text-muted-soft outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        <button
          type="submit"
          disabled={!desire || !nickname.trim() || submitting}
          className="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-medium disabled:opacity-30 hover:bg-primary-active transition-colors"
        >
          {submitting ? "提交中..." : "提交"}
        </button>
      </div>
    </form>
  );
}
