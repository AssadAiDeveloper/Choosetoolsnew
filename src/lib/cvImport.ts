export interface ParsedCvData {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  cvLocation: string;
  linkedin: string;
  summary: string;
  skills: string;
  experiences: { title: string; company: string; location: string; start: string; end: string; bullets: string }[];
  education: { degree: string; school: string; start: string; end: string }[];
  languages: string[];
}

const empty: ParsedCvData = {
  fullName: "", jobTitle: "", email: "", phone: "", cvLocation: "", linkedin: "",
  summary: "", skills: "", experiences: [], education: [], languages: [],
};

function extractEmail(text: string): string {
  const m = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return m ? m[0] : "";
}

function extractPhone(text: string): string {
  const m = text.match(/(?:\+?\d{1,4}[\s\-]?)?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}/);
  return m ? m[0].trim() : "";
}

function extractLinkedin(text: string): string {
  const m = text.match(/linkedin\.com\/in\/[\w\-]+/i);
  return m ? m[0] : "";
}

function extractLocation(text: string, email: string, phone: string): string {
  let t = text;
  if (email) t = t.replace(email, " ");
  if (phone) t = t.replace(phone, " ");
  t = t.replace(/linkedin\.com\/in\/[\w\-]+/gi, " ");
  t = t.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, " ");
  const rawLines = t.split(/\n/).map((l) => l.trim()).filter(Boolean);

  const isNameLike = (line: string) => /^[A-Za-z\u0600-\u06FF'’\- ]+$/.test(line) && !/\d/.test(line) && !/[،,]/.test(line);

  // 1) Prefer a line that looks like a location: contains a comma (city, country)
  //    or location keywords in English/Arabic.
  for (const line of rawLines) {
    if (!line || line.length > 60) continue;
    if (/^\d+$/.test(line) || /[@]/.test(line)) continue;
    if (isNameLike(line) && line.split(/\s+/).length <= 2 && !/[،,]/.test(line)) continue; // could be a name
    if (/[،,،]|city|province|state|country|@/.test(line)) return line;
  }

  // 2) Fallback: scan the first 6 lines, skipping obvious name/title lines.
  for (let i = 0; i < rawLines.length && i < 6; i++) {
    const line = rawLines[i];
    if (!line || line.length > 70) continue;
    if (/^\d+$/.test(line) || /[@]/.test(line)) continue;
    if (/\d/.test(line)) continue; // leftovers of phone
    // skip pure-name lines (2-3 words, all letters, no comma) at the start
    if (isNameLike(line) && !/[،,]/.test(line) && line.split(/\s+/).length <= 3) continue;
    return line;
  }
  return "";
}

function detectSection(line: string): "summary" | "experience" | "education" | "skills" | "languages" | null {
  const l = line.toLowerCase().trim().replace(/[:\s]+$/, "");
  if (/^(summary|professional summary|career summary|about me|profile|الملخص|نبذة|الملف الشخصي)$/.test(l)) return "summary";
  if (/^(experience|work experience|employment|الخبرات|الخبرة العملية|العمال|الświadczenie)$/.test(l)) return "experience";
  if (/^(education|academic|التعليم|الدراسة|المؤهلات|Wykształcenie)$/.test(l)) return "education";
  if (/^(skills|core skills|technical skills|المهارات|الكفاءات|Compétences)$/.test(l)) return "skills";
  if (/^(languages|langues|اللغات|اللغة)$/.test(l)) return "languages";
  return null;
}

function isYear(s: string): boolean {
  return /^20\d{2}$|^19\d{2}$/.test(s.trim());
}

function isDateLine(s: string): boolean {
  return /(20\d{2}|19\d{2})\s*[-–]\s*(20\d{2}|19\d{2}|present|الآن|حالياً|current|إلى الآن|to date|till now|undetermined)/i.test(s) ||
    /^(20\d{2}|19\d{2})\s*(–|-)\s*(20\d{2}|19\d{2}|الآن|حالياً|present)/i.test(s);
}

function isBulletLine(s: string): boolean {
  return /^[•●▪◦‣\-–—*·]/.test(s);
}

function isHeaderish(s: string): boolean {
  // a short line that is not a date and not a bullet — candidate for title/company/degree
  return s.length > 0 && s.length <= 70 && !isDateLine(s);
}

