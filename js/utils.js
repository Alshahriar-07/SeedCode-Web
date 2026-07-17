/**
 * Shared helpers: reduced-motion check and DOM shorthands.
 */
export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const $ = (selector, scope = document) => scope.querySelector(selector);

export const $$ = (selector, scope = document) => [
  ...scope.querySelectorAll(selector),
];
