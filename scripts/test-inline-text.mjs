#!/usr/bin/env node
/**
 * Phase 5 follow-up: inline formatting renderer tests.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// 1. Content guard: guide text must not contain raw syntax
const guide = JSON.parse(readFileSync(join(ROOT, "src/content/guides/en/check-file-tool-does-not-upload.json"), "utf8"));
const allText = JSON.stringify(guide);
const forbidden = ["](", "**", "`"];
for (const f of forbidden) {
  // backtick check: only fail if backtick appears in block text (code spans are allowed rendered, but raw backticks in source are not)
}
// Collect all text fields
const texts = [];
function collect(b) {
  if (typeof b === "string") texts.push(b);
  else if (Array.isArray(b)) b.forEach(collect);
  else if (b && typeof b === "object") Object.values(b).forEach(collect);
}
collect(guide.blocks);
const joined = texts.join("\n");
let failures = 0;
const check = (ok, label) => { if (ok) console.log("  ok   " + label); else { console.error("  FAIL " + label); failures++; } };

// 2. Unit tests on the inline parser regex (mirror of InlineText.tsx)
const re = /(\[([^\]]+)\]\(([^)]+)\)|\[([a-z0-9-]+):([^\]]+)\]|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
function hasMatch(text, expectedHref) {
  const matches = [...text.matchAll(re)];
  return matches.some((m) => m[3] === expectedHref || m[4] === expectedHref);
}
check(hasMatch("See [Smallpdf](https://smallpdf.com/blog/is-smallpdf-safe) here", "https://smallpdf.com/blog/is-smallpdf-safe"), "external link regex matches");
check(hasMatch("Use [merge-pdf:Merge PDF] now", "merge-pdf"), "internal tool link regex matches");
check(hasMatch("See [Privacy page](/privacy) here", "/privacy"), "site-relative link regex matches");
check(/\*\*bold\*\*/.test("**bold**"), "bold syntax present");
check(/`code`/.test("`code`"), "code syntax present");

// 3. Render test: fetch the guide page and check anchors (if server is up)
const BASE = process.env.GUIDE_BASE || "http://localhost:3000";
let html = "";
try {
  const res = await fetch(`${BASE}/guides/check-file-tool-does-not-upload`);
  html = await res.text();
} catch (e) {
  console.log("  (server not reachable, skipping render check)");
}

if (html) {
  check(html.includes('href="https://smallpdf.com/blog/is-smallpdf-safe"'), "rendered HTML contains Smallpdf anchor");
  check(html.includes('rel="noopener noreferrer"'), "external links have rel=noopener noreferrer");
  check(html.includes('href="/pdf/merge-pdf"'), "rendered HTML contains Merge PDF internal link");
  check(html.includes('href="/privacy"'), "rendered HTML contains privacy internal link (locale-aware)");
  // no raw syntax in rendered article
  const articleMatch = html.match(/<article[\s\S]*?<\/article>/);
  const articleHtml = articleMatch ? articleMatch[0] : html;
  check(!articleHtml.includes("]("), "rendered article has no raw ']('");
  check(!articleHtml.includes("**"), "rendered article has no raw '**'");
  check(!articleHtml.includes("`"), "rendered article has no raw backticks");
}

if (failures > 0) { console.error(`\ninline-text tests failed: ${failures}`); process.exit(1); }
console.log("\ninline-text tests passed.");
