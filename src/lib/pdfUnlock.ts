/**
 * Unlocking password-protected PDFs in the browser.
 *
 * pdf-lib (the writer used by most tools) cannot decrypt PDFs. pdf.js can:
 * given the user password it decrypts the document and renders it. We render
 * each page to a canvas and rebuild an unencrypted PDF from those images, so
 * the downloaded file never carries an /Encrypt dictionary.
 *
 * Trade-off: the rebuilt copy is image-based, so its text is not selectable.
 * That is the only browser-only option with the libraries this project ships.
 */
import { hasEncryptDictionary } from "./pdfEncrypt.mjs";

export type UnlockResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; reason: "password-required" | "wrong-password" | "encrypted" | "error" };

/** Target render resolution: 150 dpi (PDF user space is 72 dpi). */
const RENDER_SCALE = 150 / 72;

/**
 * Return an unencrypted copy of `bytes`.
 *
 * - Unencrypted input is re-saved losslessly with pdf-lib.
 * - Encrypted input needs `password` for user-password PDFs; owner-password-only
 *   PDFs open with an empty password, so no prompt is needed.
 */
export async function unlockPdf(bytes: Uint8Array, password?: string): Promise<UnlockResult> {
  if (!hasEncryptDictionary(bytes)) {
    const { stripPdfPassword } = await import("./pdfEncrypt.mjs");
    return stripPdfPassword(bytes);
  }

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  // pdf.js transfers the buffer to its worker, so hand it a copy.
  const loadingTask = pdfjs.getDocument({
    data: bytes.slice(),
    ...(password ? { password } : {}),
  });

  let doc;
  try {
    doc = await loadingTask.promise;
  } catch (err) {
    const name = (err as { name?: string } | null)?.name;
    const code = (err as { code?: number } | null)?.code;
    if (name === "PasswordException") {
      // pdf.js: 1 = NEED_PASSWORD, 2 = INCORRECT_PASSWORD
      return { ok: false, reason: code === 2 ? "wrong-password" : "password-required" };
    }
    return { ok: false, reason: "error" };
  }

  try {
    const { PDFDocument } = await import("pdf-lib");
    const out = await PDFDocument.create();

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      // Scale-1 viewport carries the page size and rotation in points.
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: RENDER_SCALE });

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(viewport.width));
      canvas.height = Math.max(1, Math.round(viewport.height));
      const ctx = canvas.getContext("2d");
      if (!ctx) return { ok: false, reason: "error" };

      // White background: JPEG has no alpha, transparent areas would go black.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );
      if (!blob) return { ok: false, reason: "error" };

      const image = await out.embedJpg(new Uint8Array(await blob.arrayBuffer()));
      const outPage = out.addPage([base.width, base.height]);
      outPage.drawImage(image, { x: 0, y: 0, width: base.width, height: base.height });
    }

    const outBytes = await out.save();

    // Never hand back a file that is still encrypted.
    if (hasEncryptDictionary(outBytes)) return { ok: false, reason: "encrypted" };

    return { ok: true, bytes: outBytes };
  } catch {
    return { ok: false, reason: "error" };
  } finally {
    void loadingTask.destroy();
  }
}
