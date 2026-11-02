#!/usr/bin/env node
/**
 * Build-time validation + content guard for standalone guides.
 * Wired into npm test.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GUIDES_ROOT = join(ROOT, "src/content/guides");

const BLOCK_TYPES = new Set(["heading", "paragraph", "orderedList", "unorderedList", "callout", "image", "faq"]);
const CALLOUT_VARIANTS = new Set(["note", "warning"]);

function walkGuides() {
  const out = [];
  if (!existsSync(GUIDES_ROOT)) return out;
  for (const locale of readdirSync(GUIDES_ROOT)) {
    const dir = join(GUIDES_ROOT, locale);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".json")) continue;
      out.push({ locale, path: join(dir, f), slug: f.replace(/\.json$/, "") });
    }
  }
  return out;
}

let failures = 0;
const fail = (msg) => { console.error("  FAIL " + msg); failures++; };
const ok = (msg) => console.log("  ok   " + msg);

const guardPatterns = [/\bTODO\b/, /\[SCREENSHOT/, /\bVERIFY\b/, /\blorem\b/i];

for (const { locale, path: file, slug } of walkGuides()) {
  let guide;
  try {
    guide = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    fail(`${locale}/${slug}: invalid JSON (${e.message})`);
    continue;
  }

  // Schema validation
  const required = ["slug", "title", "description", "keywords", "readingTime", "author", "datePublished", "dateModified", "draft", "blocks"];
  for (const k of required) {
    if (!(k in guide)) fail(`${locale}/${slug}: missing required field "${k}"`);
  }
  if (guide.slug !== slug) fail(`${locale}/${slug}: slug mismatch (file=${slug}, json=${guide.slug})`);
  if (typeof guide.title !== "string" || !guide.title.trim()) fail(`${locale}/${slug}: title must be non-empty string`);
  if (typeof guide.description !== "string" || guide.description.length < 120 || guide.description.length > 155) {
    fail(`${locale}/${slug}: description must be 120-155 chars (got ${guide.description?.length})`);
  }
  if (!Array.isArray(guide.keywords)) fail(`${locale}/${slug}: keywords must be array`);
  if (typeof guide.readingTime !== "number") fail(`${locale}/${slug}: readingTime must be number`);
  if (typeof guide.author !== "string" || !guide.author.trim()) fail(`${locale}/${slug}: author must be non-empty string`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(guide.datePublished)) fail(`${locale}/${slug}: datePublished must be YYYY-MM-DD`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(guide.dateModified)) fail(`${locale}/${slug}: dateModified must be YYYY-MM-DD`);
  if (typeof guide.draft !== "boolean") fail(`${locale}/${slug}: draft must be boolean`);
  if (!Array.isArray(guide.blocks)) fail(`${locale}/${slug}: blocks must be array`);

  // Block validation
  (guide.blocks || []).forEach((b, i) => {
    if (!BLOCK_TYPES.has(b.type)) fail(`${locale}/${slug}: block ${i} unknown type "${b.type}"`);
    if (b.type === "heading" && (b.level !== 2 && b.level !== 3)) fail(`${locale}/${slug}: block ${i} heading level must be 2 or 3`);
    if (b.type === "callout" && !CALLOUT_VARIANTS.has(b.variant)) fail(`${locale}/${slug}: block ${i} callout variant invalid`);
    if (b.type === "image") {
      if (typeof b.src !== "string" || !b.src.startsWith("/")) fail(`${locale}/${slug}: block ${i} image src must start with /`);
      if (typeof b.alt !== "string") fail(`${locale}/${slug}: block ${i} image alt must be string`);
      // content guard: empty alt
      if (!b.alt.trim()) fail(`${locale}/${slug}: block ${i} image has empty alt`);
      // content guard: src file exists
      const srcPath = join(ROOT, "public", b.src.replace(/^\//, ""));
      if (!existsSync(srcPath)) fail(`${locale}/${slug}: block ${i} image src does not exist: ${b.src}`);
    }
    if (b.type === "faq") {
      if (!Array.isArray(b.faqItems)) fail(`${locale}/${slug}: block ${i} faq must have faqItems array`);
    }
  });

  // Content guard (non-draft only)
  if (!guide.draft) {
    const text = JSON.stringify(guide);
    for (const pat of guardPatterns) {
      if (pat.test(text)) fail(`${locale}/${slug}: non-draft guide contains forbidden pattern ${pat}`);
    }
  }

  if (failures === 0) ok(`${locale}/${slug}: valid`);
}

if (failures > 0) {
  console.error(`\nGuide validation failed: ${failures} issue(s).`);
  process.exit(1);
}
console.log(`\nGuide validation passed (${walkGuides().length} guide(s) scanned).`);
