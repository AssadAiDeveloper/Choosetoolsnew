"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Cormorant_Garamond, Amiri } from "next/font/google";
import { PrimaryButton, GhostButton } from "../ToolShell";
import { downloadBlob } from "@/lib/download";

const serifLatin = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "600"], style: ["normal", "italic"] });
const serifArabic = Amiri({ subsets: ["arabic"], weight: ["400", "700"] });

interface LineItem {
  desc: string;
  qty: number;
  rate: number;
  tax: number;
}

const newItem = (): LineItem => ({ desc: "", qty: 1, rate: 0, tax: 21 });

const CURRENCIES: Record<string, { sym: string; dec: number; pos: "before" | "after" }> = {
  USD: { sym: "$", dec: 2, pos: "before" }, EUR: { sym: "€", dec: 2, pos: "before" }, GBP: { sym: "£", dec: 2, pos: "before" },
  AED: { sym: "د.إ", dec: 2, pos: "after" }, SAR: { sym: "﷼", dec: 2, pos: "after" }, JPY: { sym: "¥", dec: 0, pos: "before" },
  CNY: { sym: "¥", dec: 2, pos: "before" }, INR: { sym: "₹", dec: 2, pos: "before" }, CAD: { sym: "CA$", dec: 2, pos: "before" },
  AUD: { sym: "A$", dec: 2, pos: "before" }, CHF: { sym: "Fr", dec: 2, pos: "before" }, BRL: { sym: "R$", dec: 2, pos: "before" },
  MXN: { sym: "$", dec: 2, pos: "before" }, ZAR: { sym: "R", dec: 2, pos: "before" }, NGN: { sym: "₦", dec: 2, pos: "before" },
  TRY: { sym: "₺", dec: 2, pos: "before" }, KRW: { sym: "₩", dec: 0, pos: "before" }, SEK: { sym: "kr", dec: 2, pos: "after" },
  NOK: { sym: "kr", dec: 2, pos: "after" }, DKK: { sym: "kr", dec: 2, pos: "after" }, PLN: { sym: "zł", dec: 2, pos: "after" },
  MAD: { sym: "د.م.", dec: 2, pos: "after" }, EGP: { sym: "£", dec: 2, pos: "before" }, QAR: { sym: "ر.ق", dec: 2, pos: "after" },
  KWD: { sym: "د.ك", dec: 3, pos: "after" }, SGD: { sym: "S$", dec: 2, pos: "before" }, NZD: { sym: "NZ$", dec: 2, pos: "before" },
};

const LANGS: Record<string, { invoice: string; from: string; to: string; desc: string; qty: string; rate: string; tax: string; amount: string; subtotal: string; discount: string; shipping: string; total: string; notes: string; bank: string; date: string; due: string; num: string; ref: string; paid: string; draft: string; sent: string; overdue: string }> = {
  en: { invoice: "INVOICE", from: "From", to: "Bill To", desc: "Description", qty: "Qty", rate: "Unit Price", tax: "Tax", amount: "Amount", subtotal: "Subtotal", discount: "Discount", shipping: "Additional", total: "Total Due", notes: "Notes & Terms", bank: "Payment Details", date: "Invoice Date", due: "Due Date", num: "Invoice No.", ref: "Reference", paid: "PAID", draft: "DRAFT", sent: "SENT", overdue: "OVERDUE" },
  ar: { invoice: "فاتورة", from: "من", to: "إلى", desc: "الوصف", qty: "الكمية", rate: "سعر الوحدة", tax: "الضريبة", amount: "المبلغ", subtotal: "المجموع الفرعي", discount: "خصم", shipping: "إضافي", total: "المستحق", notes: "ملاحظات وشروط", bank: "تفاصيل الدفع", date: "تاريخ الفاتورة", due: "تاريخ الاستحقاق", num: "رقم الفاتورة", ref: "المرجع", paid: "مدفوع", draft: "مسودة", sent: "مرسلة", overdue: "متأخرة" },
  nl: { invoice: "FACTUUR", from: "Van", to: "Aan", desc: "Omschrijving", qty: "Aantal", rate: "Eenheidsprijs", tax: "BTW", amount: "Bedrag", subtotal: "Subtotaal", discount: "Korting", shipping: "Extra", total: "Te betalen", notes: "Notities & Voorwaarden", bank: "Betalingsgegevens", date: "Factuurdatum", due: "Vervaldatum", num: "Factuurnummer", ref: "Referentie", paid: "BETAALD", draft: "CONCEPT", sent: "VERZONDEN", overdue: "VERLOPEN" },
  fr: { invoice: "FACTURE", from: "De", to: "À", desc: "Description", qty: "Qté", rate: "Prix unitaire", tax: "TVA", amount: "Montant", subtotal: "Sous-total", discount: "Remise", shipping: "Frais", total: "Total à payer", notes: "Notes & Conditions", bank: "Coordonnées bancaires", date: "Date", due: "Échéance", num: "N° Facture", ref: "Référence", paid: "PAYÉE", draft: "BROUILLON", sent: "ENVOYÉE", overdue: "EN RETARD" },
  es: { invoice: "FACTURA", from: "De", to: "Para", desc: "Descripción", qty: "Cant.", rate: "Precio unit.", tax: "IVA", amount: "Importe", subtotal: "Subtotal", discount: "Descuento", shipping: "Gastos", total: "Total a pagar", notes: "Notas y condiciones", bank: "Datos bancarios", date: "Fecha", due: "Vencimiento", num: "Nº Factura", ref: "Referencia", paid: "PAGADA", draft: "BORRADOR", sent: "ENVIADA", overdue: "VENCIDA" },
  de: { invoice: "RECHNUNG", from: "Von", to: "An", desc: "Beschreibung", qty: "Menge", rate: "Einzelpreis", tax: "MwSt", amount: "Betrag", subtotal: "Zwischensumme", discount: "Rabatt", shipping: "Zusatzkosten", total: "Gesamtbetrag", notes: "Hinweise & Bedingungen", bank: "Bankverbindung", date: "Datum", due: "Fälligkeit", num: "Rechnungsnr.", ref: "Referenz", paid: "BEZAHLT", draft: "ENTWURF", sent: "GESENDET", overdue: "ÜBERFÄLLIG" },
  ja: { invoice: "請求書", from: "請求元", to: "請求先", desc: "品目", qty: "数量", rate: "単価", tax: "税率", amount: "金額", subtotal: "小計", discount: "割引", shipping: "追加料金", total: "合計請求額", notes: "備考・支払条件", bank: "振込先", date: "請求日", due: "支払期日", num: "請求書番号", ref: "参照番号", paid: "支払済", draft: "下書き", sent: "送付済", overdue: "期限超過" },
  zh: { invoice: "发票", from: "发票方", to: "收票方", desc: "项目描述", qty: "数量", rate: "单价", tax: "税率", amount: "金额", subtotal: "小计", discount: "折扣", shipping: "其他费用", total: "应付总额", notes: "备注与条款", bank: "付款信息", date: "开票日期", due: "到期日", num: "发票编号", ref: "参考编号", paid: "已付款", draft: "草稿", sent: "已发送", overdue: "已逾期" },
  pt: { invoice: "FATURA", from: "De", to: "Para", desc: "Descrição", qty: "Qtd", rate: "Preço unit.", tax: "IVA", amount: "Valor", subtotal: "Subtotal", discount: "Desconto", shipping: "Adicionais", total: "Total a pagar", notes: "Notas e Termos", bank: "Dados bancários", date: "Data", due: "Vencimento", num: "N° Fatura", ref: "Referência", paid: "PAGO", draft: "RASCUNHO", sent: "ENVIADA", overdue: "VENCIDA" },
  tr: { invoice: "FATURA", from: "Gönderen", to: "Alıcı", desc: "Açıklama", qty: "Miktar", rate: "Birim Fiyat", tax: "KDV", amount: "Tutar", subtotal: "Ara Toplam", discount: "İndirim", shipping: "Ek Ücret", total: "Ödenecek Tutar", notes: "Notlar ve Koşullar", bank: "Banka Bilgileri", date: "Fatura Tarihi", due: "Vade Tarihi", num: "Fatura No", ref: "Referans", paid: "ÖDENDİ", draft: "TASLAK", sent: "GÖNDERİLDİ", overdue: "VADESİ GEÇMİŞ" },
};

const LANG_NAMES: Record<string, string> = {
  en: "English", ar: "العربية", nl: "Nederlands", fr: "Français", es: "Español",
  de: "Deutsch", ja: "日本語", zh: "中文", pt: "Português", tr: "Türkçe",
};

const TAX_LABELS = ["VAT", "BTW", "GST", "HST", "Sales Tax", "TVA", "IVA", "MwSt", "消費税", "增值税", "KDV", "None"];
const ACCENTS = ["#c9974a", "#2a6fdb", "#16a34a", "#9333ea", "#dc2626", "#0d9488", "#1a1a2e"];
const STATUSES = ["draft", "sent", "paid", "overdue"] as const;
type Status = (typeof STATUSES)[number];
const STATUS_STYLE: Record<Status, { bg: string; fg: string }> = {
  draft: { bg: "#f0f0f0", fg: "#888888" },
  sent: { bg: "#e8f0fe", fg: "#1967d2" },
  paid: { bg: "#e6f4ea", fg: "#1e8e3e" },
  overdue: { bg: "#fce8e6", fg: "#c5221f" },
};

