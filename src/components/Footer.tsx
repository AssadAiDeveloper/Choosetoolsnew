import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CATEGORIES, POPULAR_SLUGS, TOOLS } from "@/lib/tools";
import { Logo } from "./Logo";

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
        <p className="mx-auto max-w-6xl px-4 py-5 text-center font-mono text-[11px] tracking-wide text-gray-400 dark:text-gray-500">
          {t("madeBy")} · © {new Date().getFullYear()} ChooseTools
        </p>
      </div>
    </footer>
  );
}
