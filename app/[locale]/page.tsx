import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { TreePine, Droplets, HandHeart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Hero } from "@/components/Hero";
import { HomeToolGrid } from "@/components/HomeToolGrid";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/tools";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const pageLangs = Object.fromEntries(
    routing.locales.map((l) => [l, l === "en" ? "/" : `/${l}`])
  );
  return {
    title: t("title"),
    description: t("description"),
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: locale === "en" ? "/" : `/${locale}`,
      languages: { ...pageLangs, "x-default": "/" },
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations("home");
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Hero />

      <section className="mt-16" aria-label={t("impactTitle")}>
        <h2 className="text-center text-xl font-bold tracking-tight text-ink">{t("impactTitle")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {(["1", "2", "3"] as const).map((n) => (
            <div key={n} className="rounded-card border border-line bg-surface p-3 text-center">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                {n === "1" && <TreeIcon />}
                {n === "2" && <DropletIcon />}
                {n === "3" && <HandHeartIcon />}
              </span>
              <p className="mt-2 font-mono text-lg font-bold leading-none tracking-tight text-brand-600">
                {t(`impact${n}n`)}
                <span className="ms-1 block text-[11px] font-semibold text-ink">{t(`impact${n}u`)}</span>
              </p>
              <h3 className="mt-1.5 text-[13px] font-semibold text-ink">{t(`impact${n}t`)}</h3>
              <p className="mt-1 text-xs leading-snug text-ink-soft">{t(`impact${n}d`)}</p>
              <Link
                href="/donate"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
              >
                {t("impactCta")}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12">
        <HomeToolGrid />
      </div>

      <section className="mt-20">
        <h2 className="text-center text-2xl font-bold tracking-tight text-ink">{t("whyTitle")}</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {(["1", "2", "3"] as const).map((n) => (
            <div key={n} className="rounded-card border border-line bg-surface p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                {n === "1" && <ShieldIcon />}
                {n === "2" && <InfinityIcon />}
                {n === "3" && <BoltIcon />}
              </span>
              <h3 className="mt-4 font-semibold text-brand-700">{t(`why${n}t`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t(`why${n}d`)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TreeIcon() {
  return <TreePine className="h-4 w-4" />;
}

function DropletIcon() {
  return <Droplets className="h-4 w-4" />;
}

function HandHeartIcon() {
  return <HandHeart className="h-4 w-4" />;
}

function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3l9 3v6c0 5.5-4 9-9 11-5-2-9-5.5-9-11V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function InfinityIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 12c0-1.7.8-3 3-3s3 1.3 3 3 1.3 3 3 3 3-1.7 3-3-1.3-3-3-3-3 1.3-3 3-1.3 3-3 3-3-1.3-3-3z" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}
