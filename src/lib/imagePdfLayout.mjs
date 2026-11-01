/**
 * Shared page geometry for the image-to-PDF tools.
 *
 * Page sizes are in PDF points (1 pt = 1/72 inch). `fit` keeps the page at the
 * image size plus the requested margin; `a4` and `letter` place the image
 * centred on a fixed page without cropping or stretching it.
 */

export const PAGE_SIZES = Object.freeze({
  a4: Object.freeze([595.28, 841.89]),
  letter: Object.freeze([612, 792]),
});

export const PAGE_SIZE_KEYS = Object.freeze(["fit", "a4", "letter"]);

/**
 * @param {"a4" | "letter"} size
 * @param {"portrait" | "landscape"} [orientation]
 * @returns {[number, number]}
 */
export function pageSizePt(size, orientation = "portrait") {
  const dims = PAGE_SIZES[size];
  if (!dims) throw new Error(`unknown page size: ${size}`);
  return orientation === "landscape" ? [dims[1], dims[0]] : [dims[0], dims[1]];
}

/**
 * Centre the image inside the page, preserving its aspect ratio.
 * The result never exceeds the printable box.
 *
 * @param {number} pageW
 * @param {number} pageH
 * @param {number} imgW
 * @param {number} imgH
 * @param {number} [marginPt]
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function placeImage(pageW, pageH, imgW, imgH, marginPt = 0) {
  if (!(imgW > 0) || !(imgH > 0)) throw new Error("image dimensions must be positive");
  if (!(pageW > 0) || !(pageH > 0)) throw new Error("page dimensions must be positive");

  const margin = Math.max(0, Number(marginPt) || 0);
  const boxW = Math.max(1, pageW - margin * 2);
  const boxH = Math.max(1, pageH - margin * 2);
  const scale = Math.min(boxW / imgW, boxH / imgH);
  const width = imgW * scale;
  const height = imgH * scale;

  return {
    x: (pageW - width) / 2,
    y: (pageH - height) / 2,
    width,
    height,
  };
}

/**
 * @param {number} imgW
 * @param {number} imgH
 * @param {number} [marginPt]
 * @returns {[number, number]}
 */
export function fitPageSize(imgW, imgH, marginPt = 0) {
  const margin = Math.max(0, Number(marginPt) || 0);
  return [imgW + margin * 2, imgH + margin * 2];
}

/**
 * Resolve the page and the image rectangle for one image.
 *
 * @param {{
 *   size: "fit" | "a4" | "letter",
 *   orientation?: "portrait" | "landscape",
 *   imgW: number,
 *   imgH: number,
 *   marginPt?: number,
 * }} input
 * @returns {{ pageW: number, pageH: number, image: { x: number, y: number, width: number, height: number } }}
 */
export function resolvePage({ size, orientation = "portrait", imgW, imgH, marginPt = 0 }) {
  if (!PAGE_SIZE_KEYS.includes(size)) throw new Error(`unknown page size: ${size}`);
  const [pageW, pageH] =
    size === "fit" ? fitPageSize(imgW, imgH, marginPt) : pageSizePt(size, orientation);
  return { pageW, pageH, image: placeImage(pageW, pageH, imgW, imgH, marginPt) };
}

/** Pixels at 96 dpi -> PDF points, used by the "Margin (px)" input. */
export const pxToPt = (px) => (Math.max(0, Number(px) || 0) * 72) / 96;
