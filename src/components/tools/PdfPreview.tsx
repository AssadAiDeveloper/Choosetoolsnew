"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { canvasToBlob } from "@/lib/canvas";

const MAX_PAGES = 15;

/** Renders pages of a result PDF as thumbnail images (via pdf.js) so users can
 *  see the actual output before downloading. */
export function PdfPreview({ blob }: { blob: Blob }) {
  const t = useTranslations("tool");
  const [urls, setUrls] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [failed, setFailed] = useState(false);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
    setUrls([]);
    setTotal(0);
    setFailed(false);

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
        const doc = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise;
        setTotal(doc.numPages);
        const list: string[] = [];
        const upto = Math.min(doc.numPages, MAX_PAGES);
        for (let i = 1; i <= upto; i++) {
          const page = await doc.getPage(i);
          const viewport = page.getViewport({ scale: 0.45 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
          const b = await canvasToBlob(canvas, "image/jpeg", 0.7);
          list.push(URL.createObjectURL(b));
        }
        if (cancelled) {
          list.forEach((u) => URL.revokeObjectURL(u));
          return;
        }
        urlsRef.current = list;
        setUrls(list);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      urlsRef.current = [];
    };
  }, [blob]);

  if (failed) return null;

  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft">
        {t("preview")} · {total} {t("pages")}
      </p>
      <div className="max-h-80 overflow-auto rounded-xl border border-line bg-surface/60 p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {urls.map((u, i) => (
            <figure key={i} className="overflow-hidden rounded-lg border border-line bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt={`${t("preview")} ${i + 1}`} className="w-full object-contain" />
              <figcaption className="border-t border-line py-1 text-center font-mono text-[10px] text-ink-soft">
                {i + 1}
              </figcaption>
            </figure>
          ))}
        </div>
        {total > MAX_PAGES && (
          <p className="mt-2 text-center font-mono text-[11px] text-ink-soft">
            +{total - MAX_PAGES} {t("morePages")}
          </p>
        )}
      </div>
    </div>
  );
}