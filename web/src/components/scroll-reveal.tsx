"use client";
import { useEffect } from "react";

/**
 * Scroll reveal for landing sections. Marks <html class="reveal-ready">
 * before observing [data-reveal] elements, so content is never hidden when
 * JS doesn't run. Honors prefers-reduced-motion by doing nothing; polish.css
 * carries the transition/hidden states and its own reduced-motion gate.
 */
export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;
    const root = document.documentElement;
    if (root.classList.contains("reveal-ready")) return;
    root.classList.add("reveal-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );
    for (const el of document.querySelectorAll("[data-reveal]")) {
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);
  return null;
}
