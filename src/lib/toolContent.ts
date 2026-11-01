// Data-driven content for tool pages (audit T13).
// Only tools listed here get the how-to / FAQ / limits / privacy / related
// blocks; the template renders nothing for tools without an entry.
// `draft` marks machine-drafted non-English versions; English is the source.

export interface ToolContent {
  howTo: string[];            // 3 steps
  faqs: { q: string; a: string }[];  // 3-5
  limits: string;             // file size / formats; "TODO verify" where unknown
  privacy: string;
  related: string[];          // 3 slugs
  draft?: boolean;
}

const PRIVACY = "Processed entirely in your browser. Nothing is uploaded to any server.";

export const TOOL_CONTENT: Record<string, ToolContent> = {
  "merge-pdf": {
    howTo: ["Upload two or more PDF files.", "Drag them into the order you want.", "Download the merged PDF."],
    faqs: [
      { q: "Is it free?", a: "Yes, completely free with no watermarks." },
      { q: "Are my files uploaded?", a: "No. Everything runs in your browser." },
      { q: "Is there a page limit?", a: "No hard limit; depends on device memory." },
    ],
    limits: "PDF files; no hard size limit (device memory).",
    privacy: PRIVACY,
    related: ["compress-pdf", "split-pdf", "pdf-to-jpg"],
  },
  "compress-pdf": {
    howTo: ["Upload a PDF.", "Choose compression level.", "Download the smaller PDF."],
    faqs: [
      { q: "Does it reduce quality?", a: "Lossless structural optimization; text and images are not re-encoded by default." },
      { q: "Are files uploaded?", a: "No, processed locally." },
    ],
    limits: "PDF files; large files depend on device memory.",
    privacy: PRIVACY,
    related: ["merge-pdf", "flatten-pdf", "pdf-metadata"],
  },
  "pdf-to-word": {
    howTo: ["Upload a PDF.", "Wait while text and layout are extracted.", "Download the DOCX."],
    faqs: [
      { q: "Is the text editable?", a: "Yes, the output is a real Word document." },
      { q: "Scanned PDFs?", a: "OCR fallback is used when no text layer exists." },
    ],
    limits: "PDF files; OCR for scanned pages.",
    privacy: PRIVACY,
    related: ["pdf-to-excel", "pdf-to-text", "merge-pdf"],
  },
  "protect-pdf": {
    howTo: ["Upload a password-protected PDF.", "Enter the password when prompted.", "Download the unlocked PDF."],
    faqs: [
      { q: "Does it add a password?", a: "No, this tool removes a password." },
      { q: "What if I forgot the password?", a: "The file cannot be unlocked without it." },
    ],
    limits: "PDF files encrypted with a user or owner password.",
    privacy: PRIVACY,
    related: ["pdf-redaction", "flatten-pdf", "pdf-metadata"],
  },
  "compress-image": {
    howTo: ["Upload an image.", "Adjust quality.", "Download the compressed image."],
    faqs: [
      { q: "Which formats?", a: "JPG, PNG and WebP." },
      { q: "Are files uploaded?", a: "No, processed locally." },
    ],
    limits: "JPG/PNG/WebP; quality 0-100.",
    privacy: PRIVACY,
    related: ["resize-image", "convert-image", "image-filters"],
  },
  "qr-generator": {
    howTo: ["Enter text or a URL.", "Customize colors and size.", "Download the QR code."],
    faqs: [
      { q: "Can I add a logo?", a: "Yes, use QR with Logo." },
      { q: "Is it free?", a: "Yes." },
    ],
    limits: "Text up to a few thousand characters (QR capacity).",
    privacy: PRIVACY,
    related: ["qr-with-logo", "color-converter", "text-to-slug"],
  },
  "tafqit": {
    howTo: ["Enter an amount.", "Choose language and currency.", "Copy the written form."],
    faqs: [
      { q: "Which languages?", a: "Arabic and others supported." },
      { q: "Is it accurate?", a: "Yes, standard number-to-words." },
    ],
    limits: "Numbers within standard integer range.",
    privacy: PRIVACY,
    related: ["arabic-numerals", "zakat-calculator", "invoice-generator"],
  },
  "hijri-gregorian": {
    howTo: ["Pick a date.", "Choose conversion direction.", "Read the converted date."],
    faqs: [
      { q: "Both directions?", a: "Yes, Gregorian to Hijri and back." },
    ],
    limits: "Standard date range.",
    privacy: PRIVACY,
    related: ["age-calculator", "timestamp-converter", "arabic-numerals"],
  },
  "zakat-calculator": {
    howTo: ["Enter your assets.", "Enter liabilities.", "Read zakat due."],
    faqs: [
      { q: "Nisab threshold?", a: "Calculated from current gold/silver values (TODO verify)." },
    ],
    limits: "Manual entry; rates are indicative.",
    privacy: PRIVACY,
    related: ["tafqit", "invoice-generator", "mt940-to-excel"],
  },
  "remove-tashkeel": {
    howTo: ["Paste Arabic text.", "Click remove.", "Copy the result."],
    faqs: [
      { q: "Removes all diacritics?", a: "Yes, tashkeel marks are stripped." },
    ],
    limits: "Text input; no size limit stated.",
    privacy: PRIVACY,
    related: ["arabic-transliteration", "case-converter", "text-to-slug"],
  },
  "arabic-transliteration": {
    howTo: ["Paste Arabic or Latin text.", "Choose direction.", "Copy the result."],
    faqs: [
      { q: "Standards?", a: "Common transliteration schemes." },
    ],
    limits: "Text input.",
    privacy: PRIVACY,
    related: ["remove-tashkeel", "arabic-numerals", "arabic-keyboard"],
  },
  "arabic-numerals": {
    howTo: ["Paste text with digits.", "Choose conversion.", "Copy the result."],
    faqs: [
      { q: "Eastern and Western Arabic?", a: "Yes, both directions." },
    ],
    limits: "Text input.",
    privacy: PRIVACY,
    related: ["arabic-transliteration", "remove-tashkeel", "tafqit"],
  },
  "arabic-keyboard": {
    howTo: ["Type using the on-screen keyboard.", "Copy the text.", "Use in any app."],
    faqs: [
      { q: "Works offline?", a: "Yes." },
    ],
    limits: "Browser-based.",
    privacy: PRIVACY,
    related: ["arabic-transliteration", "arabic-numerals", "remove-tashkeel"],
  },
  "mt940-to-excel": {
    howTo: ["Upload an MT940 file.", "Review parsed transactions.", "Download XLSX."],
    faqs: [
      { q: "What is MT940?", a: "A SWIFT bank statement format." },
    ],
    limits: "MT940 text files (TODO verify size).",
    privacy: PRIVACY,
    related: ["excel-to-mt940", "txt-to-mt940", "csv-json"],
  },
  "excel-to-mt940": {
    howTo: ["Upload an Excel file.", "Map columns.", "Download MT940."],
    faqs: [
      { q: "Output format?", a: "Standard MT940." },
    ],
    limits: "Excel files (TODO verify size).",
    privacy: PRIVACY,
    related: ["mt940-to-excel", "txt-to-mt940", "csv-json"],
  },
  "txt-to-mt940": {
    howTo: ["Paste or upload text.", "Parse fields.", "Download MT940."],
    faqs: [
      { q: "Input format?", a: "Plain text transaction list." },
    ],
    limits: "Text input (TODO verify).",
    privacy: PRIVACY,
    related: ["mt940-to-excel", "excel-to-mt940", "csv-json"],
  },
  "id-card-generator": {
    howTo: ["Fill employee details.", "Upload photo.", "Download the ID card PDF."],
    faqs: [
      { q: "Size?", a: "85.6 x 54 mm (credit-card size)." },
    ],
    limits: "One card per export.",
    privacy: PRIVACY,
    related: ["certificate-generator", "cv-builder", "invoice-generator"],
  },
  "certificate-generator": {
    howTo: ["Fill recipient and issuer details.", "Customize design.", "Download the certificate PDF."],
    faqs: [
      { q: "Selectable text?", a: "Yes, the PDF contains real text." },
    ],
    limits: "One certificate per export.",
    privacy: PRIVACY,
    related: ["id-card-generator", "cv-builder", "invoice-generator"],
  },
  "invoice-generator": {
    howTo: ["Fill company and client details.", "Add line items.", "Print or save as PDF."],
    faqs: [
      { q: "Currencies?", a: "27 currencies supported." },
      { q: "Selectable text?", a: "Yes, via browser print." },
    ],
    limits: "Browser print; A4 layout.",
    privacy: PRIVACY,
    related: ["cv-builder", "id-card-generator", "certificate-generator"],
  },
  "cv-builder": {
    howTo: ["Fill in your details.", "Choose a template.", "Export the PDF."],
    faqs: [
      { q: "Is the PDF selectable?", a: "No, the export is a single raster image." },
      { q: "ATS compatible?", a: "No, the PDF is a raster image without a text layer." },
    ],
    limits: "Single-page A4 raster export.",
    privacy: PRIVACY,
    related: ["invoice-generator", "certificate-generator", "id-card-generator"],
  },
};
