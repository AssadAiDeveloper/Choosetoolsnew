import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar", "es", "nl", "fr", "de", "ru", "hi", "id", "tr", "pt"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  // Serve each language only at its own prefix. Do not redirect based on the
  // visitor's Accept-Language / saved locale (audit T10): crawlers and shared
  // links must always get the URL's own language.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
