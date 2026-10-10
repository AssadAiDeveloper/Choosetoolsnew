import fs from "node:fs";
import path from "node:path";
import { TOOLS, findTool, type Category } from "./tools";

export interface BlogSection {
  heading: string;
  paragraphs: string[];
}

export interface BlogFaq {
  q: string;
  a: string;
}

export interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  readingTime: number;
  sections: BlogSection[];
  faqs: BlogFaq[];
}

const CONTENT_DIR = path.join(process.cwd(), "src/content/blog");

function articlePath(locale: string, slug: string): string {
  return path.join(CONTENT_DIR, locale, `${slug}.json`);
}

/** Load one article. Falls back to English when the requested locale is not translated yet. */
const CACHE = process.env.NODE_ENV === "production";
const articleCache = new Map<string, BlogArticle | null>();
export function getArticle(locale: string, slug: string): BlogArticle | null {
  const key = `${locale}:${slug}`;
  if (CACHE) {
    const cached = articleCache.get(key);
    if (cached !== undefined) return cached;
  }

  const candidates = locale === "en" ? [locale] : [locale, "en"];
  let result: BlogArticle | null = null;
  for (const l of candidates) {
    try {
      const raw = fs.readFileSync(articlePath(l, slug), "utf8");
      const article = JSON.parse(raw) as BlogArticle;
      if (article && article.slug) { result = article; break; }
    } catch {
      // missing or not yet translated — try next candidate
    }
  }
  if (CACHE) articleCache.set(key, result);
  return result;
}

/** List every article that exists for a locale (falling back to English). */
const listCache = new Map<string, BlogArticle[]>();
export function listArticles(locale: string): BlogArticle[] {
  if (CACHE) {
    const cached = listCache.get(locale);
    if (cached) return cached;
  }
  const articles: BlogArticle[] = [];
  for (const tool of TOOLS) {
    const article = getArticle(locale, tool.slug);
    if (article) articles.push(article);
  }
  if (CACHE) listCache.set(locale, articles);
  return articles;
}

/** Every tool that has an article available in any locale (English is the seed content). */
export function blogSlugs(locale: string): string[] {
  return listArticles(locale).map((a) => a.slug);
}

export function blogIndexPathFor(locale: string): string {
  return locale === "en" ? "/blog" : `/${locale}/blog`;
}

export function blogPathFor(locale: string, slug: string): string {
  const p = `/blog/${slug}`;
  return locale === "en" ? p : `/${locale}${p}`;
}

export function toolPathFor(locale: string, category: string, slug: string): string {
  const p = `/${category}/${slug}`;
  return locale === "en" ? p : `/${locale}${p}`;
}

/** Related tools from the same category (for internal linking inside an article). */
export function relatedTools(slug: string, count = 3) {
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) return [];
  return TOOLS.filter((t) => t.category === tool.category && t.slug !== slug).slice(0, count);
}

export interface PostRef {
  slug: string;
  title: string;
  description: string;
  category: Category;
}

function toPostRef(article: BlogArticle): PostRef | null {
  const tool = findToolForSlug(article.slug);
  if (!tool) return null;
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    category: tool.category,
  };
}

/**
 * Sibling guides in the same category that actually have an article — the
 * reciprocal half of the tool<->guide cluster so every post gains inbound
 * links beyond the blog index.
 */
export function relatedPosts(locale: string, slug: string, count = 3): PostRef[] {
  const tool = findToolForSlug(slug);
  if (!tool) return [];
  const out: PostRef[] = [];
  for (const t of TOOLS) {
    if (t.slug === slug || t.category !== tool.category) continue;
    const article = getArticle(locale, t.slug);
    if (!article) continue;
    const ref = toPostRef(article);
    if (ref) out.push(ref);
    if (out.length >= count) break;
  }
  return out;
}

/** Previous / next guide in publication order (TOOLS order) for sequential linking. */
export function postNeighbors(
  locale: string,
  slug: string,
): { prev: PostRef | null; next: PostRef | null } {
  const posts = listArticles(locale);
  const idx = posts.findIndex((a) => a.slug === slug);
  if (idx < 0) return { prev: null, next: null };
  return {
    prev: idx > 0 ? toPostRef(posts[idx - 1]) : null,
    next: idx < posts.length - 1 ? toPostRef(posts[idx + 1]) : null,
  };
}

/** True when a guide exists for this tool slug in the given locale (or English fallback). */
export function hasArticle(locale: string, slug: string): boolean {
  return getArticle(locale, slug) !== null;
}

export function lastModified(): string {
  return "2026-09-01";
}

/** Readable keyword columns for authoring convenience (kept here for tool authors). */
export const SEARCH_INTENT_TEMPLATES = {
  howTo: ["how to", "guide", "step by step"],
  utility: ["free online", "without watermark", "no sign up", "no upload", "in your browser"],
  compare: ["vs", "alternative to", "best", "free vs paid"],
} as const;

export function findToolForSlug(slug: string) {
  return TOOLS.find((t) => t.slug === slug);
}

export function toolCategory(tool: { category: string }): string {
  return tool.category;
}

export { findTool };