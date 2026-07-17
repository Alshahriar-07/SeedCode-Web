/**
 * Hero background: floating canvas particles + mouse-tracked glow.
 * Both are decorative, cheap (single rAF loop, ~40 particles),
 * and disabled entirely under prefers-reduced-motion.
 */
import { $, prefersReducedMotion } from "./utils.js";

const PARTICLE_DENSITY = 1 / 26000; // particles per px²
const MAX_PARTICLES = 56;

export function initParticles() {
  const canvas = $(".hero-particles");
  const hero = canvas?.closest(".hero");
  if (!canvas || !hero || prefersReducedMotion()) return;

  const ctx = canvas.getContext("2d");
  let particles = [];
  let width = 0;
  let height = 0;
  let rafId = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = hero.clientWidth;
    height = hero.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(Math.round(width * height * PARTICLE_DENSITY), MAX_PARTICLES);
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.6 + Math.random() * 1.4,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -0.05 - Math.random() * 0.22,
      alpha: 0.12 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
    }));
  };

  const tick = (time) => {
    ctx.clearRect(0, 0, width, height);
    for (const particle of particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      if (particle.y < -4) {
        particle.y = height + 4;
        particle.x = Math.random() * width;
      }
      if (particle.x < -4) particle.x = width + 4;
      if (particle.x > width + 4) particle.x = -4;

      const twinkle = 0.7 + 0.3 * Math.sin(time / 1400 + particle.phase);
      ctx.globalAlpha = particle.alpha * twinkle;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fill();
    }
    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (!rafId) rafId = requestAnimationFrame(tick);
  };

  const stop = () => {
    cancelAnimationFrame(rafId);
    rafId = 0;
  };

  resize();
  window.addEventListener("resize", resize, { passive: true });

  // Pause when the hero is off-screen or the tab is hidden
  new IntersectionObserver((entries) => {
    entries.some((entry) => entry.isIntersecting) ? start() : stop();
  }).observe(hero);

  document.addEventListener("visibilitychange", () => {
    document.hidden ? stop() : start();
  });
}

export function initMouseGlow() {
  const glow = $(".hero-glow");
  const hero = glow?.closest(".hero");
  if (!glow || !hero || prefersReducedMotion()) return;

  let targetX = 0.5;
  let targetY = 0.3;
  let x = targetX;
  let y = targetY;
  let rafId = 0;

  const tick = () => {
    x += (targetX - x) * 0.08;
    y += (targetY - y) * 0.08;
    glow.style.left = `${x * 100}%`;
    glow.style.top = `${y * 100}%`;
    if (Math.abs(targetX - x) > 0.001 || Math.abs(targetY - y) > 0.001) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = 0;
    }
  };

  hero.addEventListener(
    "pointermove",
    (event) => {
      const rect = hero.getBoundingClientRect();
      targetX = (event.clientX - rect.left) / rect.width;
      targetY = (event.clientY - rect.top) / rect.height;
      if (!rafId) rafId = requestAnimationFrame(tick);
    },
    { passive: true }
  );
}
