import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { ogLocale } from "@/i18n/og";
import { CATEGORIES, toolsByCategory, CATEGORY_COLOR, iconTintClass, SITE_NAME, SITE_URL, type Category } from "@/lib/tools";
import { ToolIcon } from "@/components/ToolIcon";

interface Params { locale: string; category: string }

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    CATEGORIES.map((category) => ({ locale, category }))
  );
}

function pathFor(locale: string, category: string) {
  const p = `/${category}`;
  return locale === "en" ? p : `/${locale}${p}`;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, category } = await params;
  if (!CATEGORIES.includes(category as Category)) return {};
  const t = await getTranslations({ locale, namespace: `categories.${category}` });
  const langs = Object.fromEntries(
    routing.locales.map((l) => [l, pathFor(l, category)])
  );
  return {
    title: `${t("name")} — ${SITE_NAME}`,
    description: t("desc"),
    metadataBase: new URL(SITE_URL),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: t("name"),
      description: t("desc"),
      locale: ogLocale(locale),
    },
    twitter: {
      card: "summary_large_image",
      site: "@choosetools",
      title: t("name"),
      description: t("desc"),
      images: [`${SITE_URL}${locale === "en" ? "" : `/${locale}`}/opengraph-image.png`],
    },
    alternates: {
      canonical: pathFor(locale, category),
      languages: { ...langs, "x-default": pathFor("en", category) },
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { locale, category } = await params;
  setRequestLocale(locale);
  if (!CATEGORIES.includes(category as Category)) notFound();

  const cat = category as Category;
  const t = await getTranslations(`categories.${cat}`);
  const tp = await getTranslations("privacy");
  const tools = toolsByCategory(cat);
  const color = CATEGORY_COLOR[cat];

  const items = await Promise.all(
    tools.map(async (tool) => {
      const tt = await getTranslations(`tools.${tool.slug}`);
      return { ...tool, name: tt("name"), desc: tt("desc") };
    })
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="h-7 w-1.5 rounded-full" style={{ background: color }} />
          <h1 className="text-3xl font-bold tracking-tight">{t("name")}</h1>
        </div>
        <p className="mt-2 text-ink-soft">{t("desc")}</p>
        <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3.5 py-1.5 font-mono text-[11px] text-brand-700">
          <span className="privacy-dot inline-block h-1.5 w-1.5 rounded-full bg-brand-500" />
          {tp("badge")}
        </span>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((tool) => (
          <Link key={tool.slug} href={`/${tool.category}/${tool.slug}`}
            className="group flex items-start gap-3.5 rounded-card border border-slate-400 bg-surface p-4 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:border-brand-500 hover:shadow-md dark:border-slate-600 dark:hover:border-brand-500 dark:hover:shadow-black/40">
            <span className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconTintClass(tool)}`}>
              <ToolIcon icon={tool.icon} />
            </span>
            <span>
              <span className="block font-semibold text-start group-hover:text-brand-700">{tool.name}</span>
              <span className="mt-0.5 block text-sm leading-snug text-start text-ink-soft">{tool.desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
