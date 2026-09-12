import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ogLocale } from "@/i18n/og";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SITE_URL } from "@/lib/tools";
import { IBM_Plex_Sans_Arabic, IBM_Plex_Mono } from "next/font/google";
import "../globals.css";

const sans = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans-loaded",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono-loaded",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

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
    title: {
      default: t("title"),
      template: `%s`,
    },
    description: t("description"),
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: locale === "en" ? "/" : `/${locale}`,
      languages: { ...pageLangs, "x-default": "/" },
    },
    openGraph: {
      type: "website",
      siteName: "ChooseTools",
      title: t("title"),
      description: t("description"),
      locale: ogLocale(locale),
    },
    twitter: {
      card: "summary",
      site: "@choosetools",
      title: t("title"),
      description: t("description"),
    },
    other: { "theme-color": "#0e8a6c" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const dir = locale === "ar" ? "rtl" : "ltr";

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ChooseTools",
    url: SITE_URL,
    inLanguage: locale,
    publisher: { "@type": "Organization", name: "hoursmedia" },
  };

  return (
    <html lang={locale} dir={dir} className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})();` }} />
      </head>
      <body className="min-h-screen flex flex-col antialiased" suppressHydrationWarning>
        <NextIntlClientProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
