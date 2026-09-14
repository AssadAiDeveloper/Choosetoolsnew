import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { ogLocale } from "@/i18n/og";
import { SITE_URL, SITE_NAME, iconTintClass } from "@/lib/tools";
import {
  getArticle,
  blogPathFor,
  blogIndexPathFor,
  toolPathFor,
  relatedTools,
  lastModified,
  blogSlugs,
  findToolForSlug,
} from "@/lib/blog";
import { ToolIcon } from "@/components/ToolIcon";

interface Params {
  locale: string;
  slug: string;
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    blogSlugs(locale).map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = getArticle(locale, slug);
  if (!article) return {};
  const programTitle = article.title.replace(/`/g, "");
  const langs = Object.fromEntries(
    routing.locales.map((l) => [l, blogPathFor(l, slug)])
  );
  return {
    title: `${programTitle} — ${SITE_NAME}`,
    description: article.description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: blogPathFor(locale, slug),
      languages: { ...langs, "x-default": blogPathFor("en", slug) },
    },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title: programTitle,
      description: article.description,
      locale: ogLocale(locale),
      publishedTime: lastModified(),
      modifiedTime: lastModified(),
    },
    twitter: {
      card: "summary_large_image",
      site: "@choosetools",
      title: programTitle,
      description: article.description,
      images: [`${SITE_URL}${locale === "en" ? "" : `/${locale}`}/opengraph-image.png`],
    },
    keywords: article.keywords,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const article = getArticle(locale, slug);
  if (!article) notFound();

  const tool = findToolForSlug(article.slug);
  if (!tool) notFound();

  const t = await getTranslations("blog");
  const tb = await getTranslations("breadcrumb");
  const tc = await getTranslations("categories");
  const tt = await getTranslations(`tools.${slug}`);

  const related = relatedTools(slug, 3);
  const relatedNames = await Promise.all(
    related.map(async (r) => ({
      ...r,
      name: (await getTranslations(`tools.${r.slug}`))("name"),
      toolName: (await getTranslations(`tools.${r.slug}`))("name"),
    }))
  );

  const toolUrl = SITE_URL + toolPathFor(locale, tool.category, tool.slug);
  const blogUrl = SITE_URL + blogPathFor(locale, slug);

  const renderLinked = (text: string) => renderInlineTokens(text, locale);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.description,
      url: blogUrl,
      image: `${SITE_URL}/icon-512.png`,
      datePublished: lastModified(),
      dateModified: lastModified(),
      author: { "@type": "Organization", name: "hoursmedia" },
      publisher: { "@type": "Organization", name: SITE_NAME },
      mainEntityOfPage: blogUrl,
      keywords: article.keywords.slice(0, 5),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: article.faqs.map((f) => ({
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
        { "@type": "ListItem", position: 2, name: t("indexTitle"), item: SITE_URL + blogIndexPathFor(locale) },
        { "@type": "ListItem", position: 3, name: article.title, item: blogUrl },
      ],
    },
  ];

  const sectionIds = article.sections.map((_, i) => `section-${i}`);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
        <Link href="/" className="transition hover:text-brand-700">{tb("home")}</Link>
        <span aria-hidden className="select-none">/</span>
        <Link href="/blog" className="transition hover:text-brand-700">{t("indexTitle")}</Link>
        <span aria-hidden className="select-none">/</span>
        <span className="font-medium text-ink">{article.title}</span>
      </nav>

      <header className="mb-8">
        <div className="flex items-center gap-3">
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconTintClass(tool)}`}>
            <ToolIcon icon={tool.icon} size={26} />
          </span>
          <div>
            <Link href={`/${tool.category}/${tool.slug}`} className="text-sm font-semibold text-brand-700 transition hover:text-brand-800">
              {tt("name")} → {t("openTool")}
            </Link>
            <p className="text-xs text-ink-soft">
              {t("readingTime", { minutes: article.readingTime })} · {t("lastUpdated")} · {tc(`${tool.category}.name`)}
            </p>
          </div>
        </div>

        <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink">{article.title}</h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-soft">{article.description}</p>
      </header>

      {/* Table of contents */}
      <nav aria-label="table of contents" className="mb-8 rounded-card border border-line bg-surface p-5">
        <p className="text-sm font-semibold text-ink">{t("tocTitle")}</p>
        <ol className="mt-2 space-y-1.5 text-sm">
          {article.sections.map((s, i) => (
            <li key={i}>
              <a href={`#${sectionIds[i]}`} className="text-brand-700 transition hover:underline">
                {i + 1}. {s.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* Article body */}
      <div className="space-y-8 text-[17px] leading-relaxed text-ink">
        {article.sections.map((s, i) => (
          <section key={i} id={sectionIds[i]} className="scroll-mt-24">
            <h2 className="mb-3 text-xl font-bold tracking-tight text-ink">{s.heading}</h2>
            {s.paragraphs.map((p, j) => (
              <p key={j} className="mt-3">
                {renderLinked(p)}
              </p>
            ))}
          </section>
        ))}
      </div>

      {/* CTA to the tool */}
      <div className="mt-10 rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center">
        <p className="font-semibold text-brand-800">{t("ctaTitle", { name: tt("name") })}</p>
        <Link
          href={`/${tool.category}/${tool.slug}`}
          className="mt-3 inline-block rounded-xl bg-brand-600 px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          {tt("name")} → {t("openTool")}
        </Link>
        <p className="mt-2 text-xs text-brand-700/70">{t("privacyNote")}</p>
      </div>

      {/* FAQ */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-ink">{t("faqTitle")}</h2>
        <div className="mt-4 space-y-3">
          {article.faqs.map((f, i) => (
            <details
              key={i}
              className="group rounded-card border border-line bg-surface p-5 transition-colors duration-200 open:border-brand-400"
              open={i === 0}
            >
              <summary className="cursor-pointer font-semibold text-ink marker:text-brand-600">{f.q}</summary>
              <div className="mt-2 flex flex-col gap-2">
                {splitParagraphs(f.a).map((line, j) => (
                  <p key={j} className="leading-relaxed text-ink-soft">{renderLinked(line)}</p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Related tools (internal links) */}
      {relatedNames.length > 0 && (
        <nav aria-label="related tools" className="mt-10">
          <h2 className="text-xl font-bold text-ink">{t("relatedTitle")}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {relatedNames.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/${r.category}/${r.slug}`}
                  className="group flex h-full flex-col rounded-card border border-line bg-surface p-4 transition hover:border-brand-400 hover:shadow-sm"
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconTintClass(r)}`}>
                    <ToolIcon icon={r.icon} size={20} />
                  </span>
                  <span className="mt-2 text-sm font-semibold text-ink group-hover:text-brand-700">{r.toolName}</span>
                  <span className="mt-1 text-xs text-ink-soft">{t("relatedHint")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Back to blog */}
      <div className="mt-10 border-t border-line pt-6 text-center">
        <Link href="/blog" className="text-sm font-medium text-brand-700 transition hover:underline">
          ← {t("backToBlog")}
        </Link>
      </div>
    </article>
  );
}

/**
 * Renders + internal links inside authored copy using the token syntax
 * `[slug:anchor text]`. Everything else is plain text.
 */
function renderInlineTokens(text: string, locale: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /\[([a-z0-9-]+):([^\]]+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const slug = m[1];
    const anchor = m[2];
    const tool = findToolForSlug(slug);
    const href = tool ? `/${tool.category}/${slug}` : `/blog/${slug}`;
    parts.push(
      <Link key={key++} href={href} className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 transition hover:text-brand-800">
        {anchor}
      </Link>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

function splitParagraphs(text: string): string[] {
  return text.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
}