import { inflateSync } from "node:zlib";
import { readFileSync } from "node:fs";

export function decodePdfStreams(pdfBytes) {
  const text = Buffer.from(pdfBytes).toString("latin1");
  const streams = [];
  // find all stream...endstream
  const re = /stream\r?\n([\s\S]*?)endstream/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const raw = m[1];
    // try inflate
    let decoded = null;
    try { decoded = inflateSync(Buffer.from(raw, "binary")).toString("latin1"); } catch { decoded = raw; }
    streams.push(decoded);
  }
  return streams;
}

export function parseToUnicode(streams) {
  const map = new Map();
  for (const s of streams) {
    if (!s.includes("beginbfchar") && !s.includes("beginbfrange")) continue;
    // bfchar blocks
    const bfcharBlocks = s.matchAll(/beginbfchar([\s\S]*?)endbfchar/g);
    for (const block of bfcharBlocks) {
      for (const m of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
        const src = parseInt(m[1], 16);
        const dst = m[2];
        let str = "";
        for (let i = 0; i < dst.length; i += 4) {
          str += String.fromCharCode(parseInt(dst.slice(i, i + 4), 16));
        }
        map.set(src, str);
      }
    }
    // bfrange blocks
    const bfrangeBlocks = s.matchAll(/beginbfrange([\s\S]*?)endbfrange/g);
    for (const block of bfrangeBlocks) {
      for (const m of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
        const start = parseInt(m[1], 16);
        const end = parseInt(m[2], 16);
        const dstStart = parseInt(m[3], 16);
        for (let i = start; i <= end; i++) {
          map.set(i, String.fromCharCode(dstStart + (i - start)));
        }
      }
    }
  }
  return map;
}

export function extractTextFromStreams(streams, toUnicodeMap) {
  let out = "";
  for (const s of streams) {
    if (!s.includes("Tj") && !s.includes("TJ")) continue;
    // find hex strings in Tj/TJ: <....> Tj or <....> TJ
    const tjRe = /<([0-9A-Fa-f]+)>\s*Tj/g;
    let m;
    while ((m = tjRe.exec(s)) !== null) {
      const hex = m[1];
      for (let i = 0; i < hex.length; i += 4) {
        const gid = parseInt(hex.slice(i, i + 4), 16);
        out += toUnicodeMap.get(gid) || "";
      }
      out += " ";
    }
    // TJ arrays: [(<hex>) ...] TJ
    const tjArrRe = /\[([^\]]*)\]\s*TJ/g;
    while ((m = tjArrRe.exec(s)) !== null) {
      const arr = m[1];
      for (const hm of arr.matchAll(/<([0-9A-Fa-f]+)>/g)) {
        const hex = hm[1];
        for (let i = 0; i < hex.length; i += 4) {
          const gid = parseInt(hex.slice(i, i + 4), 16);
          out += toUnicodeMap.get(gid) || "";
        }
      }
      out += " ";
    }
  }
  return out;
}
