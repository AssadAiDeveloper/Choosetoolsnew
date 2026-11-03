import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SITE_URL, SITE_NAME } from "@/lib/tools";
import { ARTICLE_AUTHOR, lastModified } from "@/lib/blog";

export interface GuideBlock {
  type: "heading" | "paragraph" | "orderedList" | "unorderedList" | "callout" | "image" | "faq";
  level?: 2 | 3;
  text?: string;
  items?: string[];
  variant?: "note" | "warning";
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  caption?: string;
  faqItems?: { q: string; a: string }[];
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  readingTime: number;
  author: string;
  datePublished: string;
  dateModified: string;
  draft: boolean;
  blocks: GuideBlock[];
}

const GUIDES_ROOT = "src/content/guides";

function guidesDir(locale: string): string {
  return join(process.cwd(), GUIDES_ROOT, locale);
}

export function guideSlugs(locale: string): string[] {
  const dir = guidesDir(locale);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

export function hasGuide(locale: string, slug: string): boolean {
  return existsSync(join(guidesDir(locale), `${slug}.json`));
}

export function getGuide(locale: string, slug: string): Guide | null {
  const file = join(guidesDir(locale), `${slug}.json`);
  if (!existsSync(file)) return null;
  try {
    const raw = JSON.parse(readFileSync(file, "utf8"));
    return { author: ARTICLE_AUTHOR, ...raw } as Guide;
  } catch {
    return null;
  }
}

export function isDraft(guide: Guide | null): boolean {
  return !!guide?.draft;
}

export function isProduction(): boolean {
  if (process.env.VERCEL_ENV === "production") return true;
  if (process.env.VERCEL_ENV === "preview") return false;
  // local production build (next build/start) without Vercel: treat as production
  return process.env.NODE_ENV === "production";
}

// A guide renders only if the file exists for the locale AND (not draft OR not production).
export function guideAvailable(locale: string, slug: string): boolean {
  const g = getGuide(locale, slug);
  if (!g) return false;
  if (g.draft && isProduction()) return false;
  return true;
}

export function listGuides(locale: string): Guide[] {
  return guideSlugs(locale)
    .map((s) => getGuide(locale, s))
    .filter((g): g is Guide => !!g)
    .filter((g) => !(g.draft && isProduction()));
}
