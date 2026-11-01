/**
 * Password-protection helpers for the "Remove PDF Password" tool.
 *
 * The bundled PDF library (pdf-lib) can read and write PDFs but cannot
 * decrypt encrypted documents. Rather than silently re-saving an encrypted
 * file (which is what the old implementation did), these helpers detect the
 * encryption and report it so the UI can show a clear error.
 */

const ENCRYPT_TOKEN = [0x2f, 0x45, 0x6e, 0x63, 0x72, 0x79, 0x70, 0x74]; // "/Encrypt"

/**
 * True when the raw PDF bytes contain an /Encrypt dictionary reference.
 * Works for both user-password and owner-password-only encryption because
 * both keep the /Encrypt entry in the trailer.
 * @param {Uint8Array} bytes
 * @returns {boolean}
 */
export function hasEncryptDictionary(bytes) {
  if (!bytes || bytes.length < ENCRYPT_TOKEN.length) return false;
  const last = bytes.length - ENCRYPT_TOKEN.length;
  outer: for (let i = 0; i <= last; i++) {
    for (let j = 0; j < ENCRYPT_TOKEN.length; j++) {
      if (bytes[i + j] !== ENCRYPT_TOKEN[j]) continue outer;
    }
    return true;
  }
  return false;
}

/**
 * Attempt to produce an unencrypted copy of the PDF.
 *
 * Returns `{ ok: true, bytes }` only when the output is guaranteed to have no
 * /Encrypt dictionary. Otherwise returns a failure reason:
 *   - "encrypted": the input is encrypted and pdf-lib cannot decrypt it
 *   - "error": the input is not a readable PDF
 *
 * @param {Uint8Array} bytes
 * @returns {Promise<{ok: true, bytes: Uint8Array} | {ok: false, reason: "encrypted" | "error"}>}
 */
export async function stripPdfPassword(bytes) {
  // Encrypted input cannot be decrypted by pdf-lib. Bail out before loading so
  // the caller always gets an explicit failure instead of a re-saved file that
  // still carries /Encrypt.
  if (hasEncryptDictionary(bytes)) return { ok: false, reason: "encrypted" };

  const { PDFDocument } = await import("pdf-lib");

  let doc;
  try {
    // Loading WITHOUT ignoreEncryption throws EncryptedPDFError on any
    // encrypted input, including owner-password-only files.
    doc = await PDFDocument.load(bytes);
  } catch (err) {
    const message = String((err && err.message) || err).toLowerCase();
    if (message.includes("encrypt")) return { ok: false, reason: "encrypted" };
    return { ok: false, reason: "error" };
  }

  const out = await doc.save();

  // Defence in depth: never hand back a file that is still encrypted.
  if (hasEncryptDictionary(out)) return { ok: false, reason: "encrypted" };

  return { ok: true, bytes: out };
}
