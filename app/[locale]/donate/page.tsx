import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { SITE_NAME, SITE_URL } from "@/lib/tools";
import { DONATE_ORGS, SUPPORT_URL } from "@/lib/donate";

type Cause = keyof typeof DONATE_ORGS;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.donate" });
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return {
    title: t("title"),
    description: t("intro.0"),
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: `${SITE_URL}${prefix}/donate`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [
          l,
          `${SITE_URL}${l === routing.defaultLocale ? "" : `/${l}`}/donate`,
        ])
      ),
    },
  };
}

export default async function DonatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.donate");
  const causes: Cause[] = ["trees", "water", "orphans"];
  const intro = t.raw("intro") as string[];
  const supportUrl = SUPPORT_URL || undefined;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink">{t("title")}</h1>
      <div className="mt-6 space-y-4">
        {intro.map((paragraph, i) => (
          <p key={i} className="leading-relaxed text-ink-soft">{paragraph}</p>
        ))}
      </div>

      <p className="mt-6 rounded-lg border border-line bg-surface p-4 text-sm leading-relaxed text-ink-soft">
        {t("trustNote")}
      </p>

      <div className="mt-10 space-y-8">
        {causes.map((cause) => (
          <section key={cause}>
            <h2 className="text-xl font-semibold text-ink">{t(`causes.${cause}.title`)}</h2>
            <p className="mt-2 leading-relaxed text-ink-soft">{t(`causes.${cause}.desc`)}</p>
            <ul className="mt-4 space-y-3">
              {DONATE_ORGS[cause].map((org) => (
                <li
                  key={org.key}
                  className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface p-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{t(`orgs.${org.key}.name`)}</p>
                    <p className="mt-0.5 text-sm text-ink-soft">{t(`orgs.${org.key}.desc`)}</p>
                  </div>
                  <a
                    href={org.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    {t("donateBtn")}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-12 rounded-lg border border-line bg-surface p-6">
        <h2 className="text-xl font-semibold text-ink">{t("support.title")}</h2>
        <p className="mt-2 leading-relaxed text-ink-soft">{t("support.desc")}</p>
        {supportUrl ? (
          <>
            <a
              href={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {t("support.btn")}
            </a>
            <p className="mt-2 text-xs text-ink-soft">{t("support.via")}</p>
          </>
        ) : null}
      </section>
    </article>
  );
}