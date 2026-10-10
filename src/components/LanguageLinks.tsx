"use client";

import { useLocale } from "next-intl";
import { usePathname, getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  ar: "العربية",
  es: "Español",
  nl: "Nederlands",
  fr: "Français",
  de: "Deutsch",
  ru: "Русский",
  hi: "हिन्दी",
  id: "Bahasa Indonesia",
  tr: "Türkçe",
  pt: "Português",
};

// Sitewide, always-in-DOM language links so crawlers can reach every localized
// version of the current page (the header switcher is JS-only). hreflang on the
// anchors mirrors the head alternates.
export function LanguageLinks() {
  const pathname = usePathname();
  const current = useLocale();
  return (
    <nav
      aria-label="languages"
      className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 pb-2 text-xs"
    >
      {routing.locales.map((l) => (
        <a
          key={l}
          href={getPathname({ href: pathname, locale: l })}
          hrefLang={l}
          aria-current={l === current ? "true" : undefined}
          className={
            l === current
              ? "font-semibold text-brand-700"
              : "text-ink-soft transition hover:text-brand-700"
          }
        >
          {LOCALE_LABELS[l]}
        </a>
      ))}
    </nav>
  );
}