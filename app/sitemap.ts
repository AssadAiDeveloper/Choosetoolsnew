import type { MetadataRoute } from "next";
import { TOOLS, CATEGORIES, SITE_URL } from "@/lib/tools";
import { INDEXABLE_LOCALES, INDEXABLE_BLOG_SLUGS } from "@/lib/indexing";
import { lastModified } from "@/lib/blog";

function url(locale: string, path: string) {
  const prefix = locale === "en" ? "" : `/${locale}`;
  return `${SITE_URL}${prefix}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const modified = new Date(lastModified());

  const paths = [
    "",
    ...CATEGORIES.map((c) => `/${c}`),
    ...TOOLS.map((t) => `/${t.category}/${t.slug}`),
    "/about",
    "/donate",
    "/contact",
    "/privacy",
    "/terms",
  ];

  // Blog URLs are included only for slugs listed in INDEXABLE_BLOG_SLUGS.
  const blogSlugSet = new Set<string>();
  for (const locale of INDEXABLE_LOCALES) {
    for (const slug of INDEXABLE_BLOG_SLUGS[locale] || []) {
      blogSlugSet.add(slug);
    }
  }
  const blogPaths = [...blogSlugSet].map((s) => `/blog/${s}`);

  const allPaths = [...paths, ...blogPaths];

  for (const path of allPaths) {
    for (const locale of INDEXABLE_LOCALES) {
      entries.push({
        url: url(locale, path),
        lastModified: modified,
        changeFrequency: "monthly",
        priority: path === "" ? 1 : path.split("/").length === 2 ? 0.7 : 0.8,
        alternates: {
          languages: Object.fromEntries([
            ...INDEXABLE_LOCALES.map((l) => [l, url(l, path)]),
            ["x-default", url("en", path)],
          ]),
        },
      });
    }
  }
  return entries;
}
