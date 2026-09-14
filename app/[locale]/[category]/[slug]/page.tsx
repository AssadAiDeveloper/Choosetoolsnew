import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { ogLocale } from "@/i18n/og";
import { TOOLS, findTool, toolsByCategory, iconTintClass, SITE_URL, SITE_NAME } from "@/lib/tools";
import { TOOL_COMPONENTS } from "@/components/tools";
import { ToolIcon } from "@/components/ToolIcon";

interface Params {
  locale: string;
  category: string;
  slug: string;
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    TOOLS.map((t) => ({ locale, category: t.category, slug: t.slug }))
  );
}

function pathFor(locale: string, category: string, slug: string) {
  const p = `/${category}/${slug}`;
  return locale === "en" ? p : `/${locale}${p}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, category, slug } = await params;
  const tool = findTool(category, slug);
  if (!tool) return {};
  const t = await getTranslations({ locale, namespace: `tools.${slug}` });
  const langs = Object.fromEntries(
    routing.locales.map((l) => [l, pathFor(l, category, slug)])
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
      canonical: pathFor(locale, category, slug),
      languages: { ...langs, "x-default": pathFor("en", category, slug) },
    },
  };
}

export default async function ToolPage({ params }: { params: Promise<Params> }) {
  const { locale, category, slug } = await params;
  setRequestLocale(locale);

  const tool = findTool(category, slug);
  if (!tool) notFound();

  const t = await getTranslations(`tools.${slug}`);
  const tt = await getTranslations("tool");
  const tb = await getTranslations("breadcrumb");
  const tc = await getTranslations("categories");
  const Component = TOOL_COMPONENTS[tool.component];

  const related = toolsByCategory(tool.category).filter((x) => x.slug !== slug).slice(0, 4);
  const relatedNames = await Promise.all(
    related.map(async (r) => ({
      ...r,
      name: (await getTranslations(`tools.${r.slug}`))("name"),
    }))
  );

  const faqs = [
    { q: t("faq1q"), a: t("faq1a") },
    { q: t("faq2q"), a: t("faq2a") },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: t("name"),
      description: t("desc"),
      url: SITE_URL + pathFor(locale, category, slug),
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: tb("home"), item: SITE_URL + (locale === "en" ? "/" : `/${locale}`) },
        { "@type": "ListItem", position: 2, name: tc(`${tool.category}.name`), item: SITE_URL + (locale === "en" ? "" : `/${locale}`) + `/${tool.category}` },
        { "@type": "ListItem", position: 3, name: t("name"), item: SITE_URL + pathFor(locale, category, slug) },
      ],
    },
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
        <Link href="/" className="transition hover:text-brand-700">{tb("home")}</Link>
        <span aria-hidden className="select-none">/</span>
        <Link href={`/${tool.category}`} className="transition hover:text-brand-700">{tc(`${tool.category}.name`)}</Link>
        <span aria-hidden className="select-none">/</span>
        <span className="font-medium text-ink">{t("name")}</span>
      </nav>

      <header className="mb-8 text-center">
        <span
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${iconTintClass(tool)}`}
        >
          <ToolIcon icon={tool.icon} size={30} />
        </span>
        <h1 className="text-3xl font-bold tracking-tight">{t("name")}</h1>
        <p className="mx-auto mt-2 max-w-xl text-slate-600">{t("desc")}</p>
      </header>

      <Component />

      <section className="mt-14">
        <p className="leading-relaxed text-ink-soft">{t("long")}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">{tt("faqTitle")}</h2>
        <div className="mt-4 space-y-4">
          {faqs.map((f, i) => (
            <details
              key={i}
              className="group rounded-card border border-slate-300 bg-surface p-5 open:border-emerald-500 open:bg-emerald-50/20 transition-colors duration-200"
              open={i === 0}
            >
              <summary className="cursor-pointer font-semibold text-slate-800 marker:text-emerald-600">{f.q}</summary>
              <p className="mt-2 leading-relaxed text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {relatedNames.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">{tt("relatedTitle")}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {relatedNames.map((r) => (
              <Link
                key={r.slug}
                href={`/${r.category}/${r.slug}`}
                className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium transition hover:border-brand-500 hover:text-brand-700"
              >
                {r.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
