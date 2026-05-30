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
    <nav className="hidden lg:block fixed left-[max(16px,calc((100vw-56rem)/2-200px))] top-32 z-20">
      <div className="flex flex-col gap-1 p-3 rounded-xl bg-canvas border border-hairline shadow-sm">
        <p className="text-[10px] uppercase tracking-[3px] text-muted-soft px-2 pb-2 font-medium">
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
  );
}
