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

// Known tool slugs + categories from src/lib/tools.ts
const toolsSrc = readFileSync(join(ROOT, "src/lib/tools.ts"), "utf8");
const toolEntries = [...toolsSrc.matchAll(/slug:\s*"([^"]+)"[\s\S]*?category:\s*"([^"]+)"/g)];
const toolSlugs = new Set(toolEntries.map((m) => m[1]));
const toolPaths = new Set(toolEntries.map((m) => `/${m[2]}/${m[1]}`));

const KNOWN_STATIC_ROUTES = new Set([
  "/about", "/donate", "/contact", "/privacy", "/terms", "/blog", "/guides",
  "/pdf", "/image", "/text",
]);

function isKnownPath(p) {
  if (KNOWN_STATIC_ROUTES.has(p)) return true;
  if (toolPaths.has(p)) return true;
  // category page
  if (/^\/(pdf|image|text)$/.test(p)) return true;
  return false;
}

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

// Inline link extraction
const linkRe = /\[([^\]]+)\]\(([^)]+)\)|\[([a-z0-9-]+):([^\]]+)\]/g;

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

  const required = ["slug", "title", "description", "keywords", "readingTime", "author", "datePublished", "dateModified", "draft", "blocks"];
  for (const k of required) {
    if (!(k in guide)) fail(`${locale}/${slug}: missing required field "${k}"`);
  }
  if (guide.slug !== slug) fail(`${locale}/${slug}: slug mismatch`);
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

  (guide.blocks || []).forEach((b, i) => {
    if (!BLOCK_TYPES.has(b.type)) fail(`${locale}/${slug}: block ${i} unknown type "${b.type}"`);
    if (b.type === "heading" && (b.level !== 2 && b.level !== 3)) fail(`${locale}/${slug}: block ${i} heading level must be 2 or 3`);
    if (b.type === "callout" && !CALLOUT_VARIANTS.has(b.variant)) fail(`${locale}/${slug}: block ${i} callout variant invalid`);
    if (b.type === "image") {
      if (typeof b.src !== "string" || !b.src.startsWith("/")) fail(`${locale}/${slug}: block ${i} image src must start with /`);
      if (typeof b.alt !== "string") fail(`${locale}/${slug}: block ${i} image alt must be string`);
      if (!b.alt.trim()) fail(`${locale}/${slug}: block ${i} image has empty alt`);
      const srcPath = join(ROOT, "public", b.src.replace(/^\//, ""));
      if (!existsSync(srcPath)) fail(`${locale}/${slug}: block ${i} image src does not exist: ${b.src}`);
    }
    if (b.type === "faq" && !Array.isArray(b.faqItems)) fail(`${locale}/${slug}: block ${i} faq must have faqItems array`);
  });

  // Content guard (non-draft only)
  if (!guide.draft) {
    const text = JSON.stringify(guide);
    for (const pat of guardPatterns) {
      if (pat.test(text)) fail(`${locale}/${slug}: non-draft guide contains forbidden pattern ${pat}`);
    }
  }

  // Link validation (applies to drafts too)
  const allText = JSON.stringify(guide);
  // absolute choosetools.com links forbidden
  if (/https?:\/\/(www\.)?choosetools\.com/i.test(allText)) {
    fail(`${locale}/${slug}: contains absolute link to choosetools.com (use internal syntax)`);
  }
  // parse inline links
  const texts = [];
  function collect(b) {
    if (typeof b === "string") texts.push(b);
    else if (Array.isArray(b)) b.forEach(collect);
    else if (b && typeof b === "object") Object.values(b).forEach(collect);
  }
  collect(guide.blocks);
  for (const t of texts) {
    let m;
    const re = new RegExp(linkRe.source, "g");
    while ((m = re.exec(t)) !== null) {
      if (m[2]) {
        // [text](target)  -> m[1]=label, m[2]=target
        const target = m[2];
        if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("//")) {
          // external — allowed
        } else if (target.startsWith("/")) {
          if (!isKnownPath(target)) fail(`${locale}/${slug}: unknown relative link target "${target}"`);
        } else {
          fail(`${locale}/${slug}: invalid link target "${target}"`);
        }
      } else if (m[3]) {
        // [tool-slug:text] -> m[3]=slug, m[4]=label
        const slug2 = m[3];
        if (!toolSlugs.has(slug2)) fail(`${locale}/${slug}: unknown tool slug "${slug2}" in internal link`);
      }
    }
  }

  if (failures === 0) ok(`${locale}/${slug}: valid`);
}

if (failures > 0) {
  console.error(`\nGuide validation failed: ${failures} issue(s).`);
  process.exit(1);
}
console.log(`\nGuide validation passed (${walkGuides().length} guide(s) scanned).`);