const defaultDate = (offsetDays = 0) => {
  const d = new Date();
  if (offsetDays) d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

export default function InvoiceGenerator() {
  const locale = useLocale();
  const isRtlLocale = locale === "ar";

  const L =
    isRtlLocale
      ? {
          settings: "الإعدادات", company: "الشركة", client: "العميل", items: "البنود", notes: "الملاحظات",
          currency: "العملة", taxSystem: "نظام الضريبة", invoiceLang: "لغة الفاتورة", invoiceNo: "رقم الفاتورة", status: "الحالة", invDate: "تاريخ الفاتورة", dueDate: "تاريخ الاستحقاق", poNumber: "رقم مرجعي (PO)",
          draft: "مسودة", sent: "مرسلة", paid: "مدفوعة", overdue: "متأخرة",
          yourBusiness: "شركتك / اسمك", companyName: "اسم الشركة", tagline: "الشعار أو المجال", address: "العنوان", email: "البريد الإلكتروني", phone: "الهاتف", vatNumber: "الرقم الضريبي", regNumber: "السجل التجاري", bankIban: "رقم الحساب / IBAN", website: "الموقع الإلكتروني", uploadLogo: "رفع شعار", removeLogo: "إزالة الشعار", logoWatermark: "عرض الشعار كعلامة مائية", watermarkHint: "في منتصف الفاتورة خلف البنود بشكل خفيف",
          clientName: "اسم العميل", contactPerson: "الشخص المسؤول", clientAddress: "عنوان العميل", clientEmail: "بريد العميل", clientPhone: "هاتف العميل", clientVat: "الرقم الضريبي للعميل", clientCode: "رمز العميل",
          description: "الوصف", qty: "الكمية", rate: "سعر الوحدة", taxPct: "الضريبة٪", total: "الإجمالي", addItem: "إضافة بند", discountPercent: "الخصم ٪", shippingExtras: "الشحن / إضافات",
          notesAndTerms: "ملاحظات وشروط الدفع", paymentDetails: "تفاصيل الدفع", legalFooter: "تذييل قانوني", colorAccent: "لون الفاتورة", customColor: "لون مخصص",
          downloadPdf: "تنزيل PDF", clearForm: "مسح النموذج", livePreview: "معاينة حية", zoom: "تكبير",
          invalidLogo: "يجب أن يكون حجم الشعار أقل من 2MB", clearConfirm: "هل تريد مسح جميع الحقول وإعادة تعيين الفاتورة؟",
          loadInvoice: "تحميل فاتورة خارجية", reading: "جارٍ قراءة الفاتورة…", importDone: "تم استيراد بيانات الفاتورة", importFail: "تعذّر قراءة الفاتورة",
        }
      : locale === "es"
      ? {
          settings: "Configuración", company: "Empresa", client: "Cliente", items: "Conceptos", notes: "Notas",
          currency: "Moneda", taxSystem: "Sistema fiscal", invoiceLang: "Idioma de la factura", invoiceNo: "N.º de factura", status: "Estado", invDate: "Fecha", dueDate: "Vencimiento", poNumber: "N.º de referencia",
          draft: "Borrador", sent: "Enviada", paid: "Pagada", overdue: "Vencida",
          yourBusiness: "Tu empresa", companyName: "Nombre de la empresa", tagline: "Eslogan / Sector", address: "Dirección", email: "Correo", phone: "Teléfono", vatNumber: "N.º de IVA", regNumber: "N.º de registro", bankIban: "IBAN", website: "Sitio web", uploadLogo: "Subir logo", removeLogo: "Quitar logo", logoWatermark: "Mostrar logo como marca de agua", watermarkHint: "Centrado detrás de los conceptos, sutil",
          clientName: "Nombre del cliente", contactPerson: "Persona de contacto", clientAddress: "Dirección del cliente", clientEmail: "Correo del cliente", clientPhone: "Teléfono del cliente", clientVat: "IVA del cliente", clientCode: "Código del cliente",
          description: "Descripción", qty: "Cant.", rate: "Precio unit.", taxPct: "Impuesto %", total: "Total", addItem: "Añadir concepto", discountPercent: "Descuento %", shippingExtras: "Envío / Extras",
          notesAndTerms: "Notas y condiciones", paymentDetails: "Detalles de pago", legalFooter: "Texto legal", colorAccent: "Color de la factura", customColor: "Color personalizado",
          downloadPdf: "Descargar PDF", clearForm: "Limpiar formulario", livePreview: "Vista previa", zoom: "Zoom",
          invalidLogo: "El logo debe pesar menos de 2MB", clearConfirm: "¿Borrar todos los campos y reiniciar la factura?",
          loadInvoice: "Cargar factura externa", reading: "Leyendo factura…", importDone: "Datos de factura importados", importFail: "No se pudo leer la factura",
        }
      : {
          settings: "Settings", company: "Company", client: "Client", items: "Items", notes: "Notes",
          currency: "Currency", taxSystem: "Tax System", invoiceLang: "Invoice Language", invoiceNo: "Invoice Number", status: "Status", invDate: "Invoice Date", dueDate: "Due Date", poNumber: "PO / Reference",
          draft: "Draft", sent: "Sent", paid: "Paid", overdue: "Overdue",
          yourBusiness: "Your business", companyName: "Company name", tagline: "Tagline / Industry", address: "Address", email: "Email", phone: "Phone", vatNumber: "VAT / Tax number", regNumber: "Chamber of Commerce", bankIban: "Bank / IBAN", website: "Website", uploadLogo: "Upload logo", removeLogo: "Remove logo", logoWatermark: "Show logo as watermark", watermarkHint: "Centered behind the line items — subtle and professional",
          clientName: "Client name", contactPerson: "Contact person", clientAddress: "Client address", clientEmail: "Client email", clientPhone: "Client phone", clientVat: "Client VAT / Tax ID", clientCode: "Client code",
          description: "Description", qty: "Qty", rate: "Rate", taxPct: "Tax %", total: "Total", addItem: "Add line item", discountPercent: "Discount %", shippingExtras: "Shipping / Extras",
          notesAndTerms: "Notes & payment terms", paymentDetails: "Payment details", legalFooter: "Legal footer", colorAccent: "Invoice color", customColor: "Custom color",
          downloadPdf: "Download PDF", clearForm: "Clear form", livePreview: "Live Preview", zoom: "Zoom",
          invalidLogo: "Logo must be under 2MB", clearConfirm: "Clear all fields and reset the invoice?",
          loadInvoice: "Load external invoice", reading: "Reading invoice…", importDone: "Invoice data imported", importFail: "Could not read the invoice",
        };

  interface State {
    currency: string;
    taxLabel: string;
    lang: string;
    invoiceNum: string;
    status: Status;
    invDate: string;
    dueDate: string;
    poNum: string;
    logo: string;
    wmEnabled: boolean;
    fromName: string; fromTagline: string; fromAddr: string; fromEmail: string; fromPhone: string; fromTax: string; fromKvk: string; fromBank: string; fromWeb: string;
    toName: string; toContact: string; toAddr: string; toEmail: string; toPhone: string; toTax: string; toCode: string;
    discount: number; shipping: number;
    notes: string; bankDetails: string; footer: string;
    accent: string;
  }

  const [s, setS] = useState<State>({
    currency: "EUR",
    taxLabel: "VAT",
    lang: "en",
    invoiceNum: "INV-2026-001",
    status: "draft",
    invDate: defaultDate(),
    dueDate: defaultDate(30),
    poNum: "",
    logo: "",
    wmEnabled: true,
    fromName: "", fromTagline: "", fromAddr: "", fromEmail: "", fromPhone: "", fromTax: "", fromKvk: "", fromBank: "", fromWeb: "",
    toName: "", toContact: "", toAddr: "", toEmail: "", toPhone: "", toTax: "", toCode: "",
    discount: 0, shipping: 0,
    notes: "", bankDetails: "", footer: "",
    accent: ACCENTS[0],
  });
  const set = (patch: Partial<State>) => setS((p) => ({ ...p, ...patch }));

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (!q.get("src")) return;
      const uiToInv: Record<string, string> = { en: "en", ar: "ar", es: "es", nl: "nl", fr: "fr", de: "de", pt: "pt", tr: "tr" };
      const lang = uiToInv[q.get("lang") || ""];
      const patch: Partial<State> = {};
      if (lang) patch.lang = lang;
      if (q.get("fromName")) patch.fromName = q.get("fromName")!;
      if (q.get("toName")) patch.toName = q.get("toName")!;
      if (q.get("toContact")) patch.toContact = q.get("toContact")!;
      if (q.get("invoiceNum")) patch.invoiceNum = q.get("invoiceNum")!;
      if (q.get("invDate")) patch.invDate = q.get("invDate")!;
      if (Object.keys(patch).length) set(patch);
    } catch {
      /* ignore malformed query */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [items, setItems] = useState<LineItem[]>([newItem()]);
  const [tab, setTab] = useState<"settings" | "company" | "client" | "items" | "notes">("settings");
  const [zoomed, setZoomed] = useState(false);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; msg: string } | null>(null);
  const invInputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const Lx = LANGS[s.lang] || LANGS.en;
  const isRtl = s.lang === "ar";
  const dir = isRtl ? "rtl" : "ltr";
  const serifFamily = isRtl ? serifArabic.style.fontFamily : serifLatin.style.fontFamily;
  const showTax = s.taxLabel !== "None";

  const fmt = (amount: number) => {
    const cur = CURRENCIES[s.currency] || CURRENCIES.EUR;
    const n = parseFloat(String(amount)) || 0;
    const formatted = n.toFixed(cur.dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return cur.pos === "before" ? `${cur.sym}${formatted}` : `${formatted} ${cur.sym}`;
  };

  const subtotal = items.reduce((sum, it) => sum + it.qty * it.rate, 0);
  const discAmt = subtotal * ((s.discount || 0) / 100);
  const afterDisc = subtotal - discAmt;
  const totalTax = showTax ? items.reduce((sum, it) => sum + (it.qty * it.rate * (1 - ((s.discount || 0) / 100)) * it.tax) / 100, 0) : 0;
  const grand = afterDisc + totalTax + s.shipping;

  const updateItem = (i: number, patch: Partial<LineItem>) =>
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const addItem = () => setItems((arr) => [...arr, newItem()]);
  const delItem = (i: number) => setItems((arr) => (arr.length === 1 ? arr : arr.filter((_, idx) => idx !== i)));

  const onLogo = (file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert(L.invalidLogo);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set({ logo: reader.result as string });
    reader.readAsDataURL(file);
  };

  const fileToDataUrl = (f: File) => new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });

  const renderPdfPage = async (buf: ArrayBuffer): Promise<string> => {
    const pdfjs: any = await import("pdfjs-dist");
    if (!(globalThis as any).pdfjsWorker) {
      await import("pdfjs-dist/build/pdf.worker.mjs");
    }
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 2.5 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
    return canvas.toDataURL("image/png");
  };

  const SCRIPT_TO_LANGS: Record<string, string> = {
    Arabic: "ara+eng",
    Latin: "eng+ara+spa+fra+deu+nld+por+tur",
    Cyrillic: "rus+eng+ara",
    Devanagari: "hin+eng+ara",
  };

  const pickLangs = (script: string): string => {
    for (const key of Object.keys(SCRIPT_TO_LANGS)) {
      if ((script || "").toLowerCase().includes(key.toLowerCase())) return SCRIPT_TO_LANGS[key];
    }
    return "eng+ara+spa+fra+deu+nld+por+tur";
  };

  const ocrAuto = async (dataUrl: string): Promise<{ text: string; script: string; langs: string }> => {
    const T: any = await import("tesseract.js");
    let script = "";
    try {
      const dWorker: any = await T.createWorker("osd");
      try {
        const det = await dWorker.detect(dataUrl);
        script = (det.data && det.data.script) || "";
      } finally {
        await dWorker.terminate();
      }
    } catch {
      /* OSD unavailable — fall through to defaults */
    }
    const langs = pickLangs(script);
    try {
      const worker: any = await T.createWorker(langs);
      try {
        const { data } = await worker.recognize(dataUrl);
        return { text: data.text || "", script, langs };
      } finally {
        await worker.terminate();
      }
    } catch {
      const fallback = "eng+ara+deu+spa+fra+nld+por+tur+rus+hin+ind";
      const worker: any = await T.createWorker(fallback);
      try {
        const { data } = await worker.recognize(dataUrl);
        return { text: data.text || "", script, langs: fallback };
      } finally {
        await worker.terminate();
      }
    }
  };

  const csvToText = async (file: File): Promise<string> => {
    const buf = new Uint8Array(await file.arrayBuffer());
    const str = new TextDecoder("utf-8").decode(buf);
    const Papa: any = await import("papaparse");
    const parsed = Papa.parse(str, { skipEmptyLines: true });
    return (parsed.data as unknown[][]).map((row) => row.join(" | ")).join("\n");
  };

  const xlsxToText = async (buf: ArrayBuffer): Promise<string> => {
    const { Workbook }: any = await import("exceljs");
    const wb = new Workbook();
    await wb.xlsx.load(buf);
    const lines: string[] = [];
    wb.eachSheet((ws: any) => {
      ws.eachRow({ includeEmpty: false }, (row: any) => {
        const vals = row.values.slice(1).map((v: any) => String(v ?? "").trim()).filter(Boolean);
        if (vals.length) lines.push(vals.join(" | "));
      });
    });
    return lines.join("\n");
  };

  const toIsoDate = (raw: string): string => {
    const s = raw.trim();
    let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (m) {
      let d = m[1];
      let mo = m[2];
      if (Number(mo) > 12) { const t = d; d = mo; mo = t; }
      return `${m[3]}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    return s;
  };

  const loadExternalInvoice = async (file: File) => {
    if (!file) return;
    setImporting(true);
    setNotice(null);
    try {
      const name = (file.name || "").toLowerCase();
      let text = "";
      let script = "";
      let langOverride: string | undefined;
      if (name.endsWith(".pdf")) {
        const dataUrl = await renderPdfPage(await file.arrayBuffer());
        const r = await ocrAuto(dataUrl);
        text = r.text;
        script = r.script;
      } else if (/\.(png|jpe?g|webp|gif|bmp)$/.test(name)) {
        const r = await ocrAuto(await fileToDataUrl(file));
        text = r.text;
        script = r.script;
      } else if (name.endsWith(".csv")) {
        text = await csvToText(file);
      } else if (name.endsWith(".xlsx")) {
        text = await xlsxToText(await file.arrayBuffer());
      } else {
        const r = await ocrAuto(await fileToDataUrl(file));
        text = r.text;
        script = r.script;
      }
      if (/[\u0600-\u06FF]/u.test(text)) {
        langOverride = "ar";
      } else if (/arabic/i.test(script)) {
        langOverride = "ar";
      }
      const { patch, items: newItems } = fillFromText(text);
      if (langOverride) patch.lang = langOverride;
      const filledAny = Object.keys(patch).length > 0 || newItems.some((it) => it.desc || it.rate > 0);
      if (filledAny) {
        set(patch);
        if (newItems.length) setItems(newItems);
        setNotice({ ok: true, msg: L.importDone });
      } else {
        setNotice({ ok: false, msg: L.importFail });
      }
    } catch (err) {
      console.error("invoice import failed", err);
      setNotice({ ok: false, msg: L.importFail });
    } finally {
      setImporting(false);
    }
  };

  const fillFromText = (text: string): { patch: Partial<State>; items: LineItem[] } => {
    const clean = text.split(/\r?\n/).map((l) => l.replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\u00AD]/g, "").replace(/[–—]/g, "-").trim()).filter(Boolean);
    const joined = clean.join(" | ");
    const patch: Partial<State> = {};

    const cur = detectCurrency(joined);
    if (cur && CURRENCIES[cur]) patch.currency = cur;

    const invNo = detectInvoiceNumber(joined);
    if (invNo) patch.invoiceNum = invNo;

    const st = detectStatus(joined);
    if (st) patch.status = st;

    const dateRe = /\b(\d{1,4}[/\-.]\d{1,2}[/\-.]\d{1,4})\b/g;
    const dates: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = dateRe.exec(joined))) dates.push(m[1]);
    if (dates.length) {
      const invD = nearestDate(joined, /(invoice date|facture date|تاريخ الفاتورة|fecha|datum|date\b|تاریخ|invoice\b|rechnungsdatum)/i, dates);
      const dueD = nearestDate(joined, /(due date|due|تاريخ الاستحقاق|استحقاق|vencim|fällig|verval|échéance|vouchers?|valuta|einddatum)/i, dates);
      patch.invDate = invD ? toIsoDate(invD) : toIsoDate(dates[0]);
      patch.dueDate = dueD ? toIsoDate(dueD) : "";
    }

    const monthWords: Record<string, number> = {
      januari: 1, january: 1, januar: 1, janvier: 1, janeiro: 1, enero: 1, ocak: 1,
      februari: 2, february: 2, februar: 2, février: 2, fevereiro: 2, febrero: 2,
      maart: 3, mars: 3, march: 3, märz: 3, marzo: 3, março: 3,
      april: 4, abril: 4,
      mei: 5, mai: 5, may: 5, mayo: 5, maio: 5,
      juni: 6, june: 6, juin: 6, junho: 6, junio: 6,
      juli: 7, july: 7, juillet: 7, julio: 7, julho: 7,
      augustus: 8, august: 8, août: 8, agosto: 8,
      september: 9, septembre: 9, settembre: 9, septiembre: 9, setembro: 9,
      october: 10, oktober: 10, octobre: 10, outubro: 10, octubre: 10,
      november: 11, novembre: 11, noviembre: 11, novembro: 11,
      december: 12, dezember: 12, décembre: 12, diciembre: 12, dezembro: 12,
    };
    const mwRe = new RegExp(`\\b(\\d{1,2})\\s+(${Object.keys(monthWords).join("|")})\\s+(\\d{4})\\b`, "i");
    const mwDate = (line: string): string | null => {
      const mm = line.match(mwRe);
      if (!mm) return null;
      return `${mm[3]}-${String(monthWords[mm[2].toLowerCase()]).padStart(2, "0")}-${mm[1].padStart(2, "0")}`;
    };
    if (!patch.invDate) {
      const invLine = clean.find((l) => mwRe.test(l) && !/(due|verval|استحقاق|expires?|verloopt|vervalt)/i.test(l));
      if (invLine) patch.invDate = mwDate(invLine) || patch.invDate;
    }
    if (!patch.dueDate) {
      const dueLine = clean.find((l) => mwRe.test(l) && /(due|verval|استحقاق|expires?|verloopt|vervalt)/i.test(l));
      if (dueLine) patch.dueDate = mwDate(dueLine) || patch.dueDate;
    }
    if (!patch.invDate) {
      const anyLine = clean.find((l) => mwRe.test(l));
      if (anyLine) patch.invDate = mwDate(anyLine) || patch.invDate;
    }

    const emails = [...joined.matchAll(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g)].map((mm) => mm[1]);
    const joinedNoIban = joined.replace(/\b(?:iban|bankrekening|account|bank)\s*:?\s*[A-Z0-9][A-Z0-9.\- ]{7,34}\b/gi, " ");
    const phones = [...joinedNoIban.matchAll(/(?:\+?\d[\d\s\-()]{6,}\d)/g)].map((mm) => mm[0].replace(/\s+/g, " ").trim());
    const taxRe = /(?:\bVAT\b|\bTVA\b|\bIVA\b|\bBTW\b|MwSt\.?|رقم ضريبي|الضريبة)\s*(?:num(?:mer)?|n(?:r|o)\.?)?\s*[:-]?\s*([A-Z]{1,3}\d[\dA-Za-z\-]*)/i;
    const taxMatch = joined.match(taxRe);

const toIdx = clean.findIndex((l) => /^(bill\s*to|billed\s*to|to\b\s*[:—-]?|إلى\s*[:—-]?|بخصوص|aan\s*[:—-]?|an\b\s*[:—-]?|para|a\b\s*[:—-]?|à\b\s*[:—-]?|rechnung\s*an|facturar\s*a|destinatario)/i.test(l.trim()));
    const invWordIdx = clean.findIndex((l) => /^(invoice|facture|fatura|rechnung|فاتورة|invoice no)/i.test(l.trim()));
    const fromIdx0 = clean.findIndex((l) => /^(bill\s*from|from\b\s*[:—-]?|من\s*[:—-]?|van\s*:|von\b\s*[:—-]?|de:\s*)/i.test(l.trim()));
    const phonesClean = phones.map((p) => p.replace(/\s+/g, ""));
    const labelLess = toIdx < 0 && fromIdx0 < 0;
    const clientMetaRe = /^(factuurnummer|factuurdatum|debiteurnummer|dossiernummer|invoice\s*(no|date)|رقم الفاتورة|تاريخ|factura\s*(n|no)|reference|datum\s*:)/i;
    const metaStartsAt = labelLess ? clean.findIndex((l) => clientMetaRe.test(l)) : -1;
    const clientCut = metaStartsAt >= 0 ? metaStartsAt : Math.min(3, clean.length);
    let fromName = "";
    let fromAddr = "";
    if (fromIdx0 >= 0) {
      const labelLine = clean[fromIdx0];
      const inline = labelLine.replace(/^.*?[:—]\s*/, "").trim();
      const inlineBad = !inline || inline === labelLine || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inline) || /^\+?[\d\s\-()]{7,}$/.test(inline) || /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(inline);
      const hasInline = !inlineBad;
      const block = clean.slice(fromIdx0 + 1);
      fromName = hasInline ? inline : block[0] || "";
      const addrLines = (hasInline ? block : block.slice(1)).filter(
        (l) => !emails.includes(l)
          && !phonesClean.includes(l.replace(/\s+/g, ""))
          && !/^(vat|tax|tva|iva|btw|mwst|رقم ضريبي|الضريبة)\s*[:#]?/i.test(l)
      ).slice(0, 2);
      fromAddr = addrLines.join(", ");
    } else if (labelLess) {
      let taxIdx = -1;
      for (let i = clean.length - 1; i >= 0; i--) {
        if (/(kvk\s*num(?:mer)?|btw[\s-]*num(?:mer)?|iban|bankrekening|vat\s*(no|number)|رقم ضريبي|الضريبة)/i.test(clean[i])) { taxIdx = i; break; }
      }
      if (taxIdx >= 0) {
        let nameIdx = -1;
        for (let i = taxIdx - 1; i >= Math.max(0, taxIdx - 8); i--) {
          const cand = clean[i].trim();
          const stripped = cand.replace(/\s+(?:T|M|F|Tel)\.?\s*:.*$/i, "").replace(/\s+www\..*$/i, "").trim();
          if (/^(www\.|http|tel)(\s|$)/i.test(cand)) continue;
          if (/^(omschrijving|description|bedrag|qty|aantal|hoeveelheid|totaal|subtotaal|subtotal|total|opmerking|nota)/i.test(cand)) continue;
          if (/^[A-Za-zÀ-ž][A-Za-zÀ-ž .'&()/\-]{1,45}$/.test(stripped) && stripped.length >= 3) { nameIdx = i; break; }
        }
        if (nameIdx >= 0) {
          fromName = clean[nameIdx].trim().replace(/\s+(?:T|M|F|Tel)\.?\s*:.*$/i, "").replace(/\s+www\..*$/i, "").trim();
          const addr = [clean[nameIdx + 1], clean[nameIdx + 2]]
            .map((l) => (l || "").replace(/\s*(?:M|F|T|Tel)\.?\s*:.*$/i, "").replace(/\s*(?:KvK|BTW).*$/i, "").trim())
            .filter((l) => l && !emails.includes(l) && !phonesClean.includes(l.replace(/\s+/g, "")) && !/(kvk|btw|iban|bankrekening|الضريبة|:)/i.test(l));
          fromAddr = addr.join(", ");
        }
      }
    } else {
      const start = labelLess ? clientCut : invWordIdx >= 0 ? invWordIdx : 0;
      const metaRe = /^(invoice|facture|fatura|rechnung|فاتورة)\s*$|^(invoice\s*(no|date)|date\b|no\.?|nr\.?|رقم الفاتورة|تاريخ|reference|po\s*number)/i;
      for (let i = start; i < clean.length; i++) {
        const line = clean[i];
        if (!line || metaRe.test(line) || /\d{4}[-/.]/.test(line) && line.length < 40) continue;
        if (emails.includes(line) || phonesClean.includes(line.replace(/\s+/g, ""))) continue;
        if (line.length > 2 && line.length < 60) { fromName = line; break; }
      }
      if (!fromName && clean[0] && !/^\d/.test(clean[0]) && clean[0].length < 60) fromName = clean[0];
      if (!fromName) fromName = clean[1] || "";
    }
    if (!fromName && labelLess && clientCut < clean.length) {
      const cand = clean.slice(clientCut).find((l) => !clientMetaRe.test(l)
        && !/^\d/.test(l)
        && !l.includes(":")
        && !/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(l)
        && !emails.includes(l)
        && !phonesClean.includes(l.replace(/\s+/g, ""))
        && l.length > 2 && l.length < 60);
      if (cand) fromName = cand;
    }
    if (fromName) patch.fromName = fromName;
    if (fromAddr) patch.fromAddr = fromAddr;
    if (emails[0]) patch.fromEmail = emails[0];
    if (phones[0]) patch.fromPhone = phones[0];
    if (taxMatch) patch.fromTax = taxMatch[1];

    if (toIdx >= 0) {
      const labelLine = clean[toIdx];
      const inlineName = labelLine.replace(/^.*?[:—]\s*/, "").trim();
      const block = clean.slice(toIdx + 1);
      const b: string[] = [];
      for (const line of block) {
        if (line && /(description|الوصف|omschrijving|описание|descripci|beschreibung)/i.test(line) && /(qty|الكمية|عدد|aantal|qtt|cant|menge)/i.test(line)) break;
        if (line && /^(sub\s?total|المجموع الفرعي|total|المستحق|zwischensumme|sous-total|subtotaal)/i.test(line)) break;
        b.push(line);
      }
      const inlineGood = inlineName && inlineName !== labelLine
        && !/^(bill\s*to|إلى|aan|an|to|para|a|à|destinatario)/i.test(inlineName)
        && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inlineName)
        && !/^\+?[\d\s\-()]{7,}$/.test(inlineName)
        && !/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(inlineName);
      if (inlineGood) {
        patch.toName = inlineName;
      } else {
        let k = 0;
        while (k < b.length && (emails.slice(1).includes(b[k])
          || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b[k])
          || phonesClean.slice(1).includes(b[k].replace(/\s+/g, ""))
          || /^\+?[\d\s\-()]{7,}$/.test(b[k])
          || /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(b[k])
          || /^(attn|عناية|atención|für|betreff|vat|tax|tva|iva|btw|mwst|iban|رقم ضريبي)\s*[:#]?/i.test(b[k]))) k++;
        if (k < b.length) { patch.toName = b[k].replace(/^.*?[:—]\s*/, "").trim(); b.splice(k, 1); }
      }
      for (const line of b) {
        if (/^attn|عناية|atención|für|betreff/i.test(line)) { patch.toContact = line.replace(/^(attn\.?|عناية|atención)\s*[:—]?/i, "").trim(); continue; }
        if (/^(vat|tax|tva|iva|btw|mwst|iban|رقم ضريبي)\s*[:#]?/i.test(line)) continue;
        if (emails.slice(1).includes(line)) { patch.toEmail = line; continue; }
        if (phonesClean.slice(1).includes(line.replace(/\s+/g, ""))) { patch.toPhone = line; continue; }
        patch.toAddr = (patch.toAddr ? patch.toAddr + ", " : "") + line;
      }
    } else if (labelLess) {
      const clientBlock = clean.slice(0, clientCut).filter((l) => !clientMetaRe.test(l)
        && !emails.includes(l)
        && !phonesClean.includes(l.replace(/\s+/g, ""))
        && !/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(l));
      if (clientBlock[0]) {
        patch.toName = clientBlock[0];
        patch.toAddr = clientBlock.slice(1, 3).join(", ");
      }
    }
    if (toIdx >= 0) {
      if (!patch.toEmail && emails[1]) patch.toEmail = emails[1];
      if (!patch.toPhone && phones[1]) patch.toPhone = phones[1];
    }

    const items: LineItem[] = [];
    const headerIdx = clean.findIndex((l) => /(description|الوصف|omschrijving|opисание|descripci|beschreibung|وضح)/i.test(l) && /(qty|الكمية|عدد|hoeveelheid|aantal|qtt|cant|menge)/i.test(l));
    const totalsIdx = clean.findIndex((l) => /(sub\s?total|المجموع|zwischensumme|sous-total|subtotaal|subtotal|totaal)/i.test(l));
    const start = headerIdx >= 0 ? headerIdx + 1 : labelLess ? clientCut : 0;
    const end = totalsIdx >= 0 ? totalsIdx : clean.length;
    const metaLineRe = /^(factuurnummer|factuurnr|factuurdatum|debiteurnummer|dossiernummer|inzake|referentie|invoice\s*(no|date)|رقم الفاتورة|تاريخ|datum\s*:|rekening|betreft)/i;
    for (const line of clean.slice(start, end)) {
      if (!/\d/.test(line)) continue;
      if (metaLineRe.test(line)) continue;
      if (/(bill\s*to|إلى|aan:|sub\s?total|subtotaal|subtotal|total|totaal|discount|shipping|tax|الضريبة|خصم|المجموع)/i.test(line) && /[a-z]{4}/i.test(line)) continue;
      const tokens = line.split(/\s+/);
      const numIdx = tokens.map((t, i) => (/^[0-9][0-9.,]*%?$/.test(t) ? i : -1)).filter((i) => i >= 0);
      if (numIdx.length === 0) continue;
      const parseNum = (t: string) => parseFloat(String(t).replace(/[%,]/g, "")) || 0;
      if (numIdx.length === 1) {
        const only = parseNum(tokens[numIdx[0]]);
        if (only <= 0) continue;
        const sdesc = tokens.filter((t, i) => i !== numIdx[0] && !/^[€$£¥]/.test(t)).join(" ").replace(/\s{2,}/g, " ").trim();
        if (!sdesc || sdesc.length > 90) continue;
        items.push({ desc: sdesc.slice(0, 90).replace(/[€$£¥]\s*$/, ""), qty: 1, rate: only, tax: 0 });
        continue;
      }
      if (numIdx.length < 2) continue;
      const last = numIdx[numIdx.length - 1];
      const descStart = tokens.findIndex((t) => !/^[0-9][0-9.,]*%?$/.test(t));
      const isRTLRow = numIdx[0] === 0 && descStart !== -1 && descStart > last;
      let total: number;
      let rate: number;
      let qty: number;
      let tax = 0;
      let desc = "";
      if (isRTLRow) {
        const nums = numIdx.map((i) => tokens[i]);
        total = parseNum(nums[0]);
        rate = parseNum(nums[1] || "");
        qty = parseNum(nums[nums.length - 1]) || 1;
        desc = tokens.slice(descStart).join(" ").replace(/\s{2,}/g, " ").trim();
      } else {
        total = parseNum(tokens[last]);
        rate = parseNum(tokens[last - 1]);
        const taxTok = tokens[last - 2] && /%$/.test(tokens[last - 2]) ? tokens[last - 2] : "";
        tax = taxTok ? parseNum(taxTok) : 0;
        const qtyTok = taxTok ? tokens[last - 3] : tokens[last - 2];
        qty = qtyTok ? parseNum(qtyTok) : 1;
        desc = (tokens.slice(0, last - (taxTok ? 3 : 2)).join(" ")).replace(/\s{2,}/g, " ").trim();
      }
      if (!desc || desc.length > 90) continue;
      if (total <= 0 && rate <= 0) continue;
      items.push({ desc: desc.slice(0, 90), qty: qty || 1, rate, tax });
    }

    const discRe = /(discount|خصم|خصم|remise|rabatt|korting|descuento|disc)/i;
    const shipRe = /(shipping|الشحن|versand|verzend|envío|gastos|frais|extra|fra)/i;
    const subRe = /(sub\s?total|المجموع|zwischensumme|sous-total|subtotaal|subtotal|totaal)/i;
    const nearAmount = (re: RegExp): number | null => {
      const lineIdx = clean.findIndex((l) => re.test(l));
      if (lineIdx < 0) return null;
      for (let k = lineIdx; k < Math.min(lineIdx + 4, clean.length); k++) {
        const mm = clean[k].match(/[\d][\d.,]*/);
        if (mm && mm.index !== undefined && (k === lineIdx || mm.index > 2)) {
          const num = parseFloat(mm[0].replace(/,/g, ""));
          if (!isNaN(num) && num >= 0) return num;
        }
      }
      return null;
    };
    const subTotal = nearAmount(subRe);
    const discAmt = nearAmount(discRe);
    if (discAmt != null) {
      const pct = subTotal && subTotal > 0 ? Math.round((discAmt / subTotal) * 100) : 0;
      if (pct) patch.discount = pct;
    }
    const ship = nearAmount(shipRe);
    if (ship != null) patch.shipping = ship;

    return { patch, items };
  };

  const detectCurrency = (s: string): string | null => {
    const table: [RegExp, string][] = [
      [/\bUSD\b|\$/i, "USD"], [/\bEUR\b|€/, "EUR"], [/\bGBP\b|£/, "GBP"],
      [/\bAED\b|د\.إ/, "AED"], [/\bSAR\b|ريال|﷼/, "SAR"], [/\bEGP\b/, "EGP"],
      [/\bJPY\b|¥/, "JPY"], [/\bCNY\b|元|rmb/i, "CNY"], [/\bINR\b|₹/, "INR"],
      [/\bQAR\b|ر\.ق/, "QAR"], [/\bMAD\b|د\.م/, "MAD"], [/\bKWD\b|د\.ك/, "KWD"],
      [/\bTRY\b|₺/, "TRY"], [/\bNGN\b|₦/, "NGN"], [/\bBRL\b|R\$/, "BRL"],
      [/\bAUD\b|A\$/, "AUD"], [/\bCAD\b|CA\$/, "CAD"], [/\bSGD\b|S\$/, "SGD"],
      [/\bNZD\b|NZ\$/, "NZD"], [/\bCHF\b|CHF/, "CHF"], [/\bSEK\b/, "SEK"],
      [/\bNOK\b/, "NOK"], [/\bDKK\b/, "DKK"], [/\bPLN\b|zł/, "PLN"], [/\bKRW\b|₩/, "KRW"],
    ];
    for (const [re, code] of table) if (re.test(s)) return code;
    return null;
  };

  const detectInvoiceNumber = (s: string): string | null => {
    const pats = [
      /(?:invoice|facture|fatura|rechnung|فاتورة|رقم الفاتورة|factuurnummer|factuurnr\.?|factuur\s*nr\.?|rechnungsnummer|rechnungsnr\.?)\s*(?:(?:no|nr|nummer)\.?)?\s*[:#]?\s*([A-Z0-9][A-Za-z0-9/\\\-_]{1,24})/i,
      /(?:no\.?|nr\.?|nº|#|number|رقم)\s*[:#]?\s*([A-Z0-9][A-Za-z0-9/\\\-_]{2,20})/,
    ];
    for (const re of pats) {
      const m = s.match(re);
      if (m && m[1]) {
        const v = m[1];
        if (/\d{4}-\d{2}-\d{2}/.test(v)) continue;
        if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(v)) continue;
        if (/^(datum|date|factuur|facture|fatura|rechnung|nummer)$/i.test(v)) continue;
        if (v.length < 3 || v === s) continue;
        return v;
      }
    }
    let bare = s.match(/\b(INV[A-Z0-9\-_/]{2,24})\b/i);
    if (bare) {
      const v = bare[1];
      if (/\d{4}-\d{2}-\d{2}/.test(v)) return null;
      if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(v)) return null;
      return v;
    }
    const loneLn = s.split(" | ").find((ln) => /^[A-Z][A-Z0-9/._-]{2,24}$/.test(ln));
    if (loneLn) return loneLn;
    return null;
  };

  const detectStatus = (s: string): Status | null => {
    if (/(paid|مدفوعة|مدفوع|bezahlt|betaald|pagada|payée|paga|ödendi)/i.test(s)) return "paid";
    if (/(overdue|متأخرة|vencida|verlopen|überfällig|en retard|vadesi geçmiş)/i.test(s)) return "overdue";
    if (/(sent|مرسلة|enviada|verschickt|verzonden|envoyée|gönderildi)/i.test(s)) return "sent";
    return null;
  };

  const nearestDate = (s: string, re: RegExp, dates: string[]): string | null => {
    const k = s.match(re);
    if (!k || k.index === undefined) return null;
    let best: string | null = null;
    let bd = Infinity;
    for (const d of dates) {
      const di = s.indexOf(d);
      const dist = Math.abs(di - k.index);
      if (dist < bd) { bd = dist; best = d; }
    }
    return best;
  };

  const statusBadge = (st: Status) =>
    `<span class="inv-status-badge s-${st}">${Lx[st]}</span>`;

  const previewHtml = (() => {
    const fromDetails = [s.fromAddr, s.fromEmail ? `✉ ${s.fromEmail}` : "", s.fromPhone ? `✆ ${s.fromPhone}` : "", s.fromTax ? `${s.taxLabel}: ${s.fromTax}` : "", s.fromKvk ? `KvK: ${s.fromKvk}` : "", s.fromWeb ? `🌐 ${s.fromWeb}` : ""].filter(Boolean).join("\n");
    const toDetails = [s.toContact, s.toAddr, s.toEmail ? `✉ ${s.toEmail}` : "", s.toPhone ? `✆ ${s.toPhone}` : "", s.toTax ? `${s.taxLabel}: ${s.toTax}` : "", s.toCode ? `Code: ${s.toCode}` : ""].filter(Boolean).join("\n");
    const ac = s.accent;
    return `
  <div dir="${dir}" style="font-family:${serifFamily}, Georgia, serif;position:relative;">
    ${s.logo && s.wmEnabled ? `
    <div id="inv-watermark" class="inv-watermark">
      <img src="${s.logo}" alt="" style="width:auto;max-width:42%;max-height:160px;opacity:0.05;object-fit:contain;filter:grayscale(100%);-webkit-print-color-adjust:exact;print-color-adjust:exact;">
    </div>` : ""}
    <div data-content style="position:relative;z-index:1;">
    <div class="inv-top">
      <div>
        ${s.logo ? `<img src="${s.logo}" alt="logo" style="max-height:70px;max-width:200px;object-fit:contain;display:block;margin-bottom:10px">` : ""}
        <div class="inv-brand-name">${s.fromName || "Your Company"}</div>
        ${s.fromTagline ? `<div class="inv-tagline">${s.fromTagline}</div>` : ""}
      </div>
      <div class="inv-title-area">
        <div class="inv-word" style="color:${ac}">${Lx.invoice}</div>
        <div class="inv-meta">
          <strong>${Lx.num}</strong> ${s.invoiceNum}<br>
          ${s.poNum ? `<strong>${Lx.ref}:</strong> ${s.poNum}<br>` : ""}
          ${statusBadge(s.status)}<br>
          ${s.invDate ? `<strong>${Lx.date}:</strong> ${s.invDate}<br>` : ""}
          ${s.dueDate ? `<strong>${Lx.due}:</strong> ${s.dueDate}` : ""}
        </div>
      </div>
    </div>
    <div class="inv-divider" style="background:linear-gradient(90deg, ${ac} 0%, ${ac}88 40%, transparent 100%)"></div>
    <div class="inv-parties">
      <div>
        <div class="inv-party-lbl">${Lx.from}</div>
        <div class="inv-party-name">${s.fromName || "Your Company"}</div>
        <div class="inv-party-detail">${fromDetails}</div>
      </div>
      <div>
        <div class="inv-party-lbl">${Lx.to}</div>
        <div class="inv-party-name">${s.toName || "Client"}</div>
        <div class="inv-party-detail">${toDetails}</div>
      </div>
    </div>
    <table class="inv-table">
      <thead>
        <tr>
          <th style="width:42%">${Lx.desc}</th>
          <th class="r" style="width:10%">${Lx.qty}</th>
          <th class="r" style="width:18%">${Lx.rate}</th>
          ${showTax ? `<th class="r" style="width:12%">${s.taxLabel}%</th>` : ""}
          <th class="r" style="width:${showTax ? "18%" : "30%"}">${Lx.amount}</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((it) => `
          <tr>
            <td>${it.desc || "—"}</td>
            <td class="r" style="color:#888">${it.qty}</td>
            <td class="r" style="color:#888">${fmt(it.rate)}</td>
            ${showTax ? `<td class="r" style="color:#888">${it.tax}%</td>` : ""}
            <td class="r">${fmt(it.qty * it.rate * (1 + (showTax ? it.tax : 0) / 100))}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <div class="inv-totals-row">
      <div class="inv-totals-box">
        <div class="inv-trow sep"><span style="color:#aaa">${Lx.subtotal}</span><span>${fmt(subtotal)}</span></div>
        ${s.discount > 0 ? `<div class="inv-trow"><span style="color:#aaa">${Lx.discount} (${s.discount}%)</span><span style="color:#e05555">−${fmt(discAmt)}</span></div>` : ""}
        ${showTax ? `<div class="inv-trow"><span style="color:#aaa">${s.taxLabel}</span><span>${fmt(totalTax)}</span></div>` : ""}
        ${s.shipping > 0 ? `<div class="inv-trow"><span style="color:#aaa">${Lx.shipping}</span><span>${fmt(s.shipping)}</span></div>` : ""}
        <div class="inv-trow big"><span>${Lx.total}</span><span style="color:${ac}">${fmt(grand)}</span></div>
      </div>
    </div>
    ${s.notes || s.bankDetails ? `
    <div class="inv-footer-grid">
      ${s.notes ? `<div><span class="inv-footer-lbl">${Lx.notes}</span><p class="inv-footer-val">${s.notes}</p></div>` : ""}
      ${s.bankDetails ? `<div><span class="inv-footer-lbl">${Lx.bank}</span><p class="inv-footer-val">${s.bankDetails}</p></div>` : ""}
    </div>` : ""}
    ${s.footer ? `<div class="inv-legal">${s.footer}</div>` : ""}
    </div>
  </div>`;
  })();

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    if (!zoomed) {
      sheet.style.transform = "";
      sheet.style.marginBottom = "";
      return;
    }
    const scale = 0.72;
    sheet.style.transform = `scale(${scale})`;
    sheet.style.transformOrigin = "top center";
    const h = sheet.offsetHeight * scale;
    sheet.style.marginBottom = `${h - sheet.offsetHeight}px`;
  }, [zoomed, previewHtml]);

  useEffect(() => {
    const doc = wrapRef.current;
    if (!doc) return;
    const wm = doc.querySelector<HTMLElement>(".inv-watermark");
    if (!wm) return;
    const pageH = doc.offsetHeight;
    wm.style.top = `${pageH / 2}px`;
    wm.style.transform = "translateY(-50%)";
  }, [previewHtml]);

  const clearForm = () => {
    if (!confirm(L.clearConfirm)) return;
    setS({
      currency: "EUR", taxLabel: "VAT", lang: "en", invoiceNum: "INV-2026-001", status: "draft",
      invDate: defaultDate(), dueDate: defaultDate(30), poNum: "",
      logo: "", wmEnabled: true,
      fromName: "", fromTagline: "", fromAddr: "", fromEmail: "", fromPhone: "", fromTax: "", fromKvk: "", fromBank: "", fromWeb: "",
      toName: "", toContact: "", toAddr: "", toEmail: "", toPhone: "", toTax: "", toCode: "",
      discount: 0, shipping: 0, notes: "", bankDetails: "", footer: "", accent: ACCENTS[0],
    });
    setItems([newItem()]);
  };

  const buildInvoiceHTML = () => {
    const lang = s.lang || "en";
    const taxLabel = s.taxLabel || "VAT";
    const showTaxOn = taxLabel !== "None";
    const Ld = LANGS[lang] || LANGS.en;
    const disc = parseFloat(String(s.discount)) || 0;
    const ship = parseFloat(String(s.shipping)) || 0;
    const sub = items.reduce((sum, it) => sum + it.qty * it.rate, 0);
    const dAmt = sub * (disc / 100);
    const tTax = showTaxOn ? items.reduce((sum, it) => sum + (it.qty * it.rate * (1 - disc / 100) * it.tax) / 100, 0) : 0;
    const grandTotal = sub - dAmt + tTax + ship;
    const ac = s.accent;
    const fromName = s.fromName || "Your Company";
    const toName = s.toName || "Client";
    const invNum = s.invoiceNum || "INV-001";
    const statusKey = s.status || "draft";
    const statusBg: Record<string, string> = { draft: "#f0f0f0", sent: "#e8f0fe", paid: "#e6f4ea", overdue: "#fce8e6" };
    const statusFg: Record<string, string> = { draft: "#888", sent: "#1967d2", paid: "#1e8e3e", overdue: "#c5221f" };
    const statusWord = { draft: Ld.draft || "DRAFT", sent: Ld.sent || "SENT", paid: Ld.paid || "PAID", overdue: Ld.overdue || "OVERDUE" };
    const showWatermark = !!(s.logo && s.wmEnabled);
    const tagline = s.fromTagline || "";
    const poNum = s.poNum || "";
    const invDate = s.invDate || "";
    const dueDate = s.dueDate || "";
    const notesTxt = (s.notes || "").replace(/\n/g, "<br>");
    const bankTxt = (s.bankDetails || "").replace(/\n/g, "<br>");
    const footTxt = s.footer || "";

    const esc = (str: string | number) =>
      String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const adr = (str: string) => esc(str).replace(/\n/g, "<br>");

    const fromBlock = [
      adr(s.fromAddr),
      s.fromEmail ? "<b>Email:</b> " + esc(s.fromEmail) : "",
      s.fromPhone ? "<b>Tel:</b> " + esc(s.fromPhone) : "",
      s.fromTax ? taxLabel + ": " + esc(s.fromTax) : "",
      s.fromKvk ? "KvK: " + esc(s.fromKvk) : "",
      s.fromBank ? "<b>IBAN:</b> " + esc(s.fromBank) : "",
      s.fromWeb ? "<b>Web:</b> " + esc(s.fromWeb) : "",
    ].filter(Boolean).join("<br>");

    const toBlock = [
      s.toContact ? "<b>Attn:</b> " + esc(s.toContact) : "",
      adr(s.toAddr),
      s.toEmail ? "<b>Email:</b> " + esc(s.toEmail) : "",
      s.toPhone ? "<b>Tel:</b> " + esc(s.toPhone) : "",
      s.toTax ? taxLabel + ": " + esc(s.toTax) : "",
    ].filter(Boolean).join("<br>");

    const activeItems = items.filter((it) => it.desc || it.rate > 0);
    const itemRows = activeItems.map((it, i) => {
      const total = it.qty * it.rate * (1 + (showTaxOn ? it.tax : 0) / 100);
      const bg = i % 2 === 0 ? "#fff" : "#fafaf8";
      const td = "padding:10px 14px;border-bottom:1px solid #ede9e0;";
      const r = td + "text-align:right;color:#555";
      return (
        "<tr style=\"background:" + bg + "\">"
        + "<td style=\"" + td + "font-weight:500;color:#1a1a2e\">" + esc(it.desc) + "</td>"
        + "<td style=\"" + r + "\">" + it.qty + "</td>"
        + "<td style=\"" + r + "\">" + fmt(it.rate) + "</td>"
        + (showTaxOn ? "<td style=\"" + r + "\">" + it.tax + "%</td>" : "")
        + "<td style=\"" + td + "text-align:right;font-weight:600;color:#1a1a2e\">" + fmt(total) + "</td>"
        + "</tr>"
      );
    }).join("");

    let H = "";
    H += "<!DOCTYPE html>";
    H += "<html lang=\"" + lang + "\" dir=\"" + dir + "\">";
    H += "<head><meta charset=\"UTF-8\">";
    H += "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">";
    H += "<title>" + esc(Ld.invoice) + " - " + esc(invNum) + "</title>";
    H += "<link href=\"https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500;600&display=swap\" rel=\"stylesheet\">";
    H += "<style>";
    H += "*{box-sizing:border-box;margin:0;padding:0}";
    H += "body{font-family:'DM Sans',sans-serif;background:#eceae3;padding:30px 16px;-webkit-print-color-adjust:exact;print-color-adjust:exact}";
    H += ".hint{max-width:820px;margin:0 auto 20px;background:#1a1a2e;color:#f0ede8;border-radius:10px;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px}";
    H += ".hint-dot{width:8px;height:8px;background:#4ec994;border-radius:50%;flex-shrink:0;margin-right:10px}";
    H += ".hint-btn{background:" + ac + ";color:white;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap}";
    H += ".page{width:210mm;min-height:297mm;margin:0 auto;background:white;padding:18mm 20mm;box-shadow:0 8px 48px rgba(0,0,0,.14);border-radius:4px;position:relative;overflow:hidden}";
    H += ".top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px}";
    H += ".co-name{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:600;color:#0d0d2e;line-height:1.1}";
    H += ".co-tag{font-size:11px;color:#666;margin-top:5px}";
    H += ".inv-word{font-family:'Cormorant Garamond',serif;font-size:42px;font-weight:400;letter-spacing:5px;text-transform:uppercase;color:" + ac + ";line-height:1;text-align:right}";
    H += ".meta{font-size:11px;color:#666;line-height:2.2;text-align:right;margin-top:10px}";
    H += ".meta b{color:#555;font-weight:500}";
    H += ".badge{display:inline-block;padding:3px 11px;border-radius:20px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;background:" + statusBg[statusKey] + ";color:" + statusFg[statusKey] + "}";
    H += ".bar{height:3px;background:linear-gradient(90deg," + ac + "," + ac + "55 50%,transparent);border-radius:2px;margin-bottom:28px}";
    H += ".parties{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:30px;padding:20px 24px;background:#fafaf7;border:1px solid #ede9e0;border-radius:8px}";
    H += ".plbl{font-size:9px;text-transform:uppercase;letter-spacing:1.8px;color:#888;font-weight:500;margin-bottom:8px}";
    H += ".pname{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600;color:#0d0d2e;margin-bottom:7px}";
    H += ".pdetail{font-size:11.5px;color:#4a4a4a;line-height:2;word-break:break-word}";
    H += "table{width:100%;border-collapse:collapse;margin-bottom:22px}";
    H += "thead tr{background:#0d0d2e}";
    H += "th{padding:10px 14px;font-size:9px;text-transform:uppercase;letter-spacing:1.2px;color:#bbb;font-weight:500;text-align:left}";
    H += "th.r{text-align:right}td{word-break:break-word}";
    H += ".totbox{display:flex;justify-content:flex-end;margin-bottom:28px}";
    H += ".totinner{min-width:260px}";
    H += ".trow{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;color:#555}";
    H += ".trow.sep{border-top:1px solid #eee;padding-top:11px;margin-top:5px}";
    H += ".trow.grand{border-top:2px solid #0d0d2e;padding-top:13px;margin-top:9px;font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;color:#0d0d2e}";
    H += ".grand-amt{color:" + ac + "}";
    H += ".fgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:28px;border-top:1px solid #eee;padding-top:22px;margin-bottom:22px}";
    H += ".flbl{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#888;display:block;margin-bottom:7px;font-weight:500}";
    H += ".fval{font-size:12px;color:#4a4a4a;line-height:1.9;word-break:break-word}";
    H += ".legal{border-top:1px dashed #ddd;padding-top:12px;font-size:10px;color:#666;text-align:center;line-height:1.9}";
    H += "@media print{body{background:#fff;padding:0;margin:0}.hint{display:none!important}.page{box-shadow:none;width:210mm;min-height:297mm;max-width:210mm;border-radius:0;padding:16mm 20mm;margin:0 auto;overflow:visible}@page{size:A4 portrait;margin:0}}";
    H += "</style></head><body>";
    H += "<div class=\"hint\"><div style=\"display:flex;align-items:center\"><div class=\"hint-dot\"></div>";
    H += "<span>Your invoice is ready &mdash; click to save as PDF</span></div>";
    H += "<button class=\"hint-btn\" onclick=\"window.print()\">Save as PDF</button></div>";
    H += "<div class=\"page\">";
    if (showWatermark) {
      H += "<div id=\"wm-wrap\" style=\"position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);pointer-events:none;z-index:0;display:flex;align-items:center;justify-content:center;overflow:hidden;\">";
      H += "<img src=\"" + s.logo + "\" alt=\"\" style=\"width:auto;max-width:42%;max-height:160px;opacity:0.05;object-fit:contain;filter:grayscale(100%);-webkit-print-color-adjust:exact;print-color-adjust:exact;\"></div>";
    }
    H += "<div style=\"position:relative;z-index:1;\">";
    H += "<div class=\"top\"><div>";
    if (s.logo) H += "<img src=\"" + s.logo + "\" alt=\"logo\" style=\"max-height:72px;max-width:200px;object-fit:contain;display:block;margin-bottom:10px\">";
    H += "<div class=\"co-name\">" + esc(fromName) + "</div>";
    if (tagline) H += "<div class=\"co-tag\">" + esc(tagline) + "</div>";
    H += "</div><div>";
    H += "<div class=\"inv-word\">" + esc(Ld.invoice) + "</div>";
    H += "<div class=\"meta\"><b>" + esc(Ld.num || "No.") + "</b> " + esc(invNum) + "<br>";
    if (poNum) H += "<b>" + esc(Ld.ref || "Ref") + ":</b> " + esc(poNum) + "<br>";
    H += "<span class=\"badge\">" + esc(statusWord[statusKey]) + "</span><br>";
    if (invDate) H += "<b>" + esc(Ld.date || "Date") + ":</b> " + esc(invDate) + "<br>";
    if (dueDate) H += "<b>" + esc(Ld.due || "Due") + ":</b> " + esc(dueDate);
    H += "</div></div></div>";
    H += "<div class=\"bar\"></div>";
    H += "<div class=\"parties\">";
    H += "<div><div class=\"plbl\">" + esc(Ld.from || "From") + "</div><div class=\"pname\">" + esc(fromName) + "</div><div class=\"pdetail\">" + fromBlock + "</div></div>";
    H += "<div><div class=\"plbl\">" + esc(Ld.to || "Bill To") + "</div><div class=\"pname\">" + esc(toName) + "</div><div class=\"pdetail\">" + toBlock + "</div></div>";
    H += "</div>";
    H += "<table><thead><tr>";
    H += "<th style=\"width:40%\">" + esc(Ld.desc || "Description") + "</th>";
    H += "<th class=\"r\" style=\"width:9%\">" + esc(Ld.qty || "Qty") + "</th>";
    H += "<th class=\"r\" style=\"width:18%\">" + esc(Ld.rate || "Rate") + "</th>";
    if (showTaxOn) H += "<th class=\"r\" style=\"width:11%\">" + esc(taxLabel) + "%</th>";
    H += "<th class=\"r\" style=\"width:" + (showTaxOn ? "22" : "33") + "%\">" + esc(Ld.amount || "Amount") + "</th>";
    H += "</tr></thead><tbody>" + itemRows + "</tbody></table>";
    H += "<div class=\"totbox\"><div class=\"totinner\">";
    H += "<div class=\"trow sep\"><span>" + esc(Ld.subtotal || "Subtotal") + "</span><span>" + fmt(sub) + "</span></div>";
    if (disc > 0) H += "<div class=\"trow\"><span>" + esc(Ld.discount || "Discount") + " (" + disc + "%)</span><span style=\"color:#e05555\">&minus;" + fmt(dAmt) + "</span></div>";
    if (showTaxOn) H += "<div class=\"trow\"><span>" + esc(taxLabel) + "</span><span>" + fmt(tTax) + "</span></div>";
    if (ship > 0) H += "<div class=\"trow\"><span>" + esc(Ld.shipping || "Shipping") + "</span><span>" + fmt(ship) + "</span></div>";
    H += "<div class=\"trow grand\"><span>" + esc(Ld.total || "Total Due") + "</span><span class=\"grand-amt\">" + fmt(grandTotal) + "</span></div>";
    H += "</div></div>";
    if (notesTxt || bankTxt) {
      H += "<div class=\"fgrid\">";
      if (notesTxt) H += "<div><span class=\"flbl\">" + esc(Ld.notes || "Notes") + "</span><p class=\"fval\">" + notesTxt + "</p></div>";
      if (bankTxt) H += "<div><span class=\"flbl\">" + esc(Ld.bank || "Payment Details") + "</span><p class=\"fval\">" + bankTxt + "</p></div>";
      H += "</div>";
    }
    if (footTxt) H += "<div class=\"legal\">" + esc(footTxt) + "</div>";
    H += "</div></div>";
    if (showWatermark) {
      const wmJs = "(function(){"
        + "var w=document.getElementById(\"wm-wrap\");"
        + "if(!w)return;"
        + "var page=w.closest(\".page\");"
        + "if(!page)return;"
        + "w.style.top=(page.offsetHeight/2)+\"px\";"
        + "})();";
      H += "<scr" + "ipt>" + wmJs + "<" + "/scr" + "ipt>";
    }
    H += "</body></html>";
    return H;
  };

  const download = () => {
    const html = buildInvoiceHTML();
    const name = (s.invoiceNum || "invoice").replace(/[^a-zA-Z0-9\-_]/g, "_");
    downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), name + ".html");
  };

  const inputClass =
    "w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
  const inputClassDark = inputClass + " bg-surface";
  const labelClass = "mb-1 block text-xs font-medium text-ink-soft";

  const tabs: { key: typeof tab; label: string }[] = [
    { key: "settings", label: L.settings },
    { key: "company", label: L.company },
    { key: "client", label: L.client },
    { key: "items", label: L.items },
    { key: "notes", label: L.notes },
  ];

  const previewCss = `
    .inv-sheet { background:white; color:#1a1a1a; padding:34px; border-radius:4px; font-size:11.5px; width:100%; min-height:560px; }
    .inv-watermark { position:absolute; left:0; right:0; top:50%; transform:translateY(-50%); pointer-events:none; z-index:0; display:flex; align-items:center; justify-content:center; overflow:hidden; }
    .inv-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:36px; }
    .inv-brand-name { font-family:${serifFamily}, serif; font-size:28px; font-weight:600; color:#0d0d12; letter-spacing:-0.3px; line-height:1; }
    .inv-tagline { font-size:11px; color:#999; margin-top:4px; font-weight:300; }
    .inv-title-area { text-align:right; }
    .inv-word { font-family:${serifFamily}, serif; font-size:38px; font-weight:300; color:#c9974a; letter-spacing:4px; text-transform:uppercase; line-height:1; }
    .inv-meta { font-size:11px; color:#888; line-height:2; margin-top:8px; }
    .inv-meta strong { color:#444; font-weight:500; }
    .inv-status-badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:1px; }
    .s-draft { background:#f0f0f0; color:#888; }
    .s-sent { background:#e8f0fe; color:#1967d2; }
    .s-paid { background:#e6f4ea; color:#1e8e3e; }
    .s-overdue { background:#fce8e6; color:#c5221f; }
    .inv-divider { height:2px; margin:0 0 28px; background:linear-gradient(90deg, #c9974a 0%, #e8b86d 30%, transparent 100%); border-radius:2px; }
    .inv-parties { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:32px; padding:20px 24px; background:#fafaf7; border-radius:8px; border:1px solid #f0ece0; }
    .inv-party-lbl { font-size:9px; text-transform:uppercase; letter-spacing:1.8px; color:#bbb; font-weight:500; margin-bottom:7px; }
    .inv-party-name { font-family:${serifFamily}, serif; font-size:16px; font-weight:600; color:#0d0d12; margin-bottom:5px; line-height:1.2; }
    .inv-party-detail { font-size:11px; color:#777; line-height:1.8; white-space:pre-line; }
    .inv-table { width:100%; border-collapse:collapse; margin-bottom:24px; }
    .inv-table th { text-align:left; padding:8px 10px 10px; font-size:9px; text-transform:uppercase; letter-spacing:1.5px; color:#bbb; font-weight:500; border-bottom:1.5px solid #e8e4d8; }
    .inv-table th.r, .inv-table td.r { text-align:right; }
    .inv-table td { padding:11px 10px; font-size:12px; color:#444; border-bottom:1px solid #f5f2ea; }
    .inv-table tr:last-child td { border-bottom:none; }
    .inv-table td:first-child { color:#1a1a2e; font-weight:500; }
    .inv-totals-row { display:flex; justify-content:flex-end; margin-bottom:28px; }
    .inv-totals-box { min-width:240px; }
    .inv-trow { display:flex; justify-content:space-between; padding:5px 0; font-size:12px; color:#777; }
    .inv-trow.sep { border-top:1px solid #eee; padding-top:10px; margin-top:4px; }
    .inv-trow.big { border-top:2px solid #1a1a2e; padding-top:12px; margin-top:8px; font-family:${serifFamily}, serif; font-size:17px; font-weight:600; color:#1a1a2e; }
    .inv-footer-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; border-top:1px solid #eee; padding-top:20px; }
    .inv-footer-lbl { font-size:9px; text-transform:uppercase; letter-spacing:1.5px; color:#bbb; font-weight:500; display:block; margin-bottom:6px; }
    .inv-footer-val { font-size:11px; color:#777; line-height:1.8; white-space:pre-line; word-break:break-word; overflow-wrap:anywhere; }
    .inv-legal { margin-top:16px; border-top:1px dashed #eee; padding-top:12px; font-size:10px; color:#bbb; text-align:center; }
    [dir="rtl"] .inv-word, [dir="rtl"] .inv-title-area, [dir="rtl"] .inv-meta { text-align:left; }
    [dir="rtl"] .inv-totals-row { justify-content:flex-start; }
    [dir="rtl"] .inv-table th { text-align:right; }
    [dir="rtl"] .inv-table th.r, [dir="rtl"] .inv-table td.r { text-align:left; }
  `;

