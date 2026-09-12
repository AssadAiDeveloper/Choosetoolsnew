"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { PrimaryButton } from "../ToolShell";
import { downloadBlob } from "@/lib/download";

type LangId = "en" | "ar" | "es" | "nl" | "fr" | "de" | "ru" | "hi" | "id" | "tr" | "pt";

const LANGS: Record<LangId, {
  cert: string; presentedTo: string; for_: string; date: string; signature: string; certNumber: string;
  namePh: string; titlePh: string; orgPh: string; descPh: string; certNoPh: string; presenterPh: string;
  design: string; theme: string; background: string; accent: string; font: string; styles: string;
  classic: string; modern: string; gold: string; blue: string; green: string; dark: string;
  serif: string; sans: string; minimal: string;
  logo: string; uploadLogo: string; removeLogo: string; preview: string; download: string; downloadPng: string; downloadPdf: string; defaultTitle: string; defaultOrg: string;
}> = {
  en: { cert: "Certificate", presentedTo: "This certificate is proudly presented to", for_: "for successfully completing", date: "Date", signature: "Signature", certNumber: "Certificate No.", namePh: "Recipient name", titlePh: "Certificate title", orgPh: "Organization name", descPh: "Description (optional)", certNoPh: "Certificate number", presenterPh: "Signatory / Issuer name", design: "Design", theme: "Theme", background: "Background color", accent: "Accent color", font: "Font", styles: "Style", classic: "Classic", modern: "Modern", gold: "Gold", blue: "Blue", green: "Green", dark: "Dark", serif: "Serif", sans: "Sans", minimal: "Minimal", logo: "Logo (optional)", uploadLogo: "Upload logo", removeLogo: "Remove", preview: "Live preview", download: "Download", downloadPng: "Download PNG", downloadPdf: "Download PDF", defaultTitle: "Course", defaultOrg: "Organization" },
  ar: { cert: "شهادة", presentedTo: "تُمنح هذه الشهادة بكل فخر إلى", for_: "لإكماله بنجاح", date: "التاريخ", signature: "التوقيع", certNumber: "رقم الشهادة", namePh: "اسم المستلم", titlePh: "عنوان الشهادة", orgPh: "اسم المؤسسة", descPh: "الوصف (اختياري)", certNoPh: "رقم الشهادة", presenterPh: "اسم الموقِّع / المُصدر", design: "التصميم", theme: "السمة", background: "لون الخلفية", accent: "اللون المميز", font: "الخط", styles: "النمط", classic: "كلاسيكي", modern: "حديث", gold: "ذهبي", blue: "أزرق", green: "أخضر", dark: "داكن", serif: "سيريف", sans: "سينس", minimal: "بسيط", logo: "الشعار (اختياري)", uploadLogo: "رفع شعار", removeLogo: "إزالة", preview: "معاينة حية", download: "تحميل", downloadPng: "تحميل PNG", downloadPdf: "تحميل PDF", defaultTitle: "الدورة", defaultOrg: "المؤسسة" },
  es: { cert: "Certificado", presentedTo: "Este certificado se otorga con orgullo a", for_: "por completar con éxito", date: "Fecha", signature: "Firma", certNumber: "N.º de certificado", namePh: "Nombre del destinatario", titlePh: "Título del certificado", orgPh: "Nombre de la organización", descPh: "Descripción (opcional)", certNoPh: "Número de certificado", presenterPh: "Nombre del firmante / emisor", design: "Diseño", theme: "Tema", background: "Color de fondo", accent: "Color de acento", font: "Fuente", styles: "Estilo", classic: "Clásico", modern: "Moderno", gold: "Dorado", blue: "Azul", green: "Verde", dark: "Oscuro", serif: "Serif", sans: "Sans", minimal: "Mínimo", logo: "Logo (opcional)", uploadLogo: "Subir logo", removeLogo: "Quitar", preview: "Vista previa", download: "Descargar", downloadPng: "Descargar PNG", downloadPdf: "Descargar PDF", defaultTitle: "Curso", defaultOrg: "Organización" },
  nl: { cert: "Certificaat", presentedTo: "Dit certificaat wordt met trots uitgereikt aan", for_: "voor het succesvol afronden van", date: "Datum", signature: "Handtekening", certNumber: "Certificaatnr.", namePh: "Naam ontvanger", titlePh: "Titel certificaat", orgPh: "Organisatienaam", descPh: "Beschrijving (optioneel)", certNoPh: "Certificaatnummer", presenterPh: "Naam ondertekenaar / afgever", design: "Ontwerp", theme: "Thema", background: "Achtergrondkleur", accent: "Accentkleur", font: "Lettertype", styles: "Stijl", classic: "Klassiek", modern: "Modern", gold: "Goud", blue: "Blauw", green: "Groen", dark: "Donker", serif: "Serif", sans: "Sans", minimal: "Minimaal", logo: "Logo (optioneel)", uploadLogo: "Logo uploaden", removeLogo: "Verwijderen", preview: "Voorbeeld", download: "Downloaden", downloadPng: "PNG downloaden", downloadPdf: "PDF downloaden", defaultTitle: "Cursus", defaultOrg: "Organisatie" },
  fr: { cert: "Certificat", presentedTo: "Ce certificat est fièrement décerné à", for_: "pour avoir réussi", date: "Date", signature: "Signature", certNumber: "N° de certificat", namePh: "Nom du destinataire", titlePh: "Titre du certificat", orgPh: "Nom de l'organisation", descPh: "Description (facultatif)", certNoPh: "Numéro de certificat", presenterPh: "Nom du signataire / émetteur", design: "Design", theme: "Thème", background: "Couleur de fond", accent: "Couleur d'accent", font: "Police", styles: "Style", classic: "Classique", modern: "Moderne", gold: "Or", blue: "Bleu", green: "Vert", dark: "Sombre", serif: "Serif", sans: "Sans", minimal: "Minimal", logo: "Logo (facultatif)", uploadLogo: "Téléverser le logo", removeLogo: "Retirer", preview: "Aperçu", download: "Télécharger", downloadPng: "Télécharger PNG", downloadPdf: "Télécharger PDF", defaultTitle: "Cours", defaultOrg: "Organisation" },
  de: { cert: "Zertifikat", presentedTo: "Dieses Zertifikat wird stolz verliehen an", for_: "für den erfolgreichen Abschluss von", date: "Datum", signature: "Unterschrift", certNumber: "Zertifikatsnr.", namePh: "Name des Empfängers", titlePh: "Titel des Zertifikats", orgPh: "Name der Organisation", descPh: "Beschreibung (optional)", certNoPh: "Zertifikatsnummer", presenterPh: "Name des Unterzeichners / Ausstellers", design: "Design", theme: "Thema", background: "Hintergrundfarbe", accent: "Akzentfarbe", font: "Schriftart", styles: "Stil", classic: "Klassisch", modern: "Modern", gold: "Gold", blue: "Blau", green: "Grün", dark: "Dunkel", serif: "Serif", sans: "Sans", minimal: "Minimal", logo: "Logo (optional)", uploadLogo: "Logo hochladen", removeLogo: "Entfernen", preview: "Vorschau", download: "Herunterladen", downloadPng: "PNG herunterladen", downloadPdf: "PDF herunterladen", defaultTitle: "Kurs", defaultOrg: "Organisation" },
  ru: { cert: "Сертификат", presentedTo: "Настоящий сертификат с гордостью вручается", for_: "за успешное завершение", date: "Дата", signature: "Подпись", certNumber: "№ сертификата", namePh: "Имя получателя", titlePh: "Название сертификата", orgPh: "Название организации", descPh: "Описание (необязательно)", certNoPh: "Номер сертификата", presenterPh: "Имя подписанта / выдающего", design: "Дизайн", theme: "Тема", background: "Цвет фона", accent: "Акцентный цвет", font: "Шрифт", styles: "Стиль", classic: "Классический", modern: "Современный", gold: "Золотой", blue: "Синий", green: "Зелёный", dark: "Тёмный", serif: "С засечками", sans: "Без засечек", minimal: "Минимализм", logo: "Логотип (необязательно)", uploadLogo: "Загрузить логотип", removeLogo: "Удалить", preview: "Предпросмотр", download: "Скачать", downloadPng: "Скачать PNG", downloadPdf: "Скачать PDF", defaultTitle: "Курс", defaultOrg: "Организация" },
  hi: { cert: "प्रमाणपत्र", presentedTo: "यह प्रमाणपत्र गर्व से प्रस्तुत किया जाता है", for_: "सफलतापूर्वक पूर्ण करने के लिए", date: "दिनांक", signature: "हस्ताक्षर", certNumber: "प्रमाणपत्र संख्या", namePh: "प्राप्तकर्ता का नाम", titlePh: "प्रमाणपत्र शीर्षक", orgPh: "संगठन का नाम", descPh: "विवरण (वैकल्पिक)", certNoPh: "प्रमाणपत्र संख्या", presenterPh: "हस्ताक्षरकर्ता / जारीकर्ता का नाम", design: "डिज़ाइन", theme: "थीम", background: "पृष्ठभूमि रंग", accent: "एक्सेंट रंग", font: "फ़ॉन्ट", styles: "शैली", classic: "क्लासिक", modern: "आधुनिक", gold: "गोल्ड", blue: "नीला", green: "हरा", dark: "गहरा", serif: "सेरिफ़", sans: "सैंस", minimal: "न्यूनतम", logo: "लोगो (वैकल्पिक)", uploadLogo: "लोगो अपलोड करें", removeLogo: "हटाएँ", preview: "लाइव पूर्वावलोकन", download: "डाउनलोड", downloadPng: "PNG डाउनलोड करें", downloadPdf: "PDF डाउनलोड करें", defaultTitle: "पाठ्यक्रम", defaultOrg: "संगठन" },
  id: { cert: "Sertifikat", presentedTo: "Sertifikat ini dengan bangga diberikan kepada", for_: "atas keberhasilan menyelesaikan", date: "Tanggal", signature: "Tanda tangan", certNumber: "No. Sertifikat", namePh: "Nama penerima", titlePh: "Judul sertifikat", orgPh: "Nama organisasi", descPh: "Deskripsi (opsional)", certNoPh: "Nomor sertifikat", presenterPh: "Nama penandatangan / penerbit", design: "Desain", theme: "Tema", background: "Warna latar", accent: "Warna aksen", font: "Font", styles: "Gaya", classic: "Klasik", modern: "Modern", gold: "Emas", blue: "Biru", green: "Hijau", dark: "Gelap", serif: "Serif", sans: "Sans", minimal: "Minimal", logo: "Logo (opsional)", uploadLogo: "Unggah logo", removeLogo: "Hapus", preview: "Pratinjau", download: "Unduh", downloadPng: "Unduh PNG", downloadPdf: "Unduh PDF", defaultTitle: "Kursus", defaultOrg: "Organisasi" },
  tr: { cert: "Sertifika", presentedTo: "Bu sertifika gururla takdim edilir", for_: "başarıyla tamamladığı için", date: "Tarih", signature: "İmza", certNumber: "Sertifika No.", namePh: "Alıcı adı", titlePh: "Sertifika başlığı", orgPh: "Kuruluş adı", descPh: "Açıklama (isteğe bağlı)", certNoPh: "Sertifika numarası", presenterPh: "İmzalayan / veren adı", design: "Tasarım", theme: "Tema", background: "Arka plan rengi", accent: "Vurgu rengi", font: "Yazı tipi", styles: "Stil", classic: "Klasik", modern: "Modern", gold: "Altın", blue: "Mavi", green: "Yeşil", dark: "Koyu", serif: "Serif", sans: "Sans", minimal: "Minimal", logo: "Logo (isteğe bağlı)", uploadLogo: "Logo yükle", removeLogo: "Kaldır", preview: "Canlı önizleme", download: "İndir", downloadPng: "PNG indir", downloadPdf: "PDF indir", defaultTitle: "Kurs", defaultOrg: "Kuruluş" },
  pt: { cert: "Certificado", presentedTo: "Este certificado é orgulhosamente concedido a", for_: "por concluir com sucesso", date: "Data", signature: "Assinatura", certNumber: "N.º do certificado", namePh: "Nome do destinatário", titlePh: "Título do certificado", orgPh: "Nome da organização", descPh: "Descrição (opcional)", certNoPh: "Número do certificado", presenterPh: "Nome do signatário / emissor", design: "Design", theme: "Tema", background: "Cor de fundo", accent: "Cor de destaque", font: "Fonte", styles: "Estilo", classic: "Clássico", modern: "Moderno", gold: "Dourado", blue: "Azul", green: "Verde", dark: "Escuro", serif: "Serif", sans: "Sans", minimal: "Minimal", logo: "Logo (opcional)", uploadLogo: "Enviar logo", removeLogo: "Remover", preview: "Pré-visualização", download: "Baixar", downloadPng: "Baixar PNG", downloadPdf: "Baixar PDF", defaultTitle: "Curso", defaultOrg: "Organização" },
};

