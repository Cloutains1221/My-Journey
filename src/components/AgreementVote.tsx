"use client";

import { useState } from "react";
import { AGREEMENT_LABELS } from "@/lib/types";

const AGREEMENT_COLORS: Record<number, string> = {
  1: "bg-green-900/20 border-green-800/40 text-green-400",
  2: "bg-green-900/10 border-green-800/20 text-green-300",
  3: "bg-white/5 border-white/10 text-white/50",
  4: "bg-orange-900/10 border-orange-800/20 text-orange-300",
  5: "bg-red-900/20 border-red-800/40 text-red-400",
};

const AGREEMENT_ACTIVE_COLORS: Record<number, string> = {
  1: "bg-green-900/40 border-green-500/60 text-green-300",
  2: "bg-green-900/25 border-green-400/40 text-green-200",
  3: "bg-white/15 border-white/30 text-white/70",
  4: "bg-orange-900/25 border-orange-400/40 text-orange-200",
  5: "bg-red-900/40 border-red-500/60 text-red-300",
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
    return <p className="text-sm text-green-400 py-4">✅ 你的评价已提交，感谢反馈！</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="py-8 border-t border-border">
      <h3 className="text-lg font-bold text-white mb-1">你认同博主的这个评级吗？</h3>
      <p className="text-sm text-text-muted mb-5">选择你的认可度</p>
      <div className="flex gap-2 mb-4 flex-wrap">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setAgreement(v)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all cursor-pointer ${AGREEMENT_COLORS[v]} ${agreement === v ? AGREEMENT_ACTIVE_COLORS[v] : ""}`}
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
          className="w-40 bg-white/5 border border-border rounded-full px-4 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/20"
        />
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="说点什么吧（可选）"
          maxLength={200}
          className="flex-1 bg-white/5 border border-border rounded-full px-4 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/20"
        />
        <button
          type="submit"
          disabled={!agreement || !nickname.trim() || submitting}
          className="px-6 py-2 bg-white text-bg rounded-full text-sm font-semibold disabled:opacity-30 hover:bg-gray-200 transition-colors"
        >
          {submitting ? "提交中..." : "提交"}
        </button>
      </div>
    </form>
  );
}
