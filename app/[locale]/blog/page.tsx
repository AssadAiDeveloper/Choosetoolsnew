import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { ogLocale } from "@/i18n/og";
import { SITE_URL, SITE_NAME, TOOLS, iconTintClass } from "@/lib/tools";
import { listArticles, blogIndexPathFor, blogPathFor, findToolForSlug } from "@/lib/blog";
import { ToolIcon } from "@/components/ToolIcon";

interface Params {
  locale: string;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("blog");
  const langs = Object.fromEntries(routing.locales.map((l) => [l, blogIndexPathFor(l)]));
  return {
    title: `${t("metaTitle")} — ${SITE_NAME}`,
    description: t("metaDescription"),
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: blogIndexPathFor(locale),
      languages: { ...langs, "x-default": blogIndexPathFor("en") },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: t("metaTitle"),
      description: t("metaDescription"),
      locale: ogLocale(locale),
    },
    twitter: { card: "summary_large_image", site: "@choosetools", title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function BlogIndexPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("blog");
  const tc = await getTranslations("categories");
  const articles = listArticles(locale);

  const withCatNames = await Promise.all(
    articles.map(async (a) => {
      const tool = findToolForSlug(a.slug);
      const cat = tool?.category ?? "pdf";
      const catName = tc(`${cat}.name`);
      const toolName = (await getTranslations(`tools.${a.slug}`))("name");
      return { ...a, cat, catName, toolName };
    })
  );

  const grouped = new Map<string, typeof withCatNames>();
  for (const a of withCatNames) {
    const arr = grouped.get(a.cat) ?? [];
    arr.push(a);
    grouped.set(a.cat, arr);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{t("indexTitle")}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg leading-relaxed text-ink-soft">{t("indexIntro")}</p>
        <p className="mt-2 text-sm text-brand-700">
          {articles.length} {t("countArticles")}
        </p>
      </header>

      {[...grouped.entries()].map(([cat, items]) => {
        const catLabel = items[0]?.catName ?? cat;
        return (
          <section key={cat} className="mb-12">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-ink">
              <span className="h-5 w-1 rounded-full bg-brand-600" />
              {catLabel}
              <span className="text-sm font-normal text-ink-soft">({items.length})</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((a) => {
                const tool = findToolForSlug(a.slug);
                return (
                  <Link
                    key={a.slug}
                    href={blogPathFor(locale, a.slug)}
                    className="group flex flex-col rounded-card border border-line bg-surface p-5 transition hover:border-brand-400 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tool ? iconTintClass(tool) : "bg-brand-50 text-brand-600"}`}>
                        <ToolIcon icon={tool?.icon ?? "FileCog"} size={22} />
                      </span>
                      <span className="text-xs font-medium uppercase tracking-wide text-brand-700">{a.catName}</span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold leading-snug text-ink group-hover:text-brand-700">
                      {a.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">{a.description}</p>
                    <span className="mt-3 text-xs text-ink-soft">
                      {a.toolName} · {t("readingTime", { minutes: a.readingTime })}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}