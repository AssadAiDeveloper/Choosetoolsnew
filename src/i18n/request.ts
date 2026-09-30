import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import en from "../../messages/en.json";

/** Deep-merge `over` onto `base`, returning a new object. Arrays are replaced
 *  wholesale rather than merged element-wise, so a translated list is never
 *  padded out with the English one. Used to make English the fallback for any
 *  key a translation has not defined yet. */
function withFallback(
  base: Record<string, unknown>,
  over: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(over)) {
    const b = base[key];
    out[key] =
      value && typeof value === "object" && !Array.isArray(value) && b && typeof b === "object" && !Array.isArray(b)
        ? withFallback(b as Record<string, unknown>, value as Record<string, unknown>)
        : value;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = (await import(`../../messages/${locale}.json`)).default as Record<
    string,
    unknown
  >;

  return {
    locale,
    // Without this, any key a translation has not caught up with renders as its
    // raw dotted path ("pdfToExcel.rows") in the UI instead of text.
    messages: locale === routing.defaultLocale ? messages : withFallback(en, messages),
  };
});
