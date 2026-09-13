"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Processing, PrimaryButton, ResultCard, ErrorBox } from "../ToolShell";
import { downloadBlob } from "@/lib/download";
import { buildResumeHtml } from "./cvHtml";
import { importCvFile, terminateOcr } from "@/lib/cvImport";

interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  start: string;
  end: string;
  bullets: string;
}
interface Education {
  id: string;
  degree: string;
  school: string;
  start: string;
  end: string;
}
interface LangEntry {
  id: string;
  name: string;
  level: string;
}

type Template = "classic" | "modern" | "minimal";

const ACCENTS = ["#0e8a6c", "#1a5276", "#7b2d8b", "#b5533c", "#2b6cb0", "#22543d", "#7c2d12"];

const shade = (hex: string, percent: number): string => {
  const n = hex.replace("#", "");
  const full = n.length === 3 ? n.split("").map((c) => c + c).join("") : n;
  const num = parseInt(full, 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return `rgb(${r}, ${g}, ${b})`;
};

const newExp = (): Experience => ({
  id: crypto.randomUUID(), title: "", company: "", location: "", start: "", end: "", bullets: "",
});
const newEdu = (): Education => ({
  id: crypto.randomUUID(), degree: "", school: "", start: "", end: "",
});
const newLang = (): LangEntry => ({ id: crypto.randomUUID(), name: "", level: "" });

// A4 canvas at ~200dpi so Arabic text is shaped correctly by the browser.
const W = 1654, H = 2339, MARGIN = 110, MAX_Y = H - 130;
const RIBBON = 560;
const SIDE = 540;

export default function CvBuilder() {
  const t = useTranslations("tool");
  const cv = useTranslations("cv");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cvLocation, setCvLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [summary, setSummary] = useState("");
  const [experiences, setExperiences] = useState<Experience[]>([newExp()]);
  const [education, setEducation] = useState<Education[]>([newEdu()]);
  const [skills, setSkills] = useState("");
  const [languages, setLanguages] = useState<LangEntry[]>([]);
  const [stage, setStage] = useState<"edit" | "busy" | "done" | "error">("edit");
  const [out, setOut] = useState<Blob | null>(null);

  const [avatar, setAvatar] = useState("");
  const [withPhoto, setWithPhoto] = useState(false);
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [template, setTemplate] = useState<Template>("classic");
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);

  const onPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onImportCv = async (file: File) => {
    setImporting(true);
    setImportProgress(0);
    setImportError(null);
    try {
      const data = await importCvFile(file, undefined, (p) => setImportProgress(p));
      setFullName(data.fullName);
      setJobTitle(data.jobTitle);
      setEmail(data.email);
      setPhone(data.phone);
      setCvLocation(data.cvLocation);
      setLinkedin(data.linkedin);
      setSummary(data.summary);
      setSkills(data.skills);
      if (data.experiences.length > 0) {
        setExperiences(data.experiences.map((e) => ({
          id: crypto.randomUUID(), title: e.title, company: e.company,
          location: e.location, start: e.start, end: e.end, bullets: e.bullets,
        })));
      }
      if (data.education.length > 0) {
        setEducation(data.education.map((e) => ({
          id: crypto.randomUUID(), degree: e.degree, school: e.school,
          start: e.start, end: e.end,
        })));
      }
      if (data.languages.length > 0) {
        setLanguages(data.languages.map((l) => ({
          id: crypto.randomUUID(), name: l, level: "",
        })));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("CV import failed:", msg);
      setImportError(msg);
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);
  const langList = languages.filter((l) => l.name).map((l) => `${l.name} (${l.level || ""})`.trim());
  const contactParts = [email, phone, cvLocation, linkedin].filter((x) => x.trim()).map((x) => x.trim());

  const makeCanvas = () => {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    return { c, ctx: c.getContext("2d")! };
  };

  const toPdf = async (pages: Blob[]) => {
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.create();
    for (const pageBlob of pages) {
      const png = await doc.embedPng(await pageBlob.arrayBuffer());
      const page = doc.addPage([595.28, 841.89]);
      page.drawImage(png, { x: 0, y: 0, width: 595.28, height: 841.89 });
    }
    return doc.save();
  };

  const loadAvatar = (): Promise<HTMLImageElement | null> =>
    new Promise((resolve) => {
      const img = new Image();
      if (!avatar) return resolve(null);
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = avatar;
    });

  // ---- shared body renderer for classic & minimal (linear flow) ----
  const renderLinear = async (): Promise<Blob[]> => {
    const startAlign: CanvasTextAlign = isRtl ? "right" : "left";
    const x0: number = isRtl ? W - MARGIN : MARGIN;
    const contentW = W - MARGIN * 2;
    const minimal = template === "minimal";

    const pages: Blob[] = [];
    let canvas = makeCanvas().c;
    let ctx = canvas.getContext("2d")!;
    ctx.direction = isRtl ? "rtl" : "ltr";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    let y = MARGIN;

    const newPage = async () => {
      const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res!(b!), "image/png"));
      pages.push(blob);
      canvas = makeCanvas().c;
      ctx = canvas.getContext("2d")!;
      ctx.direction = isRtl ? "rtl" : "ltr";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
      y = MARGIN;
    };

    const ensureSpace = async (needed: number) => {
      if (y + needed > MAX_Y) await newPage();
    };

    const sectionHeading = async (text: string) => {
      await ensureSpace(70);
      ctx.textAlign = startAlign;
      ctx.font = "bold 34px system-ui, sans-serif";
      ctx.fillStyle = accent;
      ctx.fillText(text, x0, y);
      y += 14;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(isRtl ? x0 - contentW : x0 + contentW, y);
      ctx.stroke();
      y += 40;
    };

    const wrapText = (text: string, maxWidth: number, font: string) => {
      ctx.font = font;
      const lines: string[] = [];
      for (const paragraph of text.split("\n")) {
        const words = paragraph.split(" ");
        let line = "";
        for (const word of words) {
          const test = line ? line + " " + word : word;
          if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = word;
          } else {
            line = test;
          }
        }
        lines.push(line);
      }
      return lines;
    };

    // ---- header ----
    const img = await loadAvatar();
    if (minimal) {
      // minimalist centered header
      const avR = 100;
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(W / 2, MARGIN + avR, avR, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - side) / 2;
        const sy = (img.naturalHeight - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, W / 2 - avR, MARGIN, avR * 2, avR * 2);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(W / 2, MARGIN + avR, avR, 0, Math.PI * 2);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 6;
        ctx.stroke();
      }
      y = MARGIN + (img ? avR * 2 + 56 : 100);
      ctx.textAlign = "center";
      ctx.fillStyle = "#111827";
      ctx.font = "bold 60px system-ui, sans-serif";
      ctx.fillText(fullName || "—", W / 2, y);
      y += 48;
      ctx.font = "34px system-ui, sans-serif";
      ctx.fillStyle = accent;
      ctx.fillText(jobTitle, W / 2, y);
      y += 40;
      ctx.font = "24px system-ui, sans-serif";
      ctx.fillStyle = "#6b7280";
      ctx.fillText(contactParts.join("   •   "), W / 2, y);
      y += 26;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 90, y);
      ctx.lineTo(W / 2 + 90, y);
      ctx.stroke();
      y += 50;
    } else {
      // classic: centered avatar with name/title/contact centered below it
      const avR = 105;
      const centerX = W / 2;
      const topY = MARGIN + 30;
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, topY + avR, avR, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        const s = Math.min(img.naturalWidth, img.naturalHeight);
        ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, centerX - avR, topY, avR * 2, avR * 2);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(centerX, topY + avR, avR, 0, Math.PI * 2);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 8;
        ctx.stroke();
      }
      y = topY + (img ? avR * 2 + 40 : 100);
      ctx.textAlign = "center";
      ctx.fillStyle = "#111827";
      ctx.font = "bold 58px system-ui, sans-serif";
      for (const line of wrapText(fullName || "—", contentW * 0.9, "bold 58px system-ui, sans-serif")) {
        ctx.fillText(line, centerX, y);
        y += 62;
      }
      ctx.font = "32px system-ui, sans-serif";
      ctx.fillStyle = accent;
      ctx.fillText(jobTitle, centerX, y);
      y += 46;
      ctx.font = "24px system-ui, sans-serif";
      ctx.fillStyle = "#6b7280";
      ctx.fillText(contactParts.join("   •   "), centerX, y);
      y += 40;
      const headerBottom = y + 10;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(centerX - 60, headerBottom);
      ctx.lineTo(centerX + 60, headerBottom);
      ctx.stroke();
      y = headerBottom + 50;
    }

    // ---- summary ----
    if (summary.trim()) {
      await sectionHeading(cv("summary"));
      ctx.fillStyle = "#374151";
      for (const line of wrapText(summary.trim(), contentW, "26px system-ui, sans-serif")) {
        await ensureSpace(38);
        ctx.fillText(line, x0, y);
        y += 38;
      }
      y += 20;
    }

    // Draw a title + date on one line without overlap (like flexbox space-between).
    // If the title is too long it wraps to its own lines below, date staying flush.
    const drawHeadLine = async (title: string, date: string) => {
      ctx.textAlign = startAlign;
      ctx.font = "bold 28px system-ui, sans-serif";
      ctx.fillStyle = "#111827";
      const dateWidth = date ? ctx.measureText(date).width : 0;
      const gap = 60;
      const titleMax = contentW - dateWidth - gap;
      const titleLines = wrapText(title, Math.max(titleMax, contentW * 0.4), "bold 28px system-ui, sans-serif");
      for (const tl of titleLines) {
        await ensureSpace(40);
        ctx.font = "bold 28px system-ui, sans-serif";
        ctx.fillStyle = "#111827";
        ctx.fillText(tl, x0, y);
        y += 38;
      }
      if (date) {
        ctx.textAlign = isRtl ? "left" : "right";
        ctx.font = "24px system-ui, sans-serif";
        ctx.fillStyle = "#6b7280";
        ctx.fillText(date, isRtl ? x0 - contentW : x0 + contentW, y - 38 + 30);
      }
    };

    // ---- experience ----
    if (experiences.some((e) => e.title || e.company)) {
      await sectionHeading(cv("experience"));
      for (const exp of experiences) {
        if (!exp.title && !exp.company) continue;
        await ensureSpace(90);
        const dateRange = [exp.start, exp.end || cv("present")].filter(Boolean).join(" – ");
        drawHeadLine(exp.title, dateRange);
        ctx.textAlign = startAlign;
        ctx.font = "italic 26px system-ui, sans-serif";
        ctx.fillStyle = accent;
        ctx.fillText([exp.company, exp.location].filter(Boolean).join(", "), x0, y);
        y += 38;
        ctx.font = "25px system-ui, sans-serif";
        ctx.fillStyle = "#374151";
        for (const bullet of exp.bullets.split("\n").filter(Boolean)) {
          for (const line of wrapText("•  " + bullet, contentW - 20, "25px system-ui, sans-serif")) {
            await ensureSpace(36);
            ctx.fillText(line, x0, y);
            y += 36;
          }
        }
        y += 24;
      }
    }

    // ---- education ----
    if (education.some((e) => e.degree || e.school)) {
      await sectionHeading(cv("education"));
      for (const edu of education) {
        if (!edu.degree && !edu.school) continue;
        await ensureSpace(70);
        const eduDate = [edu.start, edu.end].filter(Boolean).join(" – ");
        drawHeadLine(edu.degree, eduDate);
        ctx.textAlign = startAlign;
        ctx.font = "26px system-ui, sans-serif";
        ctx.fillStyle = accent;
        ctx.fillText(edu.school, x0, y);
        y += 50;
      }
    }

    // ---- skills ----
    if (skillList.length) {
      await sectionHeading(cv("skills"));
      ctx.fillStyle = "#374151";
      for (const line of wrapText(skillList.join("   •   "), contentW, "26px system-ui, sans-serif")) {
        await ensureSpace(38);
        ctx.fillText(line, x0, y);
        y += 38;
      }
      y += 20;
    }

    // ---- languages ----
    if (langList.length) {
      await sectionHeading(cv("languages"));
      ctx.fillStyle = "#374151";
      for (const line of wrapText(langList.join("   •   "), contentW, "26px system-ui, sans-serif")) {
        await ensureSpace(38);
        ctx.fillText(line, x0, y);
        y += 38;
      }
    }

    const finalBlob: Blob = await new Promise((res) => canvas.toBlob((b) => res!(b!), "image/png"));
    pages.push(finalBlob);
    return pages;
  };

  // ---- modern: full-height colored sidebar ----
  const renderModern = async (): Promise<Blob[]> => {
    const sidebar = isRtl ? W - SIDE : 0;
    const bodyX0 = isRtl ? MARGIN : SIDE + MARGIN;
    const bodyW = W - SIDE - MARGIN * 2;
    const startAlign: CanvasTextAlign = isRtl ? "right" : "left";
    const dark = shade(accent, -18);

    const pages: Blob[] = [];
    let canvas = makeCanvas().c;
    let ctx = canvas.getContext("2d")!;
    const blank = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = dark;
      ctx.fillRect(isRtl ? sidebar : 0, 0, SIDE, H);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(isRtl ? sidebar : 0, 0, SIDE, 16);
    };
    ctx.direction = isRtl ? "rtl" : "ltr";
    blank();
    let y = MARGIN;

    const newPage = async () => {
      const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res!(b!), "image/png"));
      pages.push(blob);
      canvas = makeCanvas().c;
      ctx = canvas.getContext("2d")!;
      ctx.direction = isRtl ? "rtl" : "ltr";
      blank();
      y = MARGIN;
    };
    const ensureSpace = async (needed: number) => {
      if (y + needed > MAX_Y) await newPage();
    };
    const wrapText = (text: string, maxWidth: number, font: string) => {
      ctx.font = font;
      const lines: string[] = [];
      for (const paragraph of text.split("\n")) {
        const words = paragraph.split(" ");
        let line = "";
        for (const word of words) {
          const test = line ? line + " " + word : word;
          if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = word;
          } else {
            line = test;
          }
        }
        lines.push(line);
      }
      return lines;
    };
    const sidebarSect = (title: string) => {
      ctx.textAlign = startAlign;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px system-ui, sans-serif";
      ctx.fillText(title, isRtl ? sidebar - 60 : sidebar + 60, y);
      y += 12;
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const sx = isRtl ? sidebar - 60 : sidebar + 60;
      ctx.moveTo(sx, y);
      ctx.lineTo(isRtl ? sidebar - (SIDE - 60) : sidebar + (SIDE - 60), y);
      ctx.stroke();
      y += 34;
    };

    // avatar
    const img = await loadAvatar();
    const avR = 125;
    const avCx = isRtl ? sidebar - SIDE / 2 : sidebar + SIDE / 2;
    const avCy = MARGIN + avR;
    if (img) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(avCx, avCy, avR, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - side) / 2;
      const sy = (img.naturalHeight - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, avCx - avR, avCy - avR, avR * 2, avR * 2);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(avCx, avCy, avR, 0, Math.PI * 2);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 10;
      ctx.stroke();
    }
    y = avCy + avR + 60;

    // name & title in sidebar
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 58px system-ui, sans-serif";
    for (const line of wrapText(fullName || "—", SIDE - 120, "bold 58px system-ui, sans-serif")) {
      ctx.fillText(line, avCx, y);
      y += 62;
    }
    ctx.font = "34px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText(jobTitle, avCx, y);
    y += 46;

    // contact lines in sidebar
      for (const part of contactParts) {
        for (const line of wrapText(part, SIDE - 140, "30px system-ui, sans-serif")) {
          if (y + 44 > MAX_Y) { await newPage(); y = MARGIN + 20; }
          ctx.textAlign = "center";
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.fillText(line, avCx, y);
          y += 44;
        }
      }
    y += 30;

    // sidebar skills
    if (skillList.length) {
      sidebarSect(cv("skills"));
      for (const skill of skillList) {
        for (const line of wrapText(skill, SIDE - 150, "30px system-ui, sans-serif")) {
          if (y + 40 > MAX_Y) { await newPage(); y = MARGIN + 20; }
          ctx.textAlign = startAlign;
          ctx.fillStyle = "#ffffff";
          ctx.font = "30px system-ui, sans-serif";
          ctx.fillText("•  " + line, isRtl ? sidebar - 70 : sidebar + 70, y);
          y += 40;
        }
      }
      y += 26;
    }
    // sidebar languages
    if (langList.length) {
      sidebarSect(cv("languages"));
      for (const lang of langList) {
        if (y + 40 > MAX_Y) { await newPage(); y = MARGIN + 20; }
        ctx.textAlign = startAlign;
        ctx.fillStyle = "#ffffff";
        ctx.font = "30px system-ui, sans-serif";
        ctx.fillText("•  " + lang, isRtl ? sidebar - 70 : sidebar + 70, y);
        y += 40;
      }
    }

    // ---- body: summary, experience, education ----
    y = MARGIN;
    const bodySect = async (title: string) => {
      await ensureSpace(70);
      ctx.textAlign = startAlign;
      ctx.fillStyle = accent;
      ctx.font = "bold 34px system-ui, sans-serif";
      ctx.fillText(title, bodyX0, y);
      y += 14;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(bodyX0, y);
      ctx.lineTo(isRtl ? bodyX0 - bodyW : bodyX0 + bodyW, y);
      ctx.stroke();
      y += 40;
    };

    const drawBodyHead = async (title: string, date: string) => {
      ctx.textAlign = startAlign;
      ctx.fillStyle = "#111827";
      const dateWidth = date ? ctx.measureText(date).width : 0;
      const titleMax = bodyW - dateWidth - 60;
      const titleLines = wrapText(title, Math.max(titleMax, bodyW * 0.4), "bold 28px system-ui, sans-serif");
      for (const tl of titleLines) {
        await ensureSpace(40);
        ctx.font = "bold 28px system-ui, sans-serif";
        ctx.fillStyle = "#111827";
        ctx.fillText(tl, bodyX0, y);
        y += 38;
      }
      if (date) {
        ctx.textAlign = isRtl ? "left" : "right";
        ctx.font = "24px system-ui, sans-serif";
        ctx.fillStyle = "#6b7280";
        ctx.fillText(date, isRtl ? bodyX0 - bodyW : bodyX0 + bodyW, y - 38 + 30);
      }
    };

    if (summary.trim()) {
      await bodySect(cv("summary"));
      ctx.fillStyle = "#374151";
      for (const line of wrapText(summary.trim(), bodyW, "26px system-ui, sans-serif")) {
        await ensureSpace(38);
        ctx.fillText(line, bodyX0, y);
        y += 38;
      }
      y += 20;
    }
    if (experiences.some((e) => e.title || e.company)) {
      await bodySect(cv("experience"));
      for (const exp of experiences) {
        if (!exp.title && !exp.company) continue;
        await ensureSpace(90);
        await drawBodyHead(exp.title, `${exp.start} – ${exp.end || cv("present")}`);
        ctx.textAlign = startAlign;
        ctx.fillStyle = accent;
        ctx.font = "italic 26px system-ui, sans-serif";
        ctx.fillText([exp.company, exp.location].filter(Boolean).join(", "), bodyX0, y);
        y += 38;
        ctx.fillStyle = "#374151";
        ctx.font = "25px system-ui, sans-serif";
        for (const bullet of exp.bullets.split("\n").filter(Boolean)) {
          for (const line of wrapText("•  " + bullet, bodyW - 20, "25px system-ui, sans-serif")) {
            await ensureSpace(36);
            ctx.fillText(line, bodyX0, y);
            y += 36;
          }
        }
        y += 24;
      }
    }
    if (education.some((e) => e.degree || e.school)) {
      await bodySect(cv("education"));
      for (const edu of education) {
        if (!edu.degree && !edu.school) continue;
        await ensureSpace(70);
        await drawBodyHead(edu.degree, [edu.start, edu.end].filter(Boolean).join(" – "));
        ctx.textAlign = startAlign;
        ctx.fillStyle = accent;
        ctx.font = "26px system-ui, sans-serif";
        ctx.fillText(edu.school, bodyX0, y);
        y += 50;
      }
    }

    const finalBlob: Blob = await new Promise((res) => canvas.toBlob((b) => res!(b!), "image/png"));
    pages.push(finalBlob);
    return pages;
  };

  const generate = async () => {
    setStage("busy");
    try {
      const pages = template === "modern" ? await renderModern() : await renderLinear();
      const bytes = await toPdf(pages);
      setOut(new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" }));
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  const previewRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / 794);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const previewHtml = buildResumeHtml({
    isRtl,
    fullName: fullName.trim(),
    jobTitle: jobTitle.trim(),
    contact: contactParts,
    summary: summary.trim(),
    skills: skillList,
    languages: langList,
    avatar: avatar || "",
    withPhoto,
    accent,
    template,
    labels: {
      summary: cv("summary"),
      experience: cv("experience"),
      education: cv("education"),
      skills: cv("skills"),
      languages: cv("languages"),
      present: cv("present"),
    },
    experiences: experiences
      .filter((e) => e.title || e.company)
      .map((e) => ({ title: e.title, company: e.company, location: e.location, start: e.start, end: e.end, bullets: e.bullets })),
    education: education
      .filter((e) => e.degree || e.school)
      .map((e) => ({ degree: e.degree, school: e.school, start: e.start, end: e.end })),
  });

  const printResume = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(previewHtml);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  if (stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={() => setStage("edit")} />;
  if (stage === "done" && out)
    return (
      <ResultCard onReset={() => { setOut(null); setStage("edit"); }}>
        <PrimaryButton onClick={() => downloadBlob(out, `${fullName || "resume"}.pdf`)}>{t("download")}</PrimaryButton>
      </ResultCard>
    );

  return (
    <div className="space-y-6">
      <div className="min-w-0 space-y-6">
      <div className="space-y-3 rounded-card border border-line bg-surface p-4">
        <h3 className="text-sm font-semibold text-ink-soft">{cv("design")}</h3>
        <div>
          <span className="mb-1 block text-xs font-medium text-ink-soft">{cv("template")}</span>
          <div className="flex flex-wrap gap-2">
            {(["classic", "modern", "minimal"] as Template[]).map((tp) => (
              <button key={tp} onClick={() => setTemplate(tp)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${template === tp ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line hover:border-brand-500"}`}>
                {cv(tp)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium text-ink-soft">{cv("accent")}</span>
          <div className="flex flex-wrap items-center gap-2">
            {ACCENTS.map((c) => (
              <button key={c} onClick={() => setAccent(c)}
                className={`h-7 w-7 rounded-full transition ${accent === c ? "ring-2 ring-ink ring-offset-2" : ""}`}
                style={{ background: c }} aria-label={c} />
            ))}
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)}
              className="h-7 w-9 cursor-pointer rounded border border-line bg-surface p-0.5" />
          </div>
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium text-ink-soft">{cv("photo")}</span>
          <div className="mb-3 flex flex-wrap gap-2">
            {(["none", "show"] as const).map((mode) => (
              <button key={mode} onClick={() => setWithPhoto(mode === "show")}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${withPhoto === (mode === "show") ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line hover:border-brand-500"}`}>
                {cv(mode === "none" ? "photoNone" : "photoShow")}
              </button>
            ))}
          </div>
          {withPhoto && (
          <div className="flex items-center gap-3">
            {avatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={avatar} alt="avatar" className="h-14 w-14 rounded-full object-cover ring-2 ring-line" />
            ) : (
              <div className="h-14 w-14 rounded-full border border-dashed border-line" />
            )}
            <span className="flex flex-wrap gap-2">
              <button onClick={() => document.getElementById("cv-avatar-input")?.click()}
                className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:border-brand-500">
                {avatar ? cv("changePhoto") : cv("uploadPhoto")}
              </button>
              {avatar && (
                <button onClick={() => setAvatar("")} className="text-sm text-red-500 hover:underline">{cv("removePhoto")}</button>
              )}
            </span>
            <input id="cv-avatar-input" type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && onPhoto(e.target.files[0])} />
          </div>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-card border border-line bg-surface p-4">
        <h3 className="text-sm font-semibold text-ink-soft">{cv("importCv")}</h3>
        {importing ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              <span className="text-sm text-ink-soft">{cv("importProcessing")} {importProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-brand-500 transition-all duration-300" style={{ width: `${importProgress}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => document.getElementById("cv-import-input")?.click()}
              className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-brand-700 hover:border-brand-500 hover:bg-brand-50 transition">
              {cv("importBtn")}
            </button>
            <input id="cv-import-input" type="file" accept="image/*,.pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportCv(f); e.target.value = ""; }} />
            <span className="text-xs text-ink-soft">{cv("importHint")}</span>
          </div>
        )}
        {importError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 break-all">
            {importError}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-card border border-line bg-surface p-4">
        <h3 className="text-sm font-semibold text-ink-soft">{cv("personal")}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input dir="auto" placeholder={cv("fullName")} value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
          <input dir="auto" placeholder={cv("jobTitle")} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClass} />
          <input dir="ltr" placeholder={cv("email")} value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          <input dir="ltr" placeholder={cv("phone")} value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          <input dir="auto" placeholder={cv("location")} value={cvLocation} onChange={(e) => setCvLocation(e.target.value)} className={inputClass} />
          <input dir="ltr" placeholder={cv("linkedin")} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="rounded-card border border-line bg-surface p-4">
        <h3 className="mb-2 text-sm font-semibold text-ink-soft">{cv("summary")}</h3>
        <textarea dir="auto" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3}
          placeholder={cv("summaryPh")} className={inputClass} />
      </div>

      <div className="rounded-card border border-line bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink-soft">{cv("experience")}</h3>
        <div className="space-y-4">
          {experiences.map((exp) => (
            <div key={exp.id} className="space-y-2 border-b border-line pb-4 last:border-0 last:pb-0">
              <div className="grid gap-2 sm:grid-cols-2">
                <input dir="auto" placeholder={cv("jobTitleField")} value={exp.title}
                  onChange={(e) => setExperiences((arr) => arr.map((x) => x.id === exp.id ? { ...x, title: e.target.value } : x))} className={inputClass} />
                <input dir="auto" placeholder={cv("company")} value={exp.company}
                  onChange={(e) => setExperiences((arr) => arr.map((x) => x.id === exp.id ? { ...x, company: e.target.value } : x))} className={inputClass} />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <input dir="ltr" placeholder={cv("start")} value={exp.start}
                  onChange={(e) => setExperiences((arr) => arr.map((x) => x.id === exp.id ? { ...x, start: e.target.value } : x))} className={inputClass} />
                <input dir="ltr" placeholder={cv("end")} value={exp.end}
                  onChange={(e) => setExperiences((arr) => arr.map((x) => x.id === exp.id ? { ...x, end: e.target.value } : x))} className={inputClass} />
                <input dir="auto" placeholder={cv("location")} value={exp.location}
                  onChange={(e) => setExperiences((arr) => arr.map((x) => x.id === exp.id ? { ...x, location: e.target.value } : x))} className={inputClass} />
              </div>
              <textarea dir="auto" placeholder={cv("bullets")} value={exp.bullets} rows={3}
                onChange={(e) => setExperiences((arr) => arr.map((x) => x.id === exp.id ? { ...x, bullets: e.target.value } : x))} className={inputClass} />
              <button onClick={() => setExperiences((arr) => arr.filter((x) => x.id !== exp.id))} className="text-sm text-red-500">
                {cv("remove")}
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => setExperiences((arr) => [...arr, newExp()])}
          className="mt-3 rounded-lg border border-line px-3 py-1.5 text-sm text-brand-700 hover:border-brand-500">
          + {cv("addExp")}
        </button>
      </div>

      <div className="rounded-card border border-line bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink-soft">{cv("education")}</h3>
        <div className="space-y-3">
          {education.map((edu) => (
            <div key={edu.degree + edu.id} className="grid gap-2 border-b border-line pb-3 last:border-0 sm:grid-cols-4">
              <input dir="auto" placeholder={cv("degree")} value={edu.degree}
                onChange={(e) => setEducation((arr) => arr.map((x) => x.id === edu.id ? { ...x, degree: e.target.value } : x))} className={inputClass} />
              <input dir="auto" placeholder={cv("school")} value={edu.school}
                onChange={(e) => setEducation((arr) => arr.map((x) => x.id === edu.id ? { ...x, school: e.target.value } : x))} className={inputClass} />
              <input dir="ltr" placeholder={cv("start")} value={edu.start}
                onChange={(e) => setEducation((arr) => arr.map((x) => x.id === edu.id ? { ...x, start: e.target.value } : x))} className={inputClass} />
              <div className="flex gap-2">
                <input dir="ltr" placeholder={cv("end")} value={edu.end}
                  onChange={(e) => setEducation((arr) => arr.map((x) => x.id === edu.id ? { ...x, end: e.target.value } : x))} className={inputClass} />
                <button onClick={() => setEducation((arr) => arr.filter((x) => x.id !== edu.id))} className="text-sm text-red-500">
                  {cv("remove")}
                </button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setEducation((arr) => [...arr, newEdu()])}
          className="mt-3 rounded-lg border border-line px-3 py-1.5 text-sm text-brand-700 hover:border-brand-500">
          + {cv("addEdu")}
        </button>
      </div>

      <div className="rounded-card border border-line bg-surface p-4">
        <h3 className="mb-2 text-sm font-semibold text-ink-soft">{cv("skills")}</h3>
        <input dir="auto" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder={cv("skillsPh")} className={inputClass} />
      </div>

      <div className="rounded-card border border-line bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink-soft">{cv("languages")}</h3>
        <div className="space-y-2">
          {languages.map((lang) => (
            <div key={lang.id} className="grid grid-cols-[1fr_1fr_36px] gap-2">
              <input dir="auto" placeholder={cv("langName")} value={lang.name}
                onChange={(e) => setLanguages((arr) => arr.map((x) => x.id === lang.id ? { ...x, name: e.target.value } : x))} className={inputClass} />
              <input dir="auto" placeholder={cv("level")} value={lang.level}
                onChange={(e) => setLanguages((arr) => arr.map((x) => x.id === lang.id ? { ...x, level: e.target.value } : x))} className={inputClass} />
              <button onClick={() => setLanguages((arr) => arr.filter((x) => x.id !== lang.id))} className="text-sm text-red-500">
                {cv("remove")}
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => setLanguages((arr) => [...arr, newLang()])}
          className="mt-3 rounded-lg border border-line px-3 py-1.5 text-sm text-brand-700 hover:border-brand-500">
          + {cv("addLang")}
        </button>
      </div>

      <PrimaryButton onClick={generate}>{cv("generate")}</PrimaryButton>
      </div>

      <div className="min-w-0">
        <div className="space-y-3 rounded-card border border-line bg-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink-soft">{cv("previewLive")}</h3>
            <button onClick={printResume}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-brand-700 hover:border-brand-500">
              {cv("print")}
            </button>
          </div>
          <div ref={previewRef} className="aspect-[1/1.4142] w-full min-h-[297mm] overflow-hidden rounded-md border border-line bg-white"
            style={{ wordBreak: "break-word", minHeight: "297mm", direction: "ltr" }}>
            <div style={{ width: "210mm", height: "297mm", transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <iframe srcDoc={previewHtml} title={cv("previewLive")} className="h-full w-full border-0" />
            </div>
          </div>
          <p className="text-xs text-ink-soft">{cv("previewFast")}</p>
        </div>
      </div>
    </div>
  );
}
