import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { ogImage, ogImageUrl, ogLocale } from "@/i18n/og";
import { SITE_URL, SITE_NAME } from "@/lib/tools";
import { getGuide, guideAvailable, guideSlugs } from "@/lib/guides";
import { InlineText } from "@/components/InlineText";
import { INDEXABLE_LOCALES, isIndexableBlogSlug, isIndexableLocale } from "@/lib/indexing";
import { blogPathFor } from "@/lib/blog";

interface Params { locale: string; slug: string }

export function generateStaticParams() {
  const locales = routing.locales;
  const params: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    for (const slug of guideSlugs(locale)) {
      const g = getGuide(locale, slug);
      if (!g) continue;
      if (g.draft && process.env.VERCEL_ENV === "production") continue;
      params.push({ locale, slug });
    }
  }
  return params;
}

function guidePathFor(locale: string, slug: string) {
  const p = `/guides/${slug}`;
  return locale === "en" ? p : `/${locale}${p}`;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const guide = getGuide(locale, slug);
  if (!guide || !guideAvailable(locale, slug)) return {};
  const indexable = isIndexableLocale(locale) && isIndexableBlogSlug(locale, slug) && !guide.draft;
  const langs = Object.fromEntries(
    INDEXABLE_LOCALES.filter((l) => getGuide(l, slug) && guideAvailable(l, slug)).map((l) => [l, guidePathFor(l, slug)])
  );
  return {
    title: `${guide.title} — ${SITE_NAME}`,
    description: guide.description,
    metadataBase: new URL(SITE_URL),
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    alternates: indexable
      ? { canonical: guidePathFor(locale, slug), languages: { ...langs, "x-default": guidePathFor("en", slug) } }
      : { canonical: guidePathFor(locale, slug) },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title: guide.title,
      description: guide.description,
      locale: ogLocale(locale),
      url: guidePathFor(locale, slug),
      publishedTime: guide.datePublished,
      modifiedTime: guide.dateModified,
      images: [ogImage(locale, guide.title)],
    },
    twitter: {
      card: "summary_large_image",
      site: "@choosetools",
      title: guide.title,
      description: guide.description,
      images: [ogImageUrl(locale)],
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const guide = getGuide(locale, slug);
  if (!guide || !guideAvailable(locale, slug)) notFound();

  const t = await getTranslations("blog");
  const tb = await getTranslations("breadcrumb");

  const indexable = isIndexableLocale(locale) && isIndexableBlogSlug(locale, slug) && !guide.draft;

  const faqBlock = guide.blocks.find((b) => b.type === "faq");
  const faqItems = faqBlock?.faqItems || [];

  const jsonLd: any[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      url: SITE_URL + guidePathFor(locale, slug),
      datePublished: guide.datePublished,
      dateModified: guide.dateModified,
      author: { "@type": "Person", name: guide.author },
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      inLanguage: locale,
      keywords: guide.keywords,
    },
  ];
  if (faqItems.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
  jsonLd.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tb("home"), item: SITE_URL + (locale === "en" ? "/" : `/${locale}`) },
      { "@type": "ListItem", position: 2, name: "Guides", item: SITE_URL + (locale === "en" ? "/guides" : `/${locale}/guides`) },
      { "@type": "ListItem", position: 3, name: guide.title, item: SITE_URL + guidePathFor(locale, slug) },
    ],
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
        <Link href="/" className="transition hover:text-brand-700">{tb("home")}</Link>
        <span aria-hidden className="select-none">/</span>
        <span className="font-medium text-ink">{guide.title}</span>
      </nav>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-ink">{guide.title}</h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-soft">{guide.description}</p>
        <p className="mt-2 text-xs text-ink-soft">
          {guide.author} · {guide.datePublished} · {guide.readingTime} min read
        </p>
      </header>
      <div className="space-y-6 text-[17px] leading-relaxed text-ink">
        {guide.blocks.map((block, i) => {
          if (block.type === "heading") {
            const Tag = block.level === 3 ? "h3" : "h2";
            return <Tag key={i} className="mt-6 text-xl font-bold tracking-tight text-ink">{block.text}</Tag>;
          }
          if (block.type === "paragraph") {
            return <p key={i} className="mt-3"><InlineText text={block.text || ""} locale={locale} /></p>;
          }
          if (block.type === "orderedList") {
            return (
              <ol key={i} className="mt-3 list-decimal space-y-1 ps-5">
                {(block.items || []).map((it, j) => <li key={j}><InlineText text={it} locale={locale} /></li>)}
              </ol>
            );
          }
          if (block.type === "unorderedList") {
            return (
              <ul key={i} className="mt-3 list-disc space-y-1 ps-5">
                {(block.items || []).map((it, j) => <li key={j}><InlineText text={it} locale={locale} /></li>)}
              </ul>
            );
          }
          if (block.type === "callout") {
            const cls = block.variant === "warning" ? "border-amber-300 bg-amber-50 text-amber-900" : "border-brand-200 bg-brand-50 text-brand-900";
            return <div key={i} className={`mt-4 rounded-card border p-4 text-sm ${cls}`}><InlineText text={block.text || ""} locale={locale} /></div>;
          }
          if (block.type === "image") {
            return (
              <figure key={i} className="mt-4">
                <img src={block.src} alt={block.alt || ""} width={block.width || 1} height={block.height || 1} loading="lazy" style={{ maxWidth: "100%", height: "auto" }} className="rounded-card border border-line" />
                {block.caption && <figcaption className="mt-1 text-xs text-ink-soft"><InlineText text={block.caption} locale={locale} /></figcaption>}
              </figure>
            );
          }
          if (block.type === "faq") {
            return (
              <section key={i} className="mt-6">
                <h2 className="text-xl font-bold text-ink">FAQ</h2>
                <div className="mt-3 space-y-3">
                  {(block.faqItems || []).filter((f) => f.a?.trim()).map((f, j) => (
                    <details key={j} className="group rounded-card border border-line bg-surface p-4">
                      <summary className="cursor-pointer font-semibold text-ink"><InlineText text={f.q} locale={locale} /></summary>
                      <p className="mt-2 text-ink-soft"><InlineText text={f.a} locale={locale} /></p>
                    </details>
                  ))}
                </div>
              </section>
            );
          }
          return null;
        })}
      </div>
    </article>
  );
}
