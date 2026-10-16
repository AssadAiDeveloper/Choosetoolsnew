import { SITE_URL } from "@/lib/tools";

export const OG_LOCALES: Record<string, string> = {
  en: "en_US",
  ar: "ar_AR",
  es: "es_ES",
  nl: "nl_NL",
  fr: "fr_FR",
  de: "de_DE",
  ru: "ru_RU",
  hi: "hi_IN",
  id: "id_ID",
  tr: "tr_TR",
  pt: "pt_PT",
};

export function ogLocale(locale: string): string {
  return OG_LOCALES[locale] ?? "en_US";
}

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export function ogImageUrl(locale: string): string {
  return `${SITE_URL}/${locale}/opengraph-image.png`;
}

export function ogImage(locale: string, alt: string) {
  return {
    url: ogImageUrl(locale),
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt,
  };
}
