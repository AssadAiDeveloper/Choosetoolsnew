import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CATEGORIES, POPULAR_SLUGS, TOOLS } from "@/lib/tools";
import { SOCIAL_LINKS } from "@/lib/site";
import { Logo } from "./Logo";
import { LanguageLinks } from "./LanguageLinks";

const COMPANY_LINKS = ["about", "donate", "contact", "privacy", "terms"] as const;

export function Footer() {
  const t = useTranslations("footer");
  const tc = useTranslations("categories");
  const tt = useTranslations("tools");
  const tp = useTranslations("pages");

  const popular = POPULAR_SLUGS
    .map((slug) => TOOLS.find((x) => x.slug === slug))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">{t("rights")}</p>
        </div>

        <nav aria-label="tools">
          <h3 className="text-sm font-semibold text-ink">{t("toolsCol")}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <Link href={`/${c}`} className="text-ink-soft transition hover:text-brand-700">
                  {tc(`${c}.name`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="popular tools">
          <h3 className="text-sm font-semibold text-ink">{t("popularCol")}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {popular.map((tool) => (
              <li key={tool.slug}>
                <Link href={`/${tool.category}/${tool.slug}`} className="text-ink-soft transition hover:text-brand-700">
                  {tt(`${tool.slug}.name`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="company">
          <h3 className="text-sm font-semibold text-ink">{t("companyCol")}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {COMPANY_LINKS.map((page) => (
              <li key={page}>
                <Link href={`/${page}`} className="text-ink-soft transition hover:text-brand-700">
                  {tp(`${page}.title`)}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/blog" className="text-ink-soft transition hover:text-brand-700">
                {t("blog")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 px-4 py-4">
          <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer me" aria-label={t("linkedin")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-soft transition hover:border-brand-500 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
          <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer me" aria-label={t("facebook")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-soft transition hover:border-brand-500 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
        </div>
        <LanguageLinks />
        <p className="mx-auto max-w-6xl px-4 py-5 text-center font-mono text-[11px] tracking-wide text-slate-600 dark:text-slate-400">
          {t("madeBy")} · © {new Date().getFullYear()} ChooseTools
        </p>
      </div>
    </footer>
  );
}