function parseExperienceBlock(lines: string[]): { title: string; company: string; location: string; start: string; end: string; bullets: string }[] {
  const items: { title: string; company: string; location: string; start: string; end: string; bullets: string }[] = [];
  const clean = (s: string) => s.replace(/^[•\-\*\s]+/, "").trim();

  // current entry being assembled
  let cur: { title: string; company: string; location: string; start: string; end: string; bullets: string[] } | null = null;

  const push = () => {
    if (!cur) return;
    items.push({ title: cur.title, company: cur.company, location: cur.location, start: cur.start, end: cur.end, bullets: cur.bullets.join("\n") });
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const t = clean(raw);
    if (!t) continue;

    // 1) Date line
    if (isDateLine(t)) {
      if (!cur) cur = { title: "", company: "", location: "", start: "", end: "", bullets: [] };
      const dm = t.match(/(20\d{2}|19\d{2})\s*[-–]\s*(20\d{2}|19\d{2}|present|الآن|حالياً|current|to date|till now)/i);
      cur.start = dm ? dm[1] : "";
      cur.end = dm ? dm[2] : "";
      continue;
    }

    // 2) Explicit bullet line (check the RAW line so the marker is detected)
    if (isBulletLine(raw) || t.length > 80) {
      if (!cur) cur = { title: "", company: "", location: "", start: "", end: "", bullets: [] };
      cur.bullets.push(t);
      continue;
    }

    // 3) Short header-ish line. Decide if it starts a NEW entry:
    //    It starts a new entry if the CURRENT entry is already complete
    //    (has title + company) AND this short line is the first of a new
    //    (title, company) pair — i.e. the following non-empty line is also short.
    let nextIsShort = false;
    for (let j = i + 1; j < lines.length; j++) {
      const nRaw = lines[j];
      const n = clean(nRaw);
      if (!n) continue;
      if (isBulletLine(nRaw)) break;   // next is a bullet => t is a bullet too
      if (isDateLine(n)) { nextIsShort = false; break; } // next is a date => t existing header
      nextIsShort = n.length <= 80;    // next is a short line => header pair
      break;
    }

    const curComplete = cur && cur.title && cur.company;

    // New entry header
    if (curComplete && nextIsShort) {
      push();
      cur = { title: t, company: "", location: "", start: "", end: "", bullets: [] };
      continue;
    }

    if (!cur) {
      cur = { title: "", company: "", location: "", start: "", end: "", bullets: [] };
    }

    if (!cur.title) {
      cur.title = t;
    } else if (!cur.company) {
      cur.company = t;
    } else if (!cur.location && (/[،,]/.test(t))) {
      cur.location = t;
    } else {
      // already title+company and not a new header => treat as bullet/continuation
      cur.bullets.push(t);
    }
  }

  push();
  return items;
}

function parseEducationBlock(lines: string[]): { degree: string; school: string; start: string; end: string }[] {
  const items: { degree: string; school: string; start: string; end: string }[] = [];
  let current: { degree: string; school: string; start: string; end: string } | null = null;
  let pending: string[] = [];

  const flushPending = () => {
    if (pending.length === 0) return;
    if (!current) current = { degree: "", school: "", start: "", end: "" };
    if (!current.degree || current.degree === " ") current.degree = pending.shift()!;
    if (pending.length && !current.school) current.school = pending.shift()!;
    for (const extra of pending) { /* ignore extra short lines */ }
    pending = [];
  };
  const pushCurrent = () => {
    if (current) items.push({ ...current });
    current = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.replace(/^[•\-\*\s]+/, "").trim();
    if (!trimmed || isBulletLine(raw)) continue;

    const dm = trimmed.match(/(20\d{2}|19\d{2})\s*[-–]\s*(20\d{2}|19\d{2})/);
    if (dm) {
      flushPending();
      // If we already have a degree+school in progress, attach the date to it.
      if (current && current.degree && current.degree !== " " && !current.start) {
        current.start = dm[1];
        current.end = dm[2];
        continue;
      }
      if (current) pushCurrent();
      current = { degree: trimmed.replace(/\d{4}\s*[-–]\s*\d{4}/g, "").trim() || " ", school: "", start: dm[1], end: dm[2] };
      continue;
    }

    // A short line. If current entry already fully formed (degree + school), it's a new entry.
    if (current && current.degree && current.school && (current.start || current.school)) {
      pushCurrent();
      current = { degree: trimmed, school: "", start: "", end: "" };
      continue;
    }
    if (!current) {
      current = { degree: trimmed, school: "", start: "", end: "" };
    } else if (!current.degree || current.degree === " ") {
      current.degree = trimmed;
    } else if (!current.school) {
      current.school = trimmed;
    } else {
      current.degree = (current.degree || "") + " " + trimmed;
    }
  }

  flushPending();
  pushCurrent();
  return items;
}

export function parseCvText(text: string): ParsedCvData {
  const result = { ...empty };
  if (!text.trim()) return result;

  result.email = extractEmail(text);
  result.phone = extractPhone(text);
  result.linkedin = extractLinkedin(text);
  result.cvLocation = extractLocation(text, result.email, result.phone);

  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const sectionLines: { idx: number; section: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const s = detectSection(lines[i]);
    if (s) sectionLines.push({ idx: i, section: s });
  }

  if (sectionLines.length > 0) {
    const nameEnd = sectionLines[0].idx;
    const headerLines = lines.slice(0, nameEnd);
    if (headerLines.length >= 1) result.fullName = headerLines[0].replace(/[|•\-]/g, "").trim();
    if (headerLines.length >= 2) result.jobTitle = headerLines.slice(1).find((h) => h.length < 80) || "";
  } else {
    if (lines.length >= 1) result.fullName = lines[0].replace(/[|•\-]/g, "").trim();
    if (lines.length >= 2) result.jobTitle = lines[1].replace(/[|•\-]/g, "").trim();
  }

  for (let i = 0; i < sectionLines.length; i++) {
    const { section, idx } = sectionLines[i];
    const nextIdx = i + 1 < sectionLines.length ? sectionLines[i + 1].idx : lines.length;
    const content = lines.slice(idx + 1, nextIdx);

    switch (section) {
      case "summary": result.summary = content.join(" ").trim(); break;
      case "experience": result.experiences = parseExperienceBlock(content); break;
      case "education": result.education = parseEducationBlock(content); break;
      case "skills": result.skills = content.join(", ").replace(/^[•\-\*\s,]+/, "").trim(); break;
      case "languages":
        result.languages = content
          .flatMap((l) => l.split(/[,•|]/))
          .map((l) => l.replace(/^[•\-\*\s]+/, "").trim())
          .filter(Boolean);
        break;
    }
  }

  return result;
}

export async function extractImageFromFile(file: File): Promise<HTMLCanvasElement> {
  if (file.type === "application/pdf") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfjsLib: any = await import("pdfjs-dist");
    const version = pdfjsLib.version || "4.0.395";
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
    const data = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const page = await pdf.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const maxDim = 2200;
    const scale = Math.min(2, maxDim / Math.max(baseViewport.width, baseViewport.height));
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport } as never).promise;
    return canvas;
  }
    const img = new Image();
    const url = URL.createObjectURL(file);
    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = url;
      });
      const maxDim = 2200;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      w = Math.round(w * scale);
      h = Math.round(h * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      return canvas;
    } finally {
      URL.revokeObjectURL(url);
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let workerInstance: any = null;

export async function ocrCanvas(
  canvas: HTMLCanvasElement,
  lang = "eng+ara",
  onProgress?: (progress: number, status: string) => void,
): Promise<string> {
  const opts = {
    logger: (m: { status: string; progress?: number }) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round((m.progress || 0) * 100), "OCR");
      } else if (onProgress) {
        onProgress(0, m.status || "");
      }
    },
  };
  if (!workerInstance) {
    const { createWorker } = await import("tesseract.js");
    workerInstance = await createWorker(lang, 1, opts);
  }
  const w = workerInstance!;
  await w.setParameters({ tessedit_languages: lang });
  if (onProgress) onProgress(0, "OCR");
  const { data } = await w.recognize(canvas);
  return data.text;
}

export async function importCvFile(
  file: File,
  lang?: string,
  onProgress?: (progress: number, status: string) => void,
): Promise<ParsedCvData> {
  const languages = lang || (file.name.match(/[\u0600-\u06FF]/) || true ? "eng+ara" : "eng");
  if (onProgress) onProgress(0, "loading");
  const canvas = await extractImageFromFile(file);
  if (onProgress) onProgress(5, "ocr");
  const text = await ocrCanvas(canvas, languages, onProgress);
  if (onProgress) onProgress(100, "done");
  return parseCvText(text);
}

export async function terminateOcr(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
  }
}