return (
    <div className="grid gap-6">
      <span className={serifLatin.className} style={{ position: "absolute", opacity: 0 }}>‌</span>
      <span className={serifArabic.className} style={{ position: "absolute", opacity: 0 }}>‌</span>

      <div className="space-y-4">
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <div className="flex flex-wrap items-center border-b border-line">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`px-4 py-2.5 text-sm font-medium transition ${tab === tb.key ? "border-b-2 border-brand-600 bg-brand-50/50 text-brand-700" : "text-ink-soft hover:bg-paper hover:text-ink"}`}
              >
                {tb.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 px-3">
              {notice && (
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${notice.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`} dir="auto">
                  {notice.msg}
                </span>
              )}
              <button
                onClick={() => invInputRef.current?.click()}
                disabled={importing}
                className="rounded-lg border border-emerald-600 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
              >
                {importing ? L.reading : "⟳ " + L.loadInvoice}
              </button>
            </div>
          </div>
          <input
            ref={invInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.gif,.bmp,.pdf,.xlsx,.csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) loadExternalInvoice(f); e.target.value = ""; }}
          />

          <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">

            {tab === "settings" && (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label><span className={labelClass}>{L.currency}</span>
                    <select value={s.currency} onChange={(e) => set({ currency: e.target.value })} className={inputClassDark}>
                      {Object.keys(CURRENCIES).map((c) => (
                        <option key={c} value={c}>{c} — {CURRENCIES[c].sym}</option>
                      ))}
                    </select></label>
                  <label><span className={labelClass}>{L.taxSystem}</span>
                    <select value={s.taxLabel} onChange={(e) => set({ taxLabel: e.target.value })} className={inputClassDark}>
                      {TAX_LABELS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select></label>
                  <label><span className={labelClass}>{L.invoiceLang}</span>
                    <select value={s.lang} onChange={(e) => set({ lang: e.target.value })} className={inputClassDark}>
                      {Object.keys(LANGS).map((lg) => <option key={lg} value={lg}>{LANG_NAMES[lg] || lg}</option>)}
                    </select></label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label><span className={labelClass}>{L.invoiceNo}</span>
                    <input dir="ltr" value={s.invoiceNum} onChange={(e) => set({ invoiceNum: e.target.value })} className={inputClassDark} /></label>
                  <label><span className={labelClass}>{L.status}</span>
                    <select value={s.status} onChange={(e) => set({ status: e.target.value as Status })} className={inputClassDark}>
                      {STATUSES.map((st) => <option key={st} value={st}>{L[st]}</option>)}
                    </select></label>
                  <label><span className={labelClass}>{L.invDate}</span>
                    <input type="date" dir="ltr" value={s.invDate} onChange={(e) => set({ invDate: e.target.value })} className={inputClassDark} /></label>
                  <label><span className={labelClass}>{L.dueDate}</span>
                    <input type="date" dir="ltr" value={s.dueDate} onChange={(e) => set({ dueDate: e.target.value })} className={inputClassDark} /></label>
                </div>
                <label className="block"><span className={labelClass}>{L.poNumber}</span>
                  <input dir="ltr" value={s.poNum} onChange={(e) => set({ poNum: e.target.value })} placeholder="PO-2026-789" className={inputClassDark} /></label>
              </>
            )}

            {tab === "company" && (
              <>
                <div>
                  <span className={labelClass}>{L.uploadLogo}</span>
                  <div
                    onClick={() => document.getElementById("inv-logo-input")?.click()}
                    className="cursor-pointer rounded-lg border-2 border-dashed border-brand-200 bg-paper p-4 text-center transition hover:border-brand-500"
                  >
                    {s.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logo} alt="logo" className="mx-auto max-h-16 object-contain" />
                    ) : (
                      <span className="text-sm text-ink-soft">{L.uploadLogo}</span>
                    )}
                    <input
                      id="inv-logo-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])}
                    />
                  </div>
                  {s.logo && (
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <button onClick={() => set({ logo: "" })} className="text-xs font-medium text-red-500 hover:underline">
                        ✕ {L.removeLogo}
                      </button>
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-soft">
                        <input
                          type="checkbox"
                          checked={s.wmEnabled}
                          onChange={(e) => set({ wmEnabled: e.target.checked })}
                          className="h-4 w-4 accent-brand-600"
                        />
                        {L.logoWatermark}
                      </label>
                    </div>
                  )}
                  <p className="mt-1 text-[11px] text-ink-soft">{L.watermarkHint}</p>
                </div>
                <label className="block"><span className={labelClass}>{L.yourBusiness}</span>
                  <input dir="auto" value={s.fromName} placeholder="Your Company Name" onChange={(e) => set({ fromName: e.target.value })} className={inputClassDark} /></label>
                <label className="block"><span className={labelClass}>{L.tagline}</span>
                  <input dir="auto" value={s.fromTagline} placeholder="Design Studio · Amsterdam" onChange={(e) => set({ fromTagline: e.target.value })} className={inputClassDark} /></label>
                <label className="block"><span className={labelClass}>{L.address}</span>
                  <textarea dir="auto" value={s.fromAddr} rows={2} onChange={(e) => set({ fromAddr: e.target.value })} className={inputClassDark} /></label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label><span className={labelClass}>{L.email}</span>
                    <input type="email" dir="ltr" value={s.fromEmail} onChange={(e) => set({ fromEmail: e.target.value })} className={inputClassDark} /></label>
                  <label><span className={labelClass}>{L.phone}</span>
                    <input dir="ltr" value={s.fromPhone} onChange={(e) => set({ fromPhone: e.target.value })} className={inputClassDark} /></label>
                  <label><span className={labelClass}>{L.vatNumber}</span>
                    <input dir="ltr" value={s.fromTax} onChange={(e) => set({ fromTax: e.target.value })} className={inputClassDark} /></label>
                  <label><span className={labelClass}>{L.regNumber}</span>
                    <input dir="ltr" value={s.fromKvk} onChange={(e) => set({ fromKvk: e.target.value })} className={inputClassDark} /></label>
                  <label><span className={labelClass}>{L.bankIban}</span>
                    <input dir="ltr" value={s.fromBank} onChange={(e) => set({ fromBank: e.target.value })} className={inputClassDark} /></label>
                  <label><span className={labelClass}>{L.website}</span>
                    <input dir="ltr" value={s.fromWeb} onChange={(e) => set({ fromWeb: e.target.value })} className={inputClassDark} /></label>
                </div>
              </>
            )}

            {tab === "client" && (
              <>
                <label className="block"><span className={labelClass}>{L.clientName}</span>
                  <input dir="auto" value={s.toName} placeholder="Client Company BV" onChange={(e) => set({ toName: e.target.value })} className={inputClassDark} /></label>
                <label className="block"><span className={labelClass}>{L.contactPerson}</span>
                  <input dir="auto" value={s.toContact} placeholder="Attn: Jane Smith" onChange={(e) => set({ toContact: e.target.value })} className={inputClassDark} /></label>
                <label className="block"><span className={labelClass}>{L.clientAddress}</span>
                  <textarea dir="auto" value={s.toAddr} rows={2} onChange={(e) => set({ toAddr: e.target.value })} className={inputClassDark} /></label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label><span className={labelClass}>{L.clientEmail}</span>
                    <input type="email" dir="ltr" value={s.toEmail} onChange={(e) => set({ toEmail: e.target.value })} className={inputClassDark} /></label>
                  <label><span className={labelClass}>{L.clientPhone}</span>
                    <input dir="ltr" value={s.toPhone} onChange={(e) => set({ toPhone: e.target.value })} className={inputClassDark} /></label>
                  <label><span className={labelClass}>{L.clientVat}</span>
                    <input dir="ltr" value={s.toTax} onChange={(e) => set({ toTax: e.target.value })} className={inputClassDark} /></label>
                  <label><span className={labelClass}>{L.clientCode}</span>
                    <input dir="ltr" value={s.toCode} onChange={(e) => set({ toCode: e.target.value })} className={inputClassDark} /></label>
                </div>
              </>
            )}

            {tab === "items" && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-[10px] font-medium uppercase tracking-wider text-ink-soft">
                        <th className="w-[36%] px-2 py-2">{L.description}</th>
                        <th className="px-2 py-2 text-right">{L.qty}</th>
                        <th className="px-2 py-2 text-right">{L.rate}</th>
                        <th className="px-2 py-2 text-right">{L.taxPct}</th>
                        <th className="px-2 py-2 text-right">{L.total}</th>
                        <th className="px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i} className="border-b border-line/60 last:border-0">
                          <td className="px-1 py-1.5">
                            <input dir="auto" value={it.desc} placeholder={L.description} onChange={(e) => updateItem(i, { desc: e.target.value })}
                              className="w-full rounded-md border border-line px-2 py-1.5 text-sm outline-none focus:border-brand-500" /></td>
                          <td className="px-1 py-1.5">
                            <input type="number" min={0} step="any" dir="ltr" value={it.qty} onChange={(e) => updateItem(i, { qty: parseFloat(e.target.value) || 0 })}
                              className="w-20 rounded-md border border-line px-2 py-1.5 text-right text-sm outline-none focus:border-brand-500" /></td>
                          <td className="px-1 py-1.5">
                            <input type="number" min={0} step="any" dir="ltr" value={it.rate} onChange={(e) => updateItem(i, { rate: parseFloat(e.target.value) || 0 })}
                              className="w-24 rounded-md border border-line px-2 py-1.5 text-right text-sm outline-none focus:border-brand-500" /></td>
                          <td className="px-1 py-1.5">
                            <input type="number" min={0} max={100} step="any" dir="ltr" value={it.tax} onChange={(e) => updateItem(i, { tax: parseFloat(e.target.value) || 0 })}
                              className="w-16 rounded-md border border-line px-2 py-1.5 text-right text-sm outline-none focus:border-brand-500" /></td>
                          <td className="px-2 py-1.5 text-right">
                            {(() => {
                              const lineTax = showTax ? (it.qty * it.rate * it.tax) / 100 : 0;
                              return (
                                <>
                                  <div className="font-medium text-ink">{fmt(it.qty * it.rate + lineTax)}</div>
                                  {it.tax > 0 && showTax && <div className="text-[10px] text-ink-soft/70">{s.taxLabel} {it.tax}% = {fmt(lineTax)}</div>}
                                </>
                              );
                            })()}
                          </td>
                          <td className="px-1 py-1.5">
                            <button onClick={() => delItem(i)} disabled={items.length === 1}
                              className="text-red-500 transition hover:text-red-700 disabled:opacity-30" aria-label={L.removeLogo}>×</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={addItem} className="w-full rounded-lg border border-dashed border-brand-300 py-2 text-sm font-medium text-brand-700 transition hover:border-brand-500 hover:bg-brand-50/50">
                  + {L.addItem}
                </button>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label><span className={labelClass}>{L.discountPercent}</span>
                    <input type="number" min={0} max={100} dir="ltr" value={s.discount} onChange={(e) => set({ discount: parseFloat(e.target.value) || 0 })}
                      className={inputClassDark} /></label>
                  <label><span className={labelClass}>{L.shippingExtras}</span>
                    <input type="number" min={0} dir="ltr" value={s.shipping} onChange={(e) => set({ shipping: parseFloat(e.target.value) || 0 })}
                      className={inputClassDark} /></label>
                </div>
              </>
            )}

            {tab === "notes" && (
              <>
                <label className="block"><span className={labelClass}>{L.notesAndTerms}</span>
                  <textarea dir="auto" rows={4} value={s.notes} onChange={(e) => set({ notes: e.target.value })} className={inputClassDark} /></label>
                <label className="block"><span className={labelClass}>{L.paymentDetails}</span>
                  <textarea dir="auto" rows={3} value={s.bankDetails} onChange={(e) => set({ bankDetails: e.target.value })} className={inputClassDark} /></label>
                <label className="block"><span className={labelClass}>{L.legalFooter}</span>
                  <input dir="auto" value={s.footer} onChange={(e) => set({ footer: e.target.value })} className={inputClassDark} /></label>
                <div>
                  <span className={labelClass}>{L.colorAccent}</span>
                  <div className="mt-1 flex flex-wrap items-center gap-2.5">
                    {ACCENTS.map((c) => (
                      <button
                        key={c}
                        onClick={() => set({ accent: c })}
                        className={`h-7 w-7 rounded-full transition ${s.accent === c ? "ring-2 ring-ink ring-offset-2" : ""}`}
                        style={{ background: c }}
                        aria-label={c}
                      />
                    ))}
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-soft"
                      title={L.customColor}>
                      <input
                        type="color"
                        value={s.accent}
                        onChange={(e) => set({ accent: e.target.value })}
                        className="h-7 w-9 cursor-pointer rounded border border-line bg-surface p-0.5"
                        aria-label={L.customColor}
                      />
                      {L.customColor}
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <PrimaryButton onClick={download} className="flex-1">{L.downloadPdf}</PrimaryButton>
          <GhostButton onClick={clearForm}>{L.clearForm}</GhostButton>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{L.livePreview}</span>
          <button onClick={() => setZoomed((z) => !z)} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-brand-500 hover:text-brand-700">
            {L.zoom}
          </button>
        </div>
        <div ref={wrapRef} dir={dir} className="overflow-x-auto rounded-lg border border-line bg-slate-100 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.08)] dark:bg-slate-800/60">
          <style>{previewCss}</style>
          <div ref={sheetRef} className="inv-sheet" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
      </div>
    </div>
  );
}
