# Seed Code CLI — Official Website

The official marketing website for **Seed Code CLI**, the beautiful AI coding assistant for your terminal.

Built entirely with **HTML5, modern CSS3, and vanilla JavaScript (ES modules)** — no frameworks, no build step. Deploy the folder as-is to any static host.

## Pages

| Page            | Purpose                                              |
| --------------- | ---------------------------------------------------- |
| `index.html`    | Home — hero, animated terminal, features, install, screenshots, comparison |
| `download.html` | Installation methods (pip, uv, Windows installer) and platforms |
| `docs.html`     | Documentation — getting started, commands, configuration, providers |
| `roadmap.html`  | Shipped and upcoming features timeline               |
| `faq.html`      | Frequently asked questions (accordion + FAQ JSON-LD) |
| `404.html`      | Not-found page                                       |

## Structure

```
├── index.html / download.html / docs.html / roadmap.html / faq.html / 404.html
├── css/          variables, main, layout, components, terminal, animations, responsive
├── js/           ES modules — main (entry), navigation, terminal, particles,
│                 animations, copy, accordion, theme, utils
├── public/       logo.svg / logo.png / logo.ico (official brand assets)
├── assets/ images/ icons/ fonts/   reserved for future media
├── robots.txt · sitemap.xml · site.webmanifest
```

## Brand assets

The official logo lives in `public/` (`logo.svg`, `logo.png`, `logo.ico`), extracted verbatim
from `img/seedcode.ico` by `scripts/extract-logo.mjs`. Re-run it if the source icon changes:

```
node scripts/extract-logo.mjs
```

## Local development

No build step. Serve the folder with any static server:

```
npx serve .
# or
python -m http.server
```

Then open http://localhost:3000 (or :8000).

## Deployment

Deploy the repository root to Vercel, Netlify, GitHub Pages, or Cloudflare Pages as a
**static site** (no framework preset, no build command, output directory `.`).

Before going live, replace `https://seedcode-cli.vercel.app` with your production domain in:

- every page's `<link rel="canonical">`, Open Graph, and Twitter meta tags
- `sitemap.xml`
- `robots.txt`

## Notes

- Dark mode only, per the brand direction.
- All animations respect `prefers-reduced-motion`.
- Fonts (Space Grotesk, Inter, JetBrains Mono) load from Google Fonts with preconnect.

## License

MIT — see the [Seed Code CLI repository](https://github.com/seedcode-cli/seedcode).
