"use client";

import { useEffect, useState } from "react";

interface YearNavProps {
  years: number[];
}

export default function YearNav({ years }: YearNavProps) {
  const [activeYear, setActiveYear] = useState<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const y = Number(entry.target.id.replace("year-", ""));
            if (!isNaN(y)) setActiveYear(y);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );

    for (const y of years) {
      const el = document.getElementById(`year-${y}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [years]);

  function scrollTo(year: number) {
    const el = document.getElementById(`year-${year}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveYear(year);
    }
  }

  if (years.length <= 1) return null;

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden lg:block fixed left-[max(16px,calc((100vw-56rem)/2-200px))] top-32 z-20">
        <div className="flex flex-col gap-1 p-3 rounded-xl bg-canvas border border-hairline shadow-sm">
          <p className="text-[10px] uppercase tracking-[3px] text-muted-soft px-2 pb-2 font-medium font-sans">
            年份
          </p>
          {years.map((year) => (
            <button
              key={year}
              onClick={() => scrollTo(year)}
              className={`text-left px-3 py-1.5 rounded-lg text-sm transition-all font-sans ${
                activeYear === year
                  ? "bg-surface-card text-ink font-semibold"
                  : "text-muted hover:text-ink hover:bg-surface-soft"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile horizontal scroll bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-canvas/90 backdrop-blur-lg border-t border-hairline px-4 py-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => scrollTo(year)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all font-sans flex-shrink-0 ${
                activeYear === year
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:text-ink bg-surface-soft"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
