import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { SITE_NAME, SITE_URL } from "@/lib/tools";

type PageSlug = "about" | "contact" | "privacy" | "terms";

export function staticPageParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function staticPageMetadata(
  locale: string,
  page: PageSlug
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "pages" });
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const body = t.raw(`${page}.body`) as string[];
  return {
    title: `${t(`${page}.title`)} · ${SITE_NAME}`,
    description: body[0]?.slice(0, 160),
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: `${SITE_URL}${prefix}/${page}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [
          l,
          `${SITE_URL}${l === routing.defaultLocale ? "" : `/${l}`}/${page}`,
        ])
      ),
    },
  };
}

export async function StaticPage({ locale, page }: { locale: string; page: PageSlug }) {
  setRequestLocale(locale);
  const t = await getTranslations("pages");
  const body = t.raw(`${page}.body`) as string[];

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink">{t(`${page}.title`)}</h1>
      <div className="mt-6 space-y-4">
        {body.map((paragraph, i) => (
          <p key={i} className="leading-relaxed text-ink-soft">{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
