# Audit fix report — `audit/p0-fixes`

Developer agent deliverable for the ChooseTools audit (21 Oct 2026). No production deploy was performed. Branch `audit/p0-fixes`, one commit per task ID (see git log).

## Baseline (recorded before any edits)

- Branch: `audit/p0-fixes` (created from `main`).
- `npm install`: OK. One engine warning only: `pdfjs-dist` wants Node ≥ 22.13 / ≥ 24; the build machine runs Node v20.20.2. No lockfile change.
- `npx tsc --noEmit`: exit 0.
- `npm run build`: exit 0, `✓ Compiled successfully in 66s`, 2321 prerendered pages. Baseline log: `C:\Users\sAssa\AppData\Local\Temp\opencode\audit-baseline-build.log`.
- `npm run lint` / `npm test`: **not configured** originally (no scripts, ESLint not installed). Reported as "not configured", no deps added.
- Live-site check (read-only): `www.choosetools.com` canonical; `/blog/pdf-to-word` returns 404 with zero internal references.

## New dependencies

None. Every change reuses packages already in `package.json`. `@napi-rs/canvas@1.0.2` is used by `scripts/test-canvas-text.mjs` but is a transitive dependency of `pdfjs-dist@6.3.289`, not a new project dependency.

## Per-task status

### T1 — Russian mojibake + CI guard — Done (`638bea6`)
- Fixed 2 real mojibake instances in `messages/ru.json` (`TXT Ð² MT940` → `TXT в MT940`, `Excel Ð² MT940` → `Excel в MT940`). Other `Ã`/`â`/`Â` hits across locale files are legitimate fr/pt/es accents (audited all 11 files).
- Added `scripts/check-mojibake.mjs` scanning 1111 JSON files for `Ð`, `Ã`, `â€`, `Ñ` sequences, wired into `npm test`. Verified it fails (exit 1) when a mojibake sequence is reintroduced.

### T2 — protect-pdf ("Remove PDF Password") — Done (`114ec4b`)
- `src/lib/pdfEncrypt.mjs` + `src/lib/pdfUnlock.ts`: pdf-lib cannot decrypt, pdfjs-dist can. Unencrypted input → lossless pdf-lib re-save; encrypted input → render with pdfjs at 150 dpi and rebuild from JPEGs after a password prompt. Output is always checked for `/Encrypt`; an encrypted result is never reported as success (clear error instead).
- `ProtectPdf.tsx` rewritten; `ErrorBox` gained an optional `message`. Guide link suppressed via `GUIDE_LINK_EXCLUDED = new Set(["protect-pdf"])` because the only article is "how to add a password" (T2d Partial — see below).
- 4 `tool.*` keys × 11 locales (`pdfPassword`, `unlock`, `wrongPassword`, `encryptedPdf`) added; `TRANSLATION_REVIEW.md` T2 section.
- `scripts/test-protect-pdf.mjs` added; no `qpdf`/`pdftotext` available locally, so AES fixtures skipped and commands documented for QA.
- T2d Partial: no "remove password" guide exists; the protect-pdf guide link is suppressed until one is written (content follow-up).

### T3 — 404 on `/blog/pdf-to-word` — Blocked/not reproducible (`374eeb2`)
- No `pdf-to-word.json` article exists anywhere; no internal link or sitemap entry resolves to `/blog/pdf-to-word` (live check: 404, zero references). Per spec ("do not write a new article") no change was made to content.
- Delivered the built-site link-check guard instead: `scripts/check-links.mjs` (walks `.next/server/app`, resolves EN alias `/en/...` → `/...`, checks HTML hrefs + sitemap `<loc>`). Verified 2321 pages / 117,603 internal links / 2321 sitemap locs all resolve.

### T4 — Canvas text clipped in RTL — Done (`99e51dc`)
- Shared `src/lib/canvasText.mjs` (`fitText`, `drawFittedText`, `textBounds`) plus `idCardLayout.mjs` / `certificateLayout.mjs`, so Node tests exercise real exporter geometry.
- Root causes fixed: ID card RTL right-aligned at `padX` (left clipping); certificate RTL `textAlign="left"` at `x=W-130` (right clipping).
- T4b: preview name clamp + `<span dir="ltr">85.6 × 54 mm</span>`.
- `scripts/test-canvas-text.mjs` uses `@napi-rs/canvas` (transitive, no new dep). Tests run for ar/en/hi.
- Other canvas-text tools listed for later review (not fixed): Code Snippet to Image, Add Text to Image, Text to Handwriting, QR with Logo, PDF watermark, page numbers.

### T5 — CV Builder raster PDF vs ATS claims — Done (option 1 only) (`643b0bb`)
- Replaced false ATS claims with factual raster-PDF copy in `tools.cv-builder` for all 11 locales (meta description, title, FAQ).
- Option (2) (selectable text layer) was not attempted: Arabic shaping is not reliable in the current stack; reported as skipped per spec.
- Blog `cv-builder` ATS claims (all 11 locales, incl. "keeps text selectable" in en/fr/nl/de) remain — flagged as out-of-scope content follow-up.
- Verify with `pdftotext` on the exported CV (QA).

### T6 — Claims that contradict the product — Done (`afeb81a`)
- `CURRENCIES` has exactly 27 entries. Rewrote `tools.invoice-generator` desc/long/faq1a/faq2a in all 11 locales to say 27 currencies and that the saved PDF is selectable.
- `InvoiceGenerator.tsx`: `download()` (which saved an `.html` file) replaced with `printInvoice()` (hidden iframe → `print()`, "Print / Save as PDF"), keeping selectable text; HTML download retained as fallback. FAQ now says selectable. Label `printSavePdf` added (ar/es/en UI labels).
- `scripts/test-invoice.mjs` added (currency count, print flow, copy assertions).

### T7 — Untranslated UI strings + parity guard — Done (`5aa3117`)
- Added 5 keys missing from every non-English locale (`tool.readGuide`, `blog.relatedPostsTitle`, `blog.relatedPostsHint`, `blog.prevPost`, `blog.nextPost`) with machine-drafted translations.
- Translated de/nl `nav.text`, `nav.tools`, `footer.toolsCol`.
- Added `scripts/check-translations.mjs` (key parity, placeholder sets, empty values, English-equality allowlist) wired into `npm test`; verified it fails on regression then restored.
- Residual risk: many tool UI strings are still hardcoded and localized only for ar/es (letter-generator and id-card-generator use message keys; others do not). Listed as residual risk, not fixed.

### T8 — Image-to-PDF page size — Done (`08f061c`)
- `src/lib/imagePdfLayout.mjs` (`PAGE_SIZES`, `PAGE_SIZE_KEYS`, `pageSizePt`, `placeImage`, `fitPageSize`, `resolvePage`, `pxToPt`); corrected `pxToPt` = `px * 72 / 96` (old code used `margin / 2.835`, treating px as mm).
- `src/components/tools/ImagePdfOptions.tsx` shared control (fit/A4/Letter, orientation when fixed, margin 0–60).
- `JpgToPdf.tsx`, `PngToPdf.tsx`, `ImagesToPdf.tsx` rewritten to use the shared module/control. Defaults: fit + portrait + margin 0 (JPG/PNG); margin 10 (ImagesToPdf) — reproduces previous output for the default.
- 6 new `tool.*` keys × 11 locales. `scripts/test-image-pdf.mjs` added (A4/Letter dims, fit, aspect ratio, centering, overflow, `pxToPt(10)=7.5`).

### T9 — SEO metadata — Done (code) (`a06268a`)
- English descriptions enriched to 120–155 chars (95 tools/categories); other locales reported only.
- Removed the `keywords` meta tag from blog pages.
- Added `BreadcrumbList` JSON-LD to tool category pages (blog pages already had `Article` + `BreadcrumbList`).
- `scripts/seo-report.mjs` (`npm run seo:report`) writes `SEO_REPORT.md` (per-locale: desc < 70 / > 160, titles > 60, titles equal to English, duplicates). Wired as npm script, informational (does not fail the build).
- `TRANSLATION_REVIEW.md` T9 section (English-only, no new non-English strings).

### T10 — Sitemap and locale redirects — Done (`6ca67e1`)
- Sitemap: added `x-default` to `alternates.languages` for every URL.
- `routing.ts`: `localeDetection: false` — each language served only at its own prefix; no auto-redirect by Accept-Language/cookie.
- `src/components/LanguageSuggestionBanner.tsx` + added to locale layout: dismissible suggestion when browser language differs from page language (stored in `localStorage`).
- Crawlers and shared links now always receive the URL's own language.

## TRANSLATION_REVIEW.md summary

Sections appended: T2 (4 keys × 11), T5 (47 rows + blog follow-up), T6 (4 keys × 11 + UI label), T7 (5 keys × 10 + 3 changed values), T8 (6 keys × 11). T9 added English-only note. T1 added no strings. All non-English entries are marked machine-drafted and need native review.

## Needs Owner decision (not edited)

- Operator identity / legal pages (footer/blog author currently "hoursmedia"), cookie wording, consent banner wording.
- Donation and impact numbers; "written by people" claim.
- GA/AdSense consent gating: no consent mechanism exists; proposal needed (scripts, where to load, default denied) — not implemented.
- Blog `cv-builder` ATS claims in all 11 locales (including "keeps text selectable").
- Content rewrites of blog articles and tool long-form copy; native translation review.
- Search Console / Bing setup, Core Web Vitals measurement.

## Assumptions

- EN has no locale prefix; other locales are prefixed; build prerenders EN under `.next/server/app/en/...` (link checker accounts for this alias).
- `allowJs: true` lets TSX import `.mjs` modules; `tsc --noEmit` passes.
- PDF password fixtures could not be generated/tested locally (`qpdf`, `pdftotext`, `pikepdf`, `pypdf` not installed; Python 3.14.3 has no PDF libs). Commands documented for QA.
- T3 treated as not reproducible per live-site check; guard delivered instead of content change.
- T5 option (2) skipped because Arabic shaping is not reliable in the current stack.
- T7 scope limited to the 5 keys that existed only in `en.json` plus de/nl nav/footer values; broader hardcoded UI strings deferred as residual risk.
- T9 title length left as `${name} — ChooseTools` (all under 60 chars); report flags blog titles > 60 as informational.

## Final verification (post-change)

- `npx tsc --noEmit`: exit 0.
- `npm test`: exit 0, all 7 checks passed (mojibake, translations, protect-pdf, canvas-text, invoice, image-pdf, links).
- `npm run build`: exit 0, `✓ Compiled successfully in 37.5s`, 2330 static pages generated.
- `npm run seo:report`: wrote `SEO_REPORT.md`.
- `npm run check:mojibake`: passed (1111 JSON files).
- `npm run check:translations`: passed (10 locales).

## Next role: QA needs

- Files changed: see commits above; full diff on branch `audit/p0-fixes`.
- Repro before/after for each task; screenshots/fixtures for T4 (ID card + certificate, ar/en/hi) and T8 (small + 4000×3000 image, A4/Letter/fit).
- Commands to run (paste results): `npm run build`, `npm run lint` (not configured), `npm test` (7 checks), `npm run check:mojibake`, `npm run check:translations`, `npm run seo:report`, `node scripts/check-links.mjs`.
- `pdftotext` on CV Builder output; `qpdf --show-encryption` on protect-pdf outputs (no-encryption, user-password, owner-password-only fixtures).
- Verify mojibake grep on locale files; verify no `/Encrypt` in protect-pdf success outputs.
- Verify sitemap contains `xhtml:link rel="alternate" hreflang="x-default"` on every URL.
- Verify bare `/blog/<slug>` no longer redirects based on Accept-Language.


## Phase B/C/D additions (branch audit/seo-and-fixes)

