#!/usr/bin/env node
/**
 * T1 (follow-up): blog article indexing policy.
 * With INDEXABLE_BLOG_SLUGS empty, no article may be marked indexable.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Compile indexing.ts to JS using tsc --ignoreConfig
import { execSync } from "node:child_process";
const outDir = join(ROOT, ".tmp-indexing");
try { execSync(`npx tsc "${join(ROOT, "src/lib/indexing.ts")}" --ignoreConfig --module esnext --target es2022 --moduleResolution bundler --skipLibCheck --outDir "${outDir}"`, { cwd: ROOT, stdio: "pipe" }); } catch (e) { /* ignore */ }

const mod = await import("file://" + outDir.replace(/\\/g, "/") + "/indexing.js");
const { isIndexableBlogSlug, isIndexableLocale, INDEXABLE_BLOG_SLUGS, INDEXABLE_LOCALES } = mod;

let failures = 0;
const check = (ok, label) => { if (ok) console.log("  ok   " + label); else { console.error("  FAIL " + label); failures++; } };

// Priority locales only
check(INDEXABLE_LOCALES.includes("en") && INDEXABLE_LOCALES.includes("ar") && INDEXABLE_LOCALES.includes("nl") && INDEXABLE_LOCALES.includes("es"), "priority locales present");

// INDEXABLE_BLOG_SLUGS must be empty for every priority locale
for (const loc of INDEXABLE_LOCALES) {
  const slugs = INDEXABLE_BLOG_SLUGS[loc] || [];
  check(Array.isArray(slugs) && slugs.length === 0, `${loc}: INDEXABLE_BLOG_SLUGS is empty (${slugs.length})`);
}

// No article slug may be indexable while the allow-list is empty
const sampleSlugs = ["merge-pdf", "compress-pdf", "pdf-to-word"];
for (const loc of INDEXABLE_LOCALES) {
  for (const s of sampleSlugs) {
    check(isIndexableBlogSlug(loc, s) === false, `${loc}/${s}: not indexable while allow-list empty`);
  }
}

// Verify the blog page source wires robots based on isIndexableBlogSlug
const blogPage = readFileSync(join(ROOT, "app/[locale]/blog/[slug]/page.tsx"), "utf8");
check(/isIndexableBlogSlug\(locale, slug\)/.test(blogPage), "blog page uses isIndexableBlogSlug for robots");
check(/robots:\s*indexable/.test(blogPage), "blog page sets robots from indexable flag");

if (failures > 0) { console.error(`\nblog-indexing tests failed: ${failures}`); process.exit(1); }
console.log("\nblog-indexing tests passed.");
// cleanup
import { rmSync } from "node:fs";
try { rmSync(outDir, { recursive: true, force: true }); } catch {}