const isValidLang = (l: string): l is LangId => l in LANGS;

const THEMES: Record<string, { label: string; bg1: string; bg2: string; accent: string }> = {
  classic: { label: "Classic", bg1: "#0e2a47", bg2: "#123b5e", accent: "#c9974a" },
  modern: { label: "Modern", bg1: "#111827", bg2: "#1f2937", accent: "#38bdf8" },
  gold: { label: "Gold", bg1: "#2f1b0e", bg2: "#4a2c12", accent: "#e8b45a" },
  blue: { label: "Blue", bg1: "#0b2447", bg2: "#19376d", accent: "#a5d8ff" },
  green: { label: "Green", bg1: "#06281a", bg2: "#0b3d2a", accent: "#7dd3a0" },
  dark: { label: "Dark", bg1: "#0a0a0a", bg2: "#161616", accent: "#e0e0e0" },
};

const FONTS = {
  serif: "'Cormorant Garamond','Georgia',serif",
  sans: "'DM Sans',Arial,sans-serif",
  minimal: "Arial,'Helvetica Neue',Helvetica,sans-serif",
};

const FALLBACK_NAME = "Name";
const FALLBACK_TITLE = "Course";
const FALLBACK_ORG = "Organization";

export default function CertificateGenerator() {
  const locale = useLocale();
  const cls = isValidLang(locale) ? locale : "en";
  const L = LANGS[cls];
  const isRtl = cls === "ar";

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [org, setOrg] = useState("");
  const [desc, setDesc] = useState("");
  const [certNo, setCertNo] = useState("");
  const [presenter, setPresenter] = useState("");
  const [theme, setTheme] = useState("classic");
  const [bg, setBg] = useState(THEMES.classic.bg1);
  const [accent, setAccent] = useState(THEMES.classic.accent);
  const [font, setFont] = useState<keyof typeof FONTS>("serif");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const W = 1600, H = 1132;

  const displayedName = name.trim() || FALLBACK_NAME;
  const displayedTitle = title.trim() || (L.defaultTitle || FALLBACK_TITLE);
  const displayedOrg = org.trim() || (L.defaultOrg || FALLBACK_ORG);

  const draw = (dst: HTMLCanvasElement) => {
    const ctx = dst.getContext("2d")!;
    ctx.clearRect(0, 0, W, H);
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, bg);
    grad.addColorStop(1, THEMES[theme].bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // decorative double border
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.strokeRect(60, 60, W - 120, H - 120);
    ctx.lineWidth = 2;
    ctx.strokeRect(84, 84, W - 168, H - 168);
    const F = FONTS[font];
    const hasLogo = !!logoUrl;
    const hasDesc = desc.trim().length > 0;
    // certificate number (top right)
    if (certNo.trim()) {
      ctx.textAlign = isRtl ? "left" : "right";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = accent;
      ctx.font = "400 28px " + F;
      ctx.fillText((L.certNumber + ": " + certNo.trim()).toUpperCase(), W - 130, 128);
    }
    // logo (top center)
    if (hasLogo) {
      const img = new Image();
      img.onload = () => {
        try {
          const maxW = 280, maxH = 150;
          const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
          const lw = img.width * ratio, lh = img.height * ratio;
          ctx.drawImage(img, W / 2 - lw / 2, 152, lw, lh);
        } catch { /* ignore */ }
      };
      img.src = logoUrl;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // rows evenly distributed between topY and bottomY so nothing overflows, even with logo + description
    const topY = hasLogo ? 408 : 300;
    const bottomY = 845;
    const rows: { text: string; color: string; weight: string; size: number; maxW: number }[] = [
      { text: L.cert.toUpperCase(), color: accent, weight: "600", size: 76, maxW: 1500 },
      { text: L.presentedTo, color: "#ffffff", weight: "400", size: 36, maxW: 1400 },
      { text: displayedName, color: accent, weight: "700", size: 84, maxW: 1250 },
    ];
    if (hasDesc) rows.push({ text: desc.trim(), color: "#d5dbe0", weight: "400", size: 30, maxW: 1450 });
    rows.push({ text: L.for_, color: "#e3e8ec", weight: "400", size: 33, maxW: 1400 });
    rows.push({ text: displayedTitle, color: "#ffffff", weight: "600", size: 58, maxW: 1300 });
    const step = (bottomY - topY) / rows.length;
    rows.forEach((r, i) => {
      const yCenter = topY + step * i + step / 2;
      drawFit(ctx, r.text, yCenter, r.maxW, r.color, r.weight, r.size);
    });
    // divider
    const divY = 890;
    ctx.strokeStyle = accent;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 280, divY);
    ctx.lineTo(W / 2 + 280, divY);
    ctx.stroke();
    // footer
    const footY = 924;
    ctx.fillStyle = "#c9d2da";
    ctx.font = "400 32px " + F;
    const today = new Date().toLocaleDateString(cls === "ar" ? "ar" : cls === "es" ? "es" : cls === "fr" ? "fr" : cls === "de" ? "de" : cls === "ru" ? "ru" : cls === "hi" ? "hi" : cls === "id" ? "id" : cls === "nl" ? "nl" : cls === "tr" ? "tr" : cls === "pt" ? "pt" : "en", { year: "numeric", month: "long", day: "numeric" });
    ctx.fillText(today, W / 2 - 330, footY);
    ctx.fillText(L.date, W / 2 - 330, footY + 42);
    ctx.fillText(L.signature, W / 2 + 330, footY + 42);
    // signature line
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(W / 2 + 200, footY);
    ctx.lineTo(W / 2 + 460, footY);
    ctx.stroke();
    // presenter under signature
    if (presenter.trim()) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "600 34px " + F;
      drawFit(ctx, presenter.trim(), footY + 96, 420, "#ffffff", "600", 34);
    }
    ctx.textBaseline = "alphabetic";
  };

  const drawFit = (ctx: CanvasRenderingContext2D, text: string, yCenter: number, maxW: number, color: string, weight: string, baseSize: number) => {
    let size = baseSize;
    const F = FONTS[font];
    ctx.font = `${weight} ${size}px ${F}`;
    while (size > 20 && ctx.measureText(text).width > maxW) {
      size -= 4;
      ctx.font = `${weight} ${size}px ${F}`;
    }
    ctx.fillStyle = color;
    ctx.fillText(text, W / 2, yCenter);
  };

  const renderToCanvas = (): HTMLCanvasElement => {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    draw(c);
    return c;
  };

  // live preview
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    // redraw once images/logo loaded-ish
    const t = setTimeout(() => draw(c), 30);
    return () => clearTimeout(t);
  }, [name, title, org, desc, certNo, presenter, theme, bg, accent, font, logoUrl, isRtl, L]);

  const downloadPng = async () => {
    const c = renderToCanvas();
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/png"));
    if (blob) downloadBlob(blob, "certificate.png");
  };

  const downloadPdf = async () => {
    setBusy(true);
    try {
      const c = renderToCanvas();
      const png = await new Promise<string | null>((res) => c.toBlob((b) => {
        if (!b) return res(null);
        const fr = new FileReader();
        fr.onload = () => res(fr.result as string);
        fr.readAsDataURL(b);
      }, "image/png"));
      if (!png) return;
      const { PDFDocument } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.create();
      const pageW = 842, pageH = 595;
      const page = pdfDoc.addPage([pageW, pageH]);
      const pngImage = await pdfDoc.embedPng(png);
      const scale = Math.min(pageW / pngImage.width, pageH / pngImage.height);
      const dw = pngImage.width * scale, dh = pngImage.height * scale;
      page.drawImage(pngImage, { x: (pageW - dw) / 2, y: (pageH - dh) / 2, width: dw, height: dh });
      const bytes = await pdfDoc.save();
      downloadBlob(new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }), "certificate.pdf");
    } finally {
      setBusy(false);
    }
  };

  const onLogo = (f: File | null) => {
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return;
    const fr = new FileReader();
    fr.onload = () => setLogoUrl(fr.result as string);
    fr.readAsDataURL(f);
  };

  const setThemeAnd = (k: string) => {
    setTheme(k);
    setBg(THEMES[k].bg1);
    setAccent(THEMES[k].accent);
  };

  const inputCls = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500";
  const labelCls = "mb-1 block text-xs text-ink-soft";

  const colorRow = (color: string, setter: (s: string) => void, label: string) =>
    <label className="flex items-center gap-2">
      <span className={labelCls + " mb-0"}>{label}</span>
      <input type="color" value={color} onChange={(e) => setter(e.target.value)} className="h-9 w-14 cursor-pointer rounded border border-line bg-transparent" />
    </label>;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Editor */}
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className={labelCls}>{L.namePh}</span>
            <input dir="auto" value={name} onChange={(e) => setName(e.target.value)} placeholder={L.namePh} className={inputCls} /></label>
          <label className="block"><span className={labelCls}>{L.titlePh}</span>
            <input dir="auto" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={L.titlePh} className={inputCls} /></label>
          <label className="block"><span className={labelCls}>{L.orgPh}</span>
            <input dir="auto" value={org} onChange={(e) => setOrg(e.target.value)} placeholder={L.orgPh} className={inputCls} /></label>
          <label className="block"><span className={labelCls}>{L.certNoPh}</span>
            <input dir="auto" value={certNo} onChange={(e) => setCertNo(e.target.value)} placeholder={L.certNoPh} className={inputCls} /></label>
        </div>
        <label className="block"><span className={labelCls}>{L.descPh}</span>
          <input dir="auto" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={L.descPh} className={inputCls} /></label>
        <label className="block"><span className={labelCls}>{L.presenterPh}</span>
          <input dir="auto" value={presenter} onChange={(e) => setPresenter(e.target.value)} placeholder={L.presenterPh} className={inputCls} /></label>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className={"text-xs text-ink-soft"}>{L.logo}:</span>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0] ?? null)} />
          <button onClick={() => logoInputRef.current?.click()} className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-brand-400 hover:text-brand-700">{L.uploadLogo}</button>
          {logoUrl && <button onClick={() => setLogoUrl(null)} className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-red-500 transition hover:border-red-300">{L.removeLogo}</button>}
        </div>

        {/* Design */}
        <div className="rounded-xl border border-line p-4">
          <span className={"mb-3 block text-sm font-semibold"}>{L.design}</span>
          <div className="mb-3">
            <span className={"mb-1.5 block text-xs text-ink-soft"}>{L.theme}</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(THEMES).map(([k, th]) => (
                <button key={k} onClick={() => setThemeAnd(k)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${theme === k ? "border-brand-400 bg-brand-50 text-brand-700" : "border-line text-ink-soft hover:border-brand-300"}`}
                  title={th.label}>
                  {L[k as keyof typeof LANGS["en"]] ?? th.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-4">
            {colorRow(bg, setBg, L.background)}
            {colorRow(accent, setAccent, L.accent)}
          </div>
          <div>
            <span className={"mb-1.5 block text-xs text-ink-soft"}>{L.font}</span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(FONTS) as (keyof typeof FONTS)[]).map((k) => (
                <button key={k} onClick={() => setFont(k)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${font === k ? "border-brand-400 bg-brand-50 text-brand-700" : "border-line text-ink-soft hover:border-brand-300"}`}
                  style={{ fontFamily: FONTS[k] }}>{k === "serif" ? L.serif : k === "sans" ? L.sans : L.minimal}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <PrimaryButton onClick={downloadPng} disabled={busy}>{L.downloadPng}</PrimaryButton>
          <PrimaryButton onClick={downloadPdf} disabled={busy}>{busy ? "…" : L.downloadPdf}</PrimaryButton>
        </div>
      </div>

      {/* Live preview */}
      <div>
        <span className={labelCls}>{L.preview}</span>
        <div className="overflow-hidden rounded-xl border border-line shadow-sm">
          <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full" style={{ display: "block" }} />
        </div>
      </div>
    </div>
  );
}
