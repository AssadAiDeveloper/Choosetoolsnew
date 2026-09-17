import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("pages.notFound");

  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-mono text-7xl font-bold text-brand-600" aria-hidden>
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold text-ink">{t("title")}</h1>
      <p className="mt-2 text-ink-soft">{t("desc")}</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-700"
      >
        {t("cta")}
      </Link>
    </main>
  );
}