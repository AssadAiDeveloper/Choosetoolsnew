"use client";

import { useTranslations } from "next-intl";

export function Processing() {
  const t = useTranslations("tool");
  return (
    <div className="flex items-center justify-center gap-3 rounded-card border border-line bg-surface p-10">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      <span className="font-medium text-ink-soft">{t("processing")}</span>
    </div>
  );
}

export function ErrorBox({ onReset }: { onReset: () => void }) {
  const t = useTranslations("tool");
  return (
    <div className="rounded-card border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-red-700">{t("error")}</p>
      <button onClick={onReset} className="mt-4 rounded-lg border border-red-200 bg-surface px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
        {t("reset")}
      </button>
    </div>
  );
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-40 ${props.className ?? ""}`}
    />
  );
}

export function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-xl border border-line bg-surface px-5 py-3 font-medium text-ink transition hover:border-brand-500 hover:text-brand-700 ${props.className ?? ""}`}
    />
  );
}

export function ResultCard({
  children,
  onReset,
}: {
  children: React.ReactNode;
  onReset: () => void;
}) {
  const t = useTranslations("tool");
  return (
    <div className="rounded-card border border-brand-100 bg-brand-50/60 p-8 text-center">
      {children}
      <div className="mt-5">
        <button onClick={onReset} className="text-sm font-medium text-ink-soft underline hover:text-brand-700">
          {t("reset")}
        </button>
      </div>
    </div>
  );
}
