#!/usr/bin/env node
/**
 * Link check over the built site (.next/server/app).
 *
 * - Collects every prerendered route from the build output.
 * - Extracts internal hrefs from each prerendered HTML page.
 * - Verifies each href (and every sitemap <loc>) resolves to a known route.
 *
 * Skips gracefully (exit 0) when no build output is present, so `npm test`
 * can run before `npm run build`. CI should run `npm run build` first.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP_DIR = join(ROOT, ".next", "server", "app");

if (!existsSync(APP_DIR)) {
  console.log("Link check skipped (no .next build output). Run `npm run build` first.");
  process.exit(0);
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(APP_DIR);

// ── Build the set of known routes ──────────────────────────────────────────
const routes = new Set(["/"]);
const htmlFiles = [];
for (const f of files) {
  const rel = relative(APP_DIR, f).split("\\").join("/");
  if (rel.endsWith(".html")) {
    if (rel.endsWith("_not-found.html")) continue;
    const route = "/" + rel.replace(/\.html$/, "");
    routes.add(route);
    // English is served without a prefix (localePrefix "as-needed"), but is
    // prerendered under /en/... — register the public alias too.
    if (route === "/en") routes.add("/");
    else if (route.startsWith("/en/")) routes.add(route.slice(3));
    htmlFiles.push({ file: f, route });
  }
  if (rel.endsWith("opengraph-image.png.body")) {
    routes.add("/" + rel.replace(/\.body$/, ""));
  }
}
// Metadata/static routes emitted by the app.
for (const extra of [
  "/robots.txt", "/sitemap.xml", "/manifest.webmanifest",
  "/icon.png", "/apple-icon.png", "/favicon.ico",
]) routes.add(extra);

const norm = (href) => {
  let p = href.split("#")[0].split("?")[0];
  if (!p.startsWith("/")) return null;
  if (p.length > 1 && p.endsWith("/")) p = p.replace(/\/+$/, "");
  return p || "/";
};

// ── Scan HTML for internal links ───────────────────────────────────────────
const unresolved = [];
const seen = new Set();
let linkCount = 0;

for (const { file, route } of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const re = /href="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1];
    if (!raw.startsWith("/") || raw.startsWith("//")) continue;
    const p = norm(raw);
    if (!p) continue;
    // Ignore Next internals / asset paths / API.
    if (p.startsWith("/_next/") || p.startsWith("/api/")) continue;
    linkCount++;
    if (!routes.has(p)) {
      const key = `${route} -> ${p}`;
      if (!seen.has(key)) {
        seen.add(key);
        unresolved.push({ from: route, to: p });
      }
    }
  }
}

// ── Check sitemap <loc> entries ────────────────────────────────────────────
let sitemapLocs = 0;
const sitemapBad = [];
const sitemapPath = join(APP_DIR, "sitemap.xml.body");
if (existsSync(sitemapPath)) {
  const xml = readFileSync(sitemapPath, "utf8");
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    sitemapLocs++;
    let url = m[1];
    try {
      const u = new URL(url);
      const p = norm(u.pathname);
      if (p && !routes.has(p)) sitemapBad.push(p);
    } catch {
      sitemapBad.push(url);
    }
  }
}

console.log(`Link check: ${htmlFiles.length} pages, ${linkCount} internal links, ${sitemapLocs} sitemap <loc> entries.`);

let failed = 0;
if (unresolved.length > 0) {
  failed++;
  console.error(`\nUnresolved internal links (${unresolved.length}):`);
  for (const u of unresolved.slice(0, 100)) console.error(`  ${u.from} -> ${u.to}`);
  if (unresolved.length > 100) console.error(`  ... and ${unresolved.length - 100} more`);
}
if (sitemapBad.length > 0) {
  failed++;
  console.error(`\nSitemap entries with no route (${sitemapBad.length}):`);
  for (const p of [...new Set(sitemapBad)].slice(0, 100)) console.error(`  ${p}`);
}

if (failed > 0) process.exit(1);
console.log("Link check passed: every internal link and sitemap entry resolves to a built route.");
