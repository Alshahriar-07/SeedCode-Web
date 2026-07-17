/**
 * Theme: the site ships dark-only. This module pins the theme attribute
 * and the browser UI color so embedded contexts render consistently.
 */
const THEME = "dark";
const THEME_COLOR = "#050505";

export function initTheme() {
  document.documentElement.dataset.theme = THEME;

  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.append(meta);
  }
  meta.content = THEME_COLOR;
}
