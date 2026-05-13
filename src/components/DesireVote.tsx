"use client";

import { useState } from "react";
import { DESIRE_LABELS } from "@/lib/types";

const DESIRE_COLORS: Record<number, string> = {
  1: "bg-red-900/20 border-red-800/40 text-red-400",
  2: "bg-orange-900/10 border-orange-800/20 text-orange-300",
  3: "bg-white/5 border-white/10 text-white/50",
  4: "bg-white/5 border-white/10 text-white/50",
  5: "bg-gray-800/30 border-gray-700/40 text-gray-500",
};

const DESIRE_ACTIVE_COLORS: Record<number, string> = {
  1: "bg-red-900/40 border-red-500/60 text-red-300",
  2: "bg-orange-900/25 border-orange-400/40 text-orange-200",
  3: "bg-white/15 border-white/30 text-white/70",
  4: "bg-white/10 border-white/20 text-white/60",
  5: "bg-gray-700/40 border-gray-600/60 text-gray-400",
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
    return <p className="text-sm text-green-400 py-4">✅ 你的想法已记录，感谢分享！</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="py-8 border-t border-border">
      <h3 className="text-lg font-bold text-white mb-1">看完之后，你有多想去这里？</h3>
      <p className="text-sm text-text-muted mb-5">选择你的心动指数</p>
      <div className="flex gap-2 mb-4 flex-wrap">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setDesire(v)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all cursor-pointer ${DESIRE_COLORS[v]} ${desire === v ? DESIRE_ACTIVE_COLORS[v] : ""}`}
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
          className="w-40 bg-white/5 border border-border rounded-full px-4 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/20"
        />
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="说说为什么（可选）"
          maxLength={200}
          className="flex-1 bg-white/5 border border-border rounded-full px-4 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/20"
        />
        <button
          type="submit"
          disabled={!desire || !nickname.trim() || submitting}
          className="px-6 py-2 bg-white text-bg rounded-full text-sm font-semibold disabled:opacity-30 hover:bg-gray-200 transition-colors"
        >
          {submitting ? "提交中..." : "提交"}
        </button>
      </div>
    </form>
  );
}
