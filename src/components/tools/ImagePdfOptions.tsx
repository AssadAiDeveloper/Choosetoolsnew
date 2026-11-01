"use client";

import { useTranslations } from "next-intl";

export type ImagePdfPageSize = "fit" | "a4" | "letter";
export type ImagePdfOrientation = "portrait" | "landscape";

interface Props {
  pageSize: ImagePdfPageSize;
  onPageSize: (value: ImagePdfPageSize) => void;
  orientation: ImagePdfOrientation;
  onOrientation: (value: ImagePdfOrientation) => void;
  margin: number;
  onMargin: (value: number) => void;
}

/** Shared "page size / orientation / margin" controls for the image-to-PDF tools. */
export function ImagePdfOptions({
  pageSize,
  onPageSize,
  orientation,
  onOrientation,
  margin,
  onMargin,
}: Props) {
  const t = useTranslations("tool");

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="block">
        <span className="mb-1 block text-xs text-ink-soft">{t("pageSize")}</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(e.target.value as ImagePdfPageSize)}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500"
        >
          <option value="fit">{t("fitToImage")}</option>
          <option value="a4">A4</option>
          <option value="letter">Letter</option>
        </select>
      </label>

      {pageSize !== "fit" && (
        <label className="block">
          <span className="mb-1 block text-xs text-ink-soft">{t("orientation")}</span>
          <select
            value={orientation}
            onChange={(e) => onOrientation(e.target.value as ImagePdfOrientation)}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            <option value="portrait">{t("portrait")}</option>
            <option value="landscape">{t("landscape")}</option>
          </select>
        </label>
      )}

      <label className="block">
        <span className="mb-1 block text-xs text-ink-soft">{t("marginPx")}</span>
        <input
          type="number"
          min={0}
          max={60}
          value={margin}
          onChange={(e) => onMargin(Math.max(0, Math.min(60, Number(e.target.value) || 0)))}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </label>
    </div>
  );
}
