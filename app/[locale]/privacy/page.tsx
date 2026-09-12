import { StaticPage, staticPageMetadata, staticPageParams } from "@/components/StaticPage";

export const generateStaticParams = staticPageParams;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return staticPageMetadata(locale, "privacy");
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <StaticPage locale={locale} page="privacy" />;
}
