"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("pages.error");
  const tb = useTranslations("pages.notFound");

  useEffect(() => {
    console.error("Unhandled page error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-ink">{t("title")}</h1>
      <p className="mt-2 text-ink-soft">{t("desc")}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-700"
        >
          {t("retry")}
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-5 py-2.5 font-semibold text-ink transition hover:border-brand-500"
        >
          {tb("cta")}
        </Link>
      </div>
    </main>
  );
}