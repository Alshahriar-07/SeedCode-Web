/**
 * Navbar behavior: scroll state, mobile menu, current-page highlight.
 */
import { $, $$ } from "./utils.js";

export function initNavigation() {
  const nav = $(".nav");
  if (!nav) return;

  const toggle = $(".nav-toggle", nav);
  const links = $("#nav-links", nav);

  // Border appears once the page is scrolled
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile menu
  if (toggle && links) {
    const close = () => {
      toggle.setAttribute("aria-expanded", "false");
      links.classList.remove("is-open");
    };

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      links.classList.toggle("is-open", !open);
    });

    links.addEventListener("click", (event) => {
      if (event.target.closest("a")) close();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });

    window.matchMedia("(min-width: 56rem)").addEventListener("change", close);
  }

  // Mark the current page in the nav for styling + screen readers
  const path = location.pathname.split("/").pop() || "index.html";
  for (const link of $$("a[href]", nav)) {
    const href = link.getAttribute("href").split("#")[0];
    if (href && href === path) link.setAttribute("aria-current", "page");
  }
}
