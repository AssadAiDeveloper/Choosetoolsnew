export interface CvHtmlExperience {
  title: string;
  company: string;
  location: string;
  start: string;
  end: string;
  bullets: string;
}
export interface CvHtmlEducation {
  degree: string;
  school: string;
  start: string;
  end: string;
}
export interface CvHtmlData {
  isRtl: boolean;
  fullName: string;
  jobTitle: string;
  contact: string[];
  summary: string;
  skills: string[];
  languages: string[];
  avatar: string;
  withPhoto: boolean;
  accent: string;
  template: "classic" | "modern" | "minimal";
  labels: {
    summary: string;
    experience: string;
    education: string;
    skills: string;
    languages: string;
    present: string;
  };
  experiences: CvHtmlExperience[];
  education: CvHtmlEducation[];
}

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const darken = (hex: string, amt: number) => {
  const n = hex.replace("#", "");
  const full = n.length === 3 ? n.split("").map((c) => c + c).join("") : n;
  const num = parseInt(full, 16);
  const r = Math.max(0, (num >> 16) + amt);
  const g = Math.max(0, ((num >> 8) & 0xff) + amt);
  const b = Math.max(0, (num & 0xff) + amt);
  return `rgb(${r}, ${g}, ${b})`;
};

const section = (hClass: string, cls: string, title: string, inner: string) =>
  `<section class="${cls}"><h2 class="${hClass}">${esc(title)}</h2>${inner}</section>`;

const expItems = (prefix: string, present: string, items: CvHtmlExperience[]) =>
  items
    .map((exp) => {
      const bullets = exp.bullets
        .split("\n")
        .map(esc)
        .filter(Boolean)
        .map((b) => `<li>${b}</li>`)
        .join("");
      const sub = [exp.company, exp.location].filter(Boolean).join(", ");
      return `<div class="${prefix}-item">
  <div class="${prefix}-item-head">
    <span class="${prefix}-item-title">${esc(exp.title)}</span>
    <span class="${prefix}-item-date">${esc(exp.start)} – ${esc(exp.end || present)}</span>
  </div>
  ${sub ? `<div class="${prefix}-item-sub">${esc(sub)}</div>` : ""}
  ${bullets ? `<ul class="${prefix}-bullets">${bullets}</ul>` : ""}
</div>`;
    })
    .join("");

const eduItems = (prefix: string, items: CvHtmlEducation[]) =>
  items
    .map((edu) => {
      const dates = [edu.start, edu.end].filter(Boolean).join(" – ");
      return `<div class="${prefix}-item">
  <div class="${prefix}-item-head">
    <span class="${prefix}-item-title">${esc(edu.degree)}</span>
    ${dates ? `<span class="${prefix}-item-date">${esc(dates)}</span>` : ""}
  </div>
  ${edu.school ? `<div class="${prefix}-item-sub">${esc(edu.school)}</div>` : ""}
</div>`;
    })
    .join("");

