import { RATING_LABELS } from "@/lib/types";

const RATING_STYLES: Record<number, string> = {
  1: "bg-gray-700/50 text-gray-400 border-gray-700",
  2: "bg-slate-700/50 text-slate-400 border-slate-700",
  3: "bg-green-900/30 text-green-400 border-green-800",
  4: "bg-orange-900/30 text-orange-400 border-orange-800",
  5: "bg-gradient-to-r from-red-900/60 to-orange-900/40 text-red-300 border-red-800",
};

export default function RatingBadge({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const label = RATING_LABELS[rating] || "?";
  const style = RATING_STYLES[rating] || RATING_STYLES[1];
  const sizeClass = size === "lg" ? "px-4 py-1.5 text-sm" : "px-2.5 py-0.5 text-xs";
  return (
    <span className={`inline-block rounded-full border font-bold ${sizeClass} ${style}`}>
      {label}
    </span>
  );
}
