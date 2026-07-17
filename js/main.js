/**
 * Seed Code CLI — entry point.
 * Wires up every module. All modules are side-effect free until init.
 */
import { initNavigation } from "./navigation.js";
import { initTheme } from "./theme.js";
import { initReveal, initRipple } from "./animations.js";
import { initCopyButtons } from "./copy.js";
import { initAccordion } from "./accordion.js";
import { initTerminal } from "./terminal.js";
import { initParticles, initMouseGlow } from "./particles.js";

function init() {
  initTheme();
  initNavigation();
  initReveal();
  initRipple();
  initCopyButtons();
  initAccordion();
  initTerminal();
  initParticles();
  initMouseGlow();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
