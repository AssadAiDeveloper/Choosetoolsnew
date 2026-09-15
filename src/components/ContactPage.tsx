import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Mail, Clock, Building2, ShieldAlert } from "lucide-react";
import { routing } from "@/i18n/routing";
import { SITE_NAME, SITE_URL } from "@/lib/tools";

export async function contactPageMetadata(locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "pages.contact" });
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return {
    title: `${t("title")} · ${SITE_NAME}`,
    description: t("metaDescription"),
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: `${SITE_URL}${prefix}/contact`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [
          l,
          `${SITE_URL}${l === routing.defaultLocale ? "" : `/${l}`}/contact`,
        ])
      ),
    },
  };
}

export async function ContactPage({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations("pages.contact");
  const mailTo = `mailto:${t("emailAddress")}`;

  const cards = [
    {
      icon: Mail,
      title: t("emailTitle"),
      desc: t("emailDesc"),
    },
    {
      icon: Clock,
      title: t("responseTitle"),
      desc: t("responseDesc"),
    },
    {
      icon: Building2,
      title: t("operatorTitle"),
      desc: t("operatorDesc"),
    },
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink">{t("title")}</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-soft">{t("intro")}</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {cards.map((card) => (
          <section
            key={card.title}
            className="rounded-2xl border border-line bg-surface p-6"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <card.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-ink">{card.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{card.desc}</p>
          </section>
        ))}
      </div>

      <a
        href={mailTo}
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        <Mail className="h-4 w-4" />
        {t("emailAddress")}
      </a>

      <section className="mt-10 flex gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <span className="mt-0.5 shrink-0 text-amber-600">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold text-amber-900">{t("filesTitle")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-amber-800">
            {t("filesDesc")}
          </p>
        </div>
      </section>
    </article>
  );
}