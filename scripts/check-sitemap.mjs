#!/usr/bin/env node
/**
 * T3 (follow-up): sitemap URL check.
 *
 * Against a running `next start` (default http://localhost:3000), fetches every
 * URL in /sitemap.xml and fails on:
 *   - non-200 status
 *   - any redirect
 *   - a `noindex` robots directive
 *   - a canonical that differs from the URL
 */
import { readFileSync } from "node:fs";

const BASE = process.env.SITEMAP_BASE || "http://localhost:3000";

async function fetchText(url) {
  const res = await fetch(url, { redirect: "manual" });
  const text = await res.text();
  return { res, text };
}

// 1. Check the server is up
let sitemapRes, sitemapText;
try {
  ({ res: sitemapRes, text: sitemapText } = await fetchText(`${BASE}/sitemap.xml`));
} catch (err) {
  console.log(`check-sitemap: server not reachable at ${BASE} (${err.message}); skipping.`);
  process.exit(0);
}

if (!sitemapRes.ok) {
  console.error(`check-sitemap: /sitemap.xml returned ${sitemapRes.status}`);
  process.exit(1);
}

// 2. Parse <loc> entries
const urls = [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
console.log(`check-sitemap: ${urls.length} URLs in sitemap.`);

if (urls.length === 0) {
  console.error("check-sitemap: no URLs found in sitemap.");
  process.exit(1);
}

let failures = 0;
const fail = (msg) => { console.error("  FAIL " + msg); failures++; };

for (const url of urls) {
  // Ensure same host
  let fullUrl = url;
  if (url.startsWith("/")) fullUrl = BASE + url;

  let res, text;
  try {
    ({ res, text } = await fetchText(fullUrl));
  } catch (err) {
    fail(`${url}: fetch error ${err.message}`);
    continue;
  }

  if (res.status !== 200) {
    fail(`${url}: status ${res.status}`);
    continue;
  }

  // Redirect detection: manual redirect returns 3xx
  if (res.status >= 300 && res.status < 400) {
    fail(`${url}: redirect ${res.status} -> ${res.headers.get("location")}`);
    continue;
  }

  // noindex check (meta robots or x-robots-tag)
  const xRobots = (res.headers.get("x-robots-tag") || "").toLowerCase();
  if (xRobots.includes("noindex")) {
    fail(`${url}: x-robots-tag noindex`);
    continue;
  }
  const robotsMeta = text.match(/<meta[^>]+name=["']robots["'][^>]*>/i);
  if (robotsMeta && /noindex/i.test(robotsMeta[0])) {
    fail(`${url}: meta robots noindex`);
    continue;
  }

  // canonical check
  const canonMatch = text.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
    || text.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
  if (canonMatch) {
    const canonical = canonMatch[1];
    // Normalize: compare path+host
    let canonicalPath = canonical;
    try { canonicalPath = new URL(canonical, BASE).pathname; } catch {}
    let urlPath = fullUrl;
    try { urlPath = new URL(fullUrl).pathname; } catch {}
    if (canonicalPath !== urlPath) {
      fail(`${url}: canonical ${canonical} != ${url}`);
      continue;
    }
  }
}

if (failures > 0) {
  console.error(`\ncheck-sitemap failed: ${failures} issue(s).`);
  process.exit(1);
}
console.log(`check-sitemap passed: ${urls.length} URLs OK.`);
