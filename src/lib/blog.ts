import fs from "node:fs";
import path from "node:path";
import { TOOLS, findTool } from "./tools";

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
export function getArticle(locale: string, slug: string): BlogArticle | null {
  const candidates =
    locale === "en" ? [locale] : [locale, "en"];
  for (const l of candidates) {
    try {
      const raw = fs.readFileSync(articlePath(l, slug), "utf8");
      const article = JSON.parse(raw) as BlogArticle;
      if (article && article.slug) return article;
    } catch {
      // missing or not yet translated — try next candidate
    }
  }
  return null;
}

/** List every article that exists for a locale (falling back to English). */
export function listArticles(locale: string): BlogArticle[] {
  const articles: BlogArticle[] = [];
  for (const tool of TOOLS) {
    const article = getArticle(locale, tool.slug);
    if (article) articles.push(article);
  }
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