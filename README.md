# ChooseTools

Free, private, browser-based file tools — **99 tools** in **11 languages**.
Every tool runs 100% client-side: files never leave the user's device.

Live: https://choosetools.com

## Stack

- **Next.js 15** (App Router)
- **TypeScript**, **Tailwind CSS v4**, **next-intl 4**
- **11 locales**: en, ar, es, de, fr, nl, ru, hi, id, tr, pt (RTL support for ar)
- Client-side engines: `pdf-lib`, `pdfjs-dist`, `browser-image-compression`,
  `heic2any`, `qrcode`, `jszip`, `marked`, `papaparse`, `tesseract.js`, `exceljs`

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000 (en) · /ar · /de · /fr · …
```

## Production

```bash
npm run build
npm start
```

Deploys as-is on Vercel — no environment variables required (statically exported).

## Structure

```
app/[locale]/                  home, category, tool, blog + about/contact/privacy/terms/donate
src/lib/tools.ts               tool registry — add a tool here + component + messages
src/components/tools/          one component per tool (code-split via dynamic import)
src/content/blog/{lang}/       99 SEO articles per locale (11 languages)
messages/{lang}.json           all UI text, tool copy, FAQs, legal pages (11 files)
```

## Before going live

1. Set the real domain in `src/lib/tools.ts` → `SITE_URL`
2. Update the contact email in `messages/{lang}.json` → `pages.contact`
3. Set the donation URL in `src/lib/donate.ts` → `SUPPORT_URL` (Stripe link)
4. Replace `public/ads.txt` with your AdSense publisher line
5. Swap the logo if desired: edit `src/components/Logo.tsx` (self-contained)

© hoursmedia
