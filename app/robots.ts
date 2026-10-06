import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/tools";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // App Router fetches a page's RSC payload as `?_rsc=...`. Those are the
      // same page twice, so letting them be crawled splits a page's signals
      // across duplicate URLs. `_rsc` always follows `?`, and `*` matches any
      // run of characters, so this covers `/en/about?_rsc=abc`.
      disallow: ["/*_rsc=*"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