export function buildResumeHtml(d: CvHtmlData): string {
  const dir = d.isRtl ? "rtl" : "ltr";
  const A = d.accent;
  const D = darken(d.accent, -42);
  const contact = (d.contact || []).map(esc).join("  •  ");
  const avatar = d.withPhoto
    ? d.avatar
      ? `<img class="avatar" src="${d.avatar}" alt="avatar" />`
      : `<div class="avatar-placeholder"></div>`
    : "";

  let body = "";

  if (d.template === "modern") {
    const skillsAside = d.skills.length
      ? section("ac-h", "ac-sec", d.labels.skills, d.skills.map((s) => `<div class="ac-item">•  ${esc(s)}</div>`).join(""))
      : "";
    const langsAside = d.languages.length
      ? section("ac-h", "ac-sec", d.labels.languages, d.languages.map((l) => `<div class="ac-item">•  ${esc(l)}</div>`).join(""))
      : "";
    const contactAside = d.contact
      .map((c) => `<div class="ac-contact-line">${esc(c)}</div>`)
      .join("");
    const mainSections =
      (d.summary ? section("mo-h", "mo-sec", d.labels.summary, `<p class="mo-text">${esc(d.summary)}</p>`) : "") +
      (d.experiences.length ? section("mo-h", "mo-sec", d.labels.experience, expItems("mo", d.labels.present, d.experiences)) : "") +
      (d.education.length ? section("mo-h", "mo-sec", d.labels.education, eduItems("mo", d.education)) : "");
    body = `<div class="modern">
  <aside class="ac">
    ${avatar}
    <div class="ac-name">${esc(d.fullName || "—")}</div>
    <div class="ac-title">${esc(d.jobTitle)}</div>
    ${contactAside ? `<div class="ac-contact">${contactAside}</div>` : ""}
    ${skillsAside}
    ${langsAside}
  </aside>
  <main class="mo">${mainSections}</main>
</div>`;
  } else if (d.template === "minimal") {
    const secs =
      (d.summary ? section("mi-h", "mi-sec", d.labels.summary, `<p class="mi-text">${esc(d.summary)}</p>`) : "") +
      (d.experiences.length ? section("mi-h", "mi-sec", d.labels.experience, expItems("mi", d.labels.present, d.experiences)) : "") +
      (d.education.length ? section("mi-h", "mi-sec", d.labels.education, eduItems("mi", d.education)) : "") +
      (d.skills.length ? section("mi-h", "mi-sec", d.labels.skills, `<p class="mi-text inline-join">${d.skills.map(esc).join("  •  ")}</p>`) : "") +
      (d.languages.length ? section("mi-h", "mi-sec", d.labels.languages, `<p class="mi-text inline-join">${d.languages.map(esc).join("  •  ")}</p>`) : "");
    const rtlPad = d.isRtl ? ' style="padding-left:0!important;padding-right:0!important"' : "";
    const rtlName = d.isRtl ? ' style="text-align:right!important;margin-right:0!important;margin-left:auto!important"' : "";
    const rtlDiv = d.isRtl ? ' style="width:100%!important;margin:6mm 0!important;min-width:100%!important"' : "";
    body = `<div class="minimal"${rtlPad}>
  ${avatar}
  <div class="mi-name"${rtlName}>${esc(d.fullName || "—")}</div>
  <div class="mi-title">${esc(d.jobTitle)}</div>
  ${contact ? `<div class="mi-contact">${contact}</div>` : ""}
  <div class="mi-divider"${rtlDiv}></div>
  ${secs}
</div>`;
  } else {
    const secs =
      (d.summary ? section("c-h", "c-sec", d.labels.summary, `<p class="c-text">${esc(d.summary)}</p>`) : "") +
      (d.experiences.length ? section("c-h", "c-sec", d.labels.experience, expItems("c", d.labels.present, d.experiences)) : "") +
      (d.education.length ? section("c-h", "c-sec", d.labels.education, eduItems("c", d.education)) : "") +
      (d.skills.length ? section("c-h", "c-sec", d.labels.skills, `<p class="c-text">${d.skills.map(esc).join("  •  ")}</p>`) : "") +
      (d.languages.length ? section("c-h", "c-sec", d.labels.languages, `<p class="c-text">${d.languages.map(esc).join("  •  ")}</p>`) : "");
    body = `<div class="classic-name-area">
  <div class="c-head">
    ${avatar}
    <div>
      <div class="c-name">${esc(d.fullName || "—")}</div>
      <div class="c-title">${esc(d.jobTitle)}</div>
      ${contact ? `<div class="c-contact">${contact}</div>` : ""}
    </div>
  </div>
  <div class="c-divider"></div>
  ${secs}
</div>`;
  }

  return `<!DOCTYPE html>
<html dir="${dir}">
<head>
<meta charset="utf-8" />
<title>Resume</title>
<style>
@page { size: 210mm 297mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 210mm; height: 297mm; overflow: hidden; }
body { background: #ffffff; color: #1f2937; -webkit-print-color-adjust: exact; print-color-adjust: exact; word-break: break-word; font-family: 'Segoe UI', Tahoma, Verdana, Arial, sans-serif; }
img.avatar { display: block; }
.avatar-placeholder { display: block; background: #e5e7eb; }
/* ===== classic ===== */
.classic-name-area { position: relative; width: 210mm; height: 297mm; padding: 16mm 18mm; overflow: hidden; text-align: start; }
.c-head { display: flex; align-items: center; gap: 7mm; padding-bottom: 6mm; margin-bottom: 6mm; }
.c-head img.avatar, .c-head .avatar-placeholder { width: 30mm; height: 30mm; border-radius: 50%; object-fit: cover; border: 1mm solid ${A}; flex-shrink: 0; }
.c-divider { display: block; width: 100%; height: 1.2mm; background: ${A}; border-radius: 1mm; margin: 0 0 7mm; }
.c-name { font-size: 26pt; font-weight: 700; color: #111827; line-height: 1.15; }
.c-title { font-size: 13.5pt; font-weight: 600; color: ${A}; margin-top: 1mm; }
.c-contact { font-size: 9pt; color: #6b7280; margin-top: 2.5mm; }
.c-sec { margin-top: 5mm; }
.c-h { font-size: 12.5pt; font-weight: 700; color: ${A}; text-transform: uppercase; letter-spacing: 0.5mm; border-bottom: 0.8mm solid ${A}; padding-bottom: 1.5mm; margin-bottom: 3mm; }
.c-item { margin-bottom: 3.5mm; break-inside: avoid; }
.c-item-head { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; }
.c-item-title { font-size: 11pt; font-weight: 700; color: #111827; }
.c-item-date { font-size: 9pt; color: #6b7280; white-space: nowrap; }
.c-item-sub { font-size: 10pt; color: ${A}; font-style: italic; margin: 1mm 0 1.5mm; }
.c-bullets { padding-inline-start: 5mm; }
.c-bullets li { font-size: 9.5pt; color: #374151; line-height: 1.4; margin-bottom: 1mm; }
.c-text { font-size: 10pt; color: #374151; line-height: 1.45; }
/* ===== modern ===== */
.modern { position: relative; display: flex; flex-direction: row; align-items: stretch; justify-content: flex-start; width: 210mm; height: 297mm; min-height: 297mm; padding: 0; overflow: hidden; background: #ffffff; }
.ac { position: relative; width: 58mm; flex-shrink: 0; align-self: stretch; height: 100%; min-height: 100%; background: ${D}; color: #ffffff; box-sizing: border-box; padding: 20mm 8mm; border-radius: 0 6mm 6mm 0; overflow: hidden; }
.ac img.avatar, .ac .avatar-placeholder { width: 30mm; height: 30mm; border-radius: 50%; object-fit: cover; border: 1mm solid rgba(255,255,255,0.7); margin: 0 auto; }
.ac-name { font-size: 16pt; font-weight: 700; text-align: left; margin-top: 4mm; color: #ffffff; }
.ac-title { font-size: 10pt; color: rgba(255,255,255,0.92); text-align: left; margin-top: 1.5mm; }
.ac-contact { margin-top: 4mm; }
.ac-contact-line { font-size: 8.5pt; color: rgba(255,255,255,0.95); text-align: left; line-height: 1.45; }
.ac-sec { margin-top: 5mm; }
.ac-h { font-size: 9.5pt; font-weight: 700; letter-spacing: 0.3mm; text-transform: uppercase; color: #ffffff; border-bottom: 0.6mm solid rgba(255,255,255,0.4); padding-bottom: 1.5mm; margin-bottom: 2.5mm; text-align: left; }
.ac-item { font-size: 8.5pt; color: rgba(255,255,255,0.95); line-height: 1.5; text-align: left; }
.mo { position: relative; flex: 1; flex-grow: 1; min-width: 0; height: 100%; box-sizing: border-box; padding: 20mm 8mm; overflow: hidden; }
.mo-sec { margin-top: 4mm; }
.mo-h { font-size: 11.5pt; font-weight: 700; color: ${A}; border-bottom: 0.8mm solid ${A}; padding-bottom: 1.5mm; margin-bottom: 2.5mm; }
.mo-item { margin-bottom: 3.5mm; break-inside: avoid; }
.mo-item-head { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; }
.mo-item-title { font-size: 10.5pt; font-weight: 700; color: #111827; }
.mo-item-date { font-size: 8.5pt; color: #6b7280; white-space: nowrap; }
.mo-item-sub { font-size: 9.5pt; color: ${A}; font-style: italic; margin: 1mm 0 1.5mm; }
.mo-bullets { padding-inline-start: 5mm; }
.mo-bullets li { font-size: 9pt; color: #374151; line-height: 1.4; margin-bottom: 1mm; }
.mo-text { font-size: 9.5pt; color: #374151; line-height: 1.45; }
/* ===== minimal ===== */
.minimal { position: relative; width: 210mm; height: 297mm; padding: 16mm 18mm; overflow: hidden; text-align: start; }
.minimal img.avatar, .minimal .avatar-placeholder { width: 28mm; height: 28mm; border-radius: 50%; object-fit: cover; border: 1mm solid ${A}; margin: 0 auto 4mm; }
.mi-name { font-size: 23pt; font-weight: 700; color: #111827; text-align: start; }
.mi-title { font-size: 12.5pt; color: ${A}; margin-top: 1.5mm; text-align: start; }
.mi-contact { font-size: 9pt; color: #6b7280; margin-top: 2.5mm; text-align: start; }
.mi-divider { display: block; width: 210mm; height: 1mm; background: ${A}; border-radius: 0; margin: 6mm -18mm 6mm -18mm; }
.mi-sec { margin-top: 5.5mm; }
.mi-h { font-size: 12pt; font-weight: 700; color: ${A}; text-transform: uppercase; letter-spacing: 0.5mm; margin-bottom: 2.5mm; }
.mi-item { margin-bottom: 3.5mm; break-inside: avoid; }
.mi-item-head { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; }
.mi-item-title { font-size: 10.5pt; font-weight: 700; color: #111827; }
.mi-item-date { font-size: 8.5pt; color: #6b7280; white-space: nowrap; }
.mi-item-sub { font-size: 9.5pt; color: ${A}; font-style: italic; margin: 1mm 0 1.5mm; }
.mi-bullets { padding-inline-start: 5mm; }
.mi-bullets li { font-size: 9pt; color: #374151; line-height: 1.4; margin-bottom: 1mm; }
.mi-text { font-size: 10pt; color: #374151; line-height: 1.45; }
.inline-join { word-break: break-word; }
/* ===== RTL ===== */
html[dir="rtl"] .classic-name-area,
html[dir="rtl"] .mo,
html[dir="rtl"] .minimal { direction: rtl; text-align: right; }
html[dir="rtl"] .minimal { padding-left: 0 !important; padding-right: 0 !important; }
html[dir="rtl"] .mi-name { text-align: right !important; margin-right: 0 !important; margin-left: auto !important; }
html[dir="rtl"] .mi-divider { width: 100% !important; margin-left: 0 !important; margin-right: 0 !important; }
html[dir="rtl"] .modern { direction: ltr; flex-direction: row-reverse; justify-content: flex-start; }
html[dir="rtl"] .ac { direction: rtl; text-align: right; border-radius: 6mm 0 0 6mm; }
html[dir="rtl"] .c-name,
html[dir="rtl"] .c-title,
html[dir="rtl"] .c-contact,
html[dir="rtl"] .c-item-title,
html[dir="rtl"] .c-item-date,
html[dir="rtl"] .c-item-sub,
html[dir="rtl"] .c-text,
html[dir="rtl"] .mo-text,
html[dir="rtl"] .mo-item-title,
html[dir="rtl"] .mo-item-date,
html[dir="rtl"] .mo-item-sub,
html[dir="rtl"] .mi-name,
html[dir="rtl"] .mi-title,
html[dir="rtl"] .mi-contact,
html[dir="rtl"] .mi-text,
html[dir="rtl"] .ac-name,
html[dir="rtl"] .ac-title,
html[dir="rtl"] .ac-contact-line,
html[dir="rtl"] .ac-item,
html[dir="rtl"] .ac-h { text-align: right; }
html[dir="rtl"] .c-h,
html[dir="rtl"] .ac-h,
html[dir="rtl"] .mo-h,
html[dir="rtl"] .mi-h { letter-spacing: 0 !important; text-transform: none; text-align: right; }
html[dir="rtl"] .c-item-head,
html[dir="rtl"] .mo-item-head,
html[dir="rtl"] .mi-item-head { flex-wrap: wrap; row-gap: 1mm; }
html[dir="rtl"] .c-bullets,
html[dir="rtl"] .mo-bullets,
html[dir="rtl"] .mi-bullets { padding-inline-start: 6mm; margin-right: 0; }
</style>
</head>
<body>${body}</body>
</html>`;
}