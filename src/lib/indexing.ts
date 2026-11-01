/**
 * Indexing policy (audit T11/T12).
 *
 * Only these locales are indexed, appear in the sitemap and in hreflang
 * alternates. Other locales keep working for users (noindex, follow) but are
 * excluded from indexing until native review. Edit this one line to add a locale.
 */
export const INDEXABLE_LOCALES = ["en", "ar", "nl", "es"] as const;
export type IndexableLocale = (typeof INDEXABLE_LOCALES)[number];

/**
 * Allow-list of blog article slugs that are indexable, per locale.
 * Empty for now: all existing templated blog articles are noindex, follow and
 * out of the sitemap until rewritten (Owner decision 1 Nov 2026).
 */
export const INDEXABLE_BLOG_SLUGS: Record<string, string[]> = {
  en: [],
  ar: [],
  nl: [],
  es: [],
};

export function isIndexableLocale(locale: string): locale is IndexableLocale {
  return (INDEXABLE_LOCALES as readonly string[]).includes(locale);
}

export function isIndexableBlogSlug(locale: string, slug: string): boolean {
  return (INDEXABLE_BLOG_SLUGS[locale] || []).includes(slug);
}
