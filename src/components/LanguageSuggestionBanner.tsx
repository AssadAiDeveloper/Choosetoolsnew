"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";

const STORAGE_KEY = "ct-lang-banner-dismissed";

function preferredLocale(): string | null {
  if (typeof navigator === "undefined") return null;
  const candidates = (navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language]
  ).map((l) => l.toLowerCase().split("-")[0]);
  for (const c of candidates) {
    if ((routing.locales as readonly string[]).includes(c)) return c;
  }
  return null;
}

function withLocale(pathname: string, locale: string): string {
  // Strip any existing locale prefix, then add the target one (en has no prefix).
  const stripped = pathname.replace(/^\/(ar|es|nl|fr|de|ru|hi|id|tr|pt)(?=\/|$)/, "");
  const base = stripped === "" ? "/" : stripped;
  return locale === "en" ? base : `/${locale}${base === "/" ? "" : base}`;
}

/**
 * Dismissible suggestion shown when the visitor's browser language differs from
 * the language of the page they are viewing. Replaces the old auto-redirect so
 * that crawlers and shared links always receive the URL's own language.
 */
export function LanguageSuggestionBanner() {
  const current = useLocale();
  const pathname = usePathname() || "/";
  const [suggested, setSuggested] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") {
        setDismissed(true);
        return;
      }
    } catch {
      // ignore
    }
    const pref = preferredLocale();
    if (pref && pref !== current) setSuggested(pref);
  }, [current]);

  if (dismissed || !suggested) return null;

  const href = withLocale(pathname, suggested);

  return (
    <div
      role="status"
      className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-brand-200 bg-brand-50 px-4 py-2 text-sm text-brand-800"
    >
      <span>
        This page is in {current.toUpperCase()}. View it in {suggested.toUpperCase()}?
      </span>
      <span className="flex items-center gap-3">
        <a href={href} className="font-semibold underline">
          Switch
        </a>
        <button
          type="button"
          onClick={() => {
            try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
            setDismissed(true);
          }}
          className="text-brand-700 hover:text-brand-900"
          aria-label="Dismiss language suggestion"
        >
          ✕
        </button>
      </span>
    </div>
  );
}
