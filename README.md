# ChooseTools

Free, private, browser-based file tools — **86 tools** in English, Arabic and Spanish.
Every tool runs 100% client-side: files never leave the user's device.

## Stack

- **Next.js 15** (App Router, fully static output — ~290 SSG pages)
- **TypeScript**, **Tailwind CSS v4**, **next-intl 4** (en / ar / es, RTL support)
- Client-side engines: `pdf-lib`, `pdfjs-dist`, `browser-image-compression`,
  `heic2any`, `qrcode`, `jszip`, `marked`, `papaparse`

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000 (en) · /ar · /es
```

## Production

```bash
npm run build
npm start
```

Deploys as-is on Vercel — no environment variables required.

## Before going live

1. Set the real domain in `src/lib/tools.ts` → `SITE_URL`
2. Update the contact email in `messages/{en,ar,es}.json` → `pages.contact`
3. Replace `public/ads.txt` with your AdSense publisher line
4. Swap the logo if desired: edit `src/components/Logo.tsx` (self-contained)

## Structure

```
app/[locale]/                  home, category, tool + about/contact/privacy/terms
src/lib/tools.ts               tool registry — add a tool here + component + messages
src/components/tools/          one component per tool (code-split via dynamic import)
messages/{en,ar,es}.json       all UI text, tool copy, FAQs, legal pages
```

© hoursmedia
