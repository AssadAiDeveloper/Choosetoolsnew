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