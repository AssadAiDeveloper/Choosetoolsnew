import type { MetadataRoute } from "next";
import { TOOLS, CATEGORIES, SITE_URL } from "@/lib/tools";
import { routing } from "@/i18n/routing";
import { blogSlugs } from "@/lib/blog";

function url(locale: string, path: string) {
  const prefix = locale === "en" ? "" : `/${locale}`;
  return `${SITE_URL}${prefix}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const blogPaths = [
    "/blog",
    ...blogSlugs("en").map((s) => `/blog/${s}`),
  ];
  const paths = [
    "",
    ...CATEGORIES.map((c) => `/${c}`),
    ...TOOLS.map((t) => `/${t.category}/${t.slug}`),
    ...blogPaths,
    "/about",
    "/contact",
    "/privacy",
    "/terms",
  ];
  for (const path of paths) {
    for (const locale of routing.locales) {
      entries.push({
        url: url(locale, path),
        changeFrequency: "monthly",
        priority: path === "" ? 1 : path.split("/").length === 2 ? 0.7 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, url(l, path)])
          ),
        },
      });
    }
  }
  return entries;
}
