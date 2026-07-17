/**
 * Scroll-reveal via IntersectionObserver, and button ripple effect.
 */
import { $$, prefersReducedMotion } from "./utils.js";

export function initReveal() {
  const targets = $$(".reveal, .reveal-scale");
  if (!targets.length) return;

  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    for (const el of targets) el.classList.add("is-visible");
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  // Stagger siblings that share a parent grid
  const groups = new Map();
  for (const el of targets) {
    const parent = el.parentElement;
    const index = groups.get(parent) ?? 0;
    el.style.setProperty("--reveal-delay", `${Math.min(index, 8) * 60}ms`);
    groups.set(parent, index + 1);
    observer.observe(el);
  }
}

export function initRipple() {
  if (prefersReducedMotion()) return;

  document.addEventListener("click", (event) => {
    const btn = event.target.closest(".btn");
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
    btn.append(ripple);
  });
}