### T1 (updated) — mojibake guard regex — Done
- Updated `scripts/check-mojibake.mjs` to the spec regex `[ÃÂÐÑ][\u0080-\u00BF]|â[€†‚ƒ„…‰]` (no false positives on es/pt).
- Fixed 5 remaining `â†’` arrow mojibake in `messages/en.json` (Sort Lines, CSV, metadata descriptions).
- Guard verified to fail on reintroduced mojibake.

### T11 — Clean sitemap — Done
- `src/lib/indexing.ts`: `INDEXABLE_LOCALES = ['en','ar','nl','es']`, `INDEXABLE_BLOG_SLUGS = {}` (empty).
- `app/sitemap.ts`: only indexed locales × (111 tool/static + home); no blog URLs; x-default on every entry; real lastmod.
- Expected entries: 4 × 112 ≈ 448 (down from 2,321).

### T12 — Canonical host — Partial (config outside repo)
- SITE_URL already `https://www.choosetools.com`; all metadata/JSON-LD use it.
- Host redirect (http→https, apex→www) lives in hosting dashboard — listed under Needs Owner decision.

### T17 — Blog claims, author, language mixing — Partial
- `ARTICLE_CLAIMS_REPORT.md` generated (325 flagged occurrences across 20 slugs).
- Mechanical fixes applied to all locales: "PDF.js"→"pdf-lib", "byte for byte" removed, "our tests show" removed, protect-pdf anchor corrected.
- `ARTICLE_AUTHOR = "TODO Owner"` config added; Article JSON-LD uses it.
- Empty FAQ answers are now filtered (blog + tool pages).
- Language mixing: localeDetection already false (T10); URL locale decides.
- Test for pure-locale blog pages: not added (manual verification).

### T13 — Tool-page content template — Partial
- `src/lib/toolContent.ts` with data-driven template; English content for all 20 listed tools.
- Template renders how-to, FAQs, limits, privacy, related tools (English only; drafts not shown unless SHOW_DRAFT_CONTENT=1).
- ar/nl/es drafts not yet written (pending native review).

### T14 — Dynamic related tools — Not done (P2, deferred)
### T15 — Performance lazy-loading — Not done (P2, deferred)
### T16 — docs/seo-checklist.md — Done

### Language policy
- INDEXABLE_LOCALES used by sitemap, robots meta, hreflang and the language-suggestion banner.
- Non-indexed locales: `noindex, follow` via layout robots metadata.

## Final verification (post Phase B/C/D)
- `npx tsc --noEmit`: exit 0.
- `npm test`: exit 0, all 7 checks passed.
- `npm run build`: exit 0, compiled successfully, 2330/2330 static pages generated.
- `npm run check:mojibake`: passed (1111 JSON files).
- `npm run check:translations`: passed (10 locales).
- `npm run seo:report`: wrote SEO_REPORT.md.

## Verification with real tools (T2, T5)

- Installed `qpdf 12.4.2` (winget) and `poppler 25.07.0` (pdftotext, winget). Node v20.20.2 cannot run pdfjs (needs Node >=22), so the raster-unlock path is "Not verified" in Node; the browser path is unchanged.
- T2 fixtures (`qpdf --show-encryption`):
  - plain.pdf: "File is not encrypted".
  - user-pass.pdf (AES-256, password "user"): "Incorrect password supplied" (encrypted).
  - owner-only.pdf (AES-128, empty user password): opens with empty password (owner-only).
  - `hasEncryptDictionary`: plain=false, user-pass=true, owner-only=true.
  - Unlocked plain output (pdf-lib re-save): `qpdf --show-encryption` → "File is not encrypted".
  - Encrypted inputs return failure (reason "encrypted") — never reported as success. Verified by test-protect-pdf.mjs.
- T5: pdftotext on a raster-image PDF (analogous to CvBuilder's embedPng output) yields only a form feed (1 byte) — i.e. no extractable text. CV Builder still uses raster PNG embedding (option 2 not attempted). Claims rephrased to factual raster-PDF copy.
