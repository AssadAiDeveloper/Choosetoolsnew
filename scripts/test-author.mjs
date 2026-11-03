#!/usr/bin/env node
/**
 * Author config test (Phase 5 follow-up).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

let failures = 0;
const check = (ok, label) => { if (ok) console.log("  ok   " + label); else { console.error("  FAIL " + label); failures++; } };

// 1. ARTICLE_AUTHOR === "ChooseTools Team"
const blogSrc = readFileSync(join(ROOT, "src/lib/blog.ts"), "utf8");
check(/export const ARTICLE_AUTHOR = "ChooseTools Team"/.test(blogSrc), "ARTICLE_AUTHOR is 'ChooseTools Team'");

// 2. Guide page emits Organization when author is "ChooseTools Team"
const guidePage = readFileSync(join(ROOT, "app/[locale]/guides/[slug]/page.tsx"), "utf8");
check(/guide\.author === "ChooseTools Team"/.test(guidePage), "guide page checks author === 'ChooseTools Team'");
check(/@type.*Organization/.test(guidePage) && /name.*ChooseTools/.test(guidePage), "guide page emits Organization with name ChooseTools");
check(/@type.*Person/.test(guidePage), "guide page keeps Person branch for other values");

// 3. Visible byline shows "ChooseTools Team" (guide author field default)
const guideJson = JSON.parse(readFileSync(join(ROOT, "src/content/guides/en/check-file-tool-does-not-upload.json"), "utf8"));
check(guideJson.author === "ChooseTools Team", "guide 1 author is 'ChooseTools Team'");
check(guideJson.draft === true, "guide 1 stays draft=true");

// 4. Render test (preview mode): Organization in JSON-LD
const BASE = process.env.GUIDE_BASE || "http://localhost:3000";
let html = "";
try {
  const res = await fetch(`${BASE}/guides/check-file-tool-does-not-upload`);
  html = await res.text();
} catch (e) {
  console.log("  (server not reachable, skipping render check)");
}
if (html) {
  check(html.includes('"@type":"Organization"') && html.includes('"name":"ChooseTools"'), "rendered JSON-LD has Organization ChooseTools");
  check(html.includes("ChooseTools Team"), "rendered byline shows 'ChooseTools Team'");
}

if (failures > 0) { console.error(`\nauthor tests failed: ${failures}`); process.exit(1); }
console.log("\nauthor tests passed.");
