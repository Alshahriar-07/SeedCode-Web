/**
 * Copy-to-clipboard buttons. Any element with [data-copy] copies its value;
 * buttons inside a .code-line with no data-copy copy the sibling <code> text.
 */
import { $$ } from "./utils.js";

const RESET_MS = 1800;

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API can fail on file:// or older browsers — fall back.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

export function initCopyButtons() {
  for (const btn of $$(".copy-btn")) {
    btn.addEventListener("click", async () => {
      const text =
        btn.dataset.copy ??
        btn.closest(".code-line")?.querySelector("code")?.textContent ??
        "";
      if (!text) return;

      const ok = await copyText(text.trim());
      if (!ok) return;

      btn.classList.add("is-copied");
      const live = btn.querySelector("[data-copy-status]");
      if (live) live.textContent = "Copied to clipboard";

      clearTimeout(btn._resetTimer);
      btn._resetTimer = setTimeout(() => {
        btn.classList.remove("is-copied");
        if (live) live.textContent = "";
      }, RESET_MS);
    });
  }
}
