/**
 * Static-site verification: checks that every local href/src/import in the
 * HTML pages, CSS, and JS modules resolves to a real file, that IDs referenced
 * by fragment links exist, and that JS/JSON files parse.
 * Run: node scripts/verify-site.mjs
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pages = readdirSync(root).filter((f) => f.endsWith(".html"));
const errors = [];
const ok = (msg) => console.log(`  ✓ ${msg}`);

// Collect ids per page for fragment checking
const idsByPage = {};
for (const page of pages) {
  const html = readFileSync(join(root, page), "utf8");
  idsByPage[page] = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
}

console.log("\nHTML pages:");
for (const page of pages) {
  const html = readFileSync(join(root, page), "utf8");
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  let checked = 0;
  for (const ref of refs) {
    if (/^(https?:|mailto:|data:|#$)/.test(ref)) continue;
    const [path, fragment] = ref.split("#");
    const targetPage = path === "" ? page : path;
    if (path !== "" && !existsSync(join(root, path))) {
      errors.push(`${page}: missing file → ${path}`);
      continue;
    }
    if (fragment && targetPage.endsWith(".html")) {
      const ids = idsByPage[targetPage];
      if (ids && !ids.has(fragment)) {
        errors.push(`${page}: broken fragment → ${targetPage}#${fragment}`);
      }
    }
    checked++;
  }
  // Required head tags
  for (const [name, re] of [
    ["title", /<title>[^<]+<\/title>/],
    ["meta description", /name="description"/],
    ["favicon", /rel="icon"/],
    ["manifest", /rel="manifest"/],
    ["lang attr", /<html lang="en"/],
    ["viewport", /name="viewport"/],
  ]) {
    if (!re.test(html)) errors.push(`${page}: missing ${name}`);
  }
  // Indexable pages need canonical + OG
  if (page !== "404.html") {
    for (const [name, re] of [
      ["canonical", /rel="canonical"/],
      ["og:title", /property="og:title"/],
      ["twitter card", /name="twitter:card"/],
    ]) {
      if (!re.test(html)) errors.push(`${page}: missing ${name}`);
    }
  }
  ok(`${page} — ${checked} local refs, head tags present`);
}

console.log("\nCSS url() references:");
for (const file of readdirSync(join(root, "css"))) {
  const css = readFileSync(join(root, "css", file), "utf8");
  for (const m of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    const url = m[1];
    if (/^(data:|https?:|#)/.test(url)) continue;
    if (!existsSync(resolve(root, "css", url))) {
      errors.push(`css/${file}: missing url → ${url}`);
    }
  }
  ok(`css/${file}`);
}

console.log("\nJS modules (syntax + imports):");
for (const file of readdirSync(join(root, "js"))) {
  const path = join(root, "js", file);
  const source = readFileSync(path, "utf8");
  try {
    await import(new URL(`file://${path.replace(/\\/g, "/")}`));
  } catch (err) {
    // DOM APIs are absent in Node; only syntax/resolution errors matter here.
    if (err instanceof SyntaxError || err.code === "ERR_MODULE_NOT_FOUND") {
      errors.push(`js/${file}: ${err.message}`);
    }
  }
  for (const m of source.matchAll(/from\s+"(\.[^"]+)"/g)) {
    if (!existsSync(resolve(root, "js", m[1]))) {
      errors.push(`js/${file}: missing import → ${m[1]}`);
    }
  }
  ok(`js/${file}`);
}

console.log("\nSEO & meta files:");
for (const file of ["robots.txt", "sitemap.xml", "site.webmanifest", "README.md"]) {
  if (!existsSync(join(root, file))) errors.push(`missing ${file}`);
  else ok(file);
}
try {
  JSON.parse(readFileSync(join(root, "site.webmanifest"), "utf8"));
  ok("site.webmanifest parses as JSON");
} catch (err) {
  errors.push(`site.webmanifest: invalid JSON — ${err.message}`);
}
// Sitemap entries must be real pages
const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
for (const m of sitemap.matchAll(/<loc>https:\/\/[^/]+\/([^<]*)<\/loc>/g)) {
  const page = m[1] === "" ? "index.html" : m[1];
  if (!existsSync(join(root, page))) errors.push(`sitemap.xml: missing page → ${page}`);
}
ok("sitemap entries resolve");

console.log("\nBrand assets:");
for (const file of ["logo.svg", "logo.png", "logo.ico"]) {
  if (!existsSync(join(root, "public", file))) errors.push(`missing public/${file}`);
  else ok(`public/${file}`);
}
// JSON-LD blocks must parse
for (const page of pages) {
  const html = readFileSync(join(root, page), "utf8");
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch (err) {
      errors.push(`${page}: invalid JSON-LD — ${err.message}`);
    }
  }
}
ok("JSON-LD blocks parse");

if (errors.length) {
  console.error(`\n✗ ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("\n✓ All checks passed.\n");
