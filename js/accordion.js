/**
 * Accessible accordion for the FAQ. One item open at a time,
 * full keyboard support via native <button> semantics.
 */
import { $$ } from "./utils.js";

export function initAccordion() {
  const accordions = $$(".accordion");

  for (const accordion of accordions) {
    const items = $$(".accordion-item", accordion);

    for (const item of items) {
      const trigger = item.querySelector(".accordion-trigger");
      const panel = item.querySelector(".accordion-panel");
      if (!trigger || !panel) continue;

      trigger.addEventListener("click", () => {
        const isOpen = item.classList.contains("is-open");

        for (const other of items) {
          other.classList.remove("is-open");
          other
            .querySelector(".accordion-trigger")
            ?.setAttribute("aria-expanded", "false");
        }

        if (!isOpen) {
          item.classList.add("is-open");
          trigger.setAttribute("aria-expanded", "true");
        }
      });
    }
  }
}
