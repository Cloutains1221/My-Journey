"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function ScrollAnimator() {
  const pathname = usePathname();
  const obsRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (obsRef.current) {
      obsRef.current.disconnect();
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    obsRef.current = obs;

    const timer = setTimeout(() => {
      document.querySelectorAll("[data-animate]").forEach((el) => {
        obs.observe(el);
      });
    }, 50);

    return () => {
      clearTimeout(timer);
      obs.disconnect();
    };
  }, [pathname]);

  return null;
}
