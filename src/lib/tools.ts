export const SITE_NAME = "ChooseTools";
export const SITE_URL = "https://www.choosetools.com";

export type Category = "pdf" | "image" | "text";
export type SubCategory =
  | "organize" | "convert" | "optimize" | "security"
  | "resize-crop" | "optimize-img"
  | "text-tools" | "developer-tools" | "arabic-text-tools";

export interface Tool {
  slug: string;
  category: Category;
  subCategory: SubCategory;
  icon: string;
  component: string;
}

export const CATEGORIES: Category[] = ["pdf", "image", "text"];

export interface SubFilter {
  key: SubCategory | "all";
  labelKey: string;          // translation key suffix inside `sub.${cat}`
}

export const SUB_FILTERS: Record<Category, SubFilter[]> = {
  pdf: [
    { key: "all",       labelKey: "all" },
    { key: "organize",  labelKey: "organize" },
    { key: "convert",   labelKey: "convert" },
    { key: "optimize",  labelKey: "optimize" },
    { key: "security",  labelKey: "security" },
  ],
  image: [
    { key: "all",         labelKey: "all" },
    { key: "resize-crop", labelKey: "resizeCrop" },
    { key: "convert",     labelKey: "convert" },
    { key: "optimize-img", labelKey: "optimize" },
  ],
  text: [
    { key: "all",              labelKey: "all" },
    { key: "text-tools",       labelKey: "textTools" },
    { key: "developer-tools",  labelKey: "devTools" },
    { key: "arabic-text-tools", labelKey: "arabicTools" },
  ],
};

export const TOOLS: Tool[] = [
  // ── PDF ──────────────────────────────────────────────────────────
  { slug: "merge-pdf",          category: "pdf", subCategory: "organize",  icon: "merge",     component: "MergePdf" },
  { slug: "split-pdf",          category: "pdf", subCategory: "organize",  icon: "split",     component: "SplitPdf" },
  { slug: "rotate-pdf",         category: "pdf", subCategory: "organize",  icon: "rotate",    component: "RotatePdf" },
  { slug: "delete-pdf-pages",   category: "pdf", subCategory: "organize",  icon: "delete",    component: "DeletePdfPages" },
  { slug: "reorder-pdf",        category: "pdf", subCategory: "organize",  icon: "reorder",   component: "ReorderPdf" },
  { slug: "extract-pdf-pages",  category: "pdf", subCategory: "organize",  icon: "extract",     component: "ExtractPdfPages" },
  { slug: "organize-pdf",       category: "pdf", subCategory: "organize",  icon: "reorder",   component: "OrganizePdf" },
  { slug: "crop-pdf",           category: "pdf", subCategory: "organize",  icon: "crop",      component: "CropPdf" },
  { slug: "flatten-pdf",        category: "pdf", subCategory: "organize",  icon: "flatten",   component: "FlattenPdf" },

  { slug: "jpg-to-pdf",         category: "pdf", subCategory: "convert",   icon: "img2pdf",   component: "JpgToPdf" },
  { slug: "pdf-to-jpg",         category: "pdf", subCategory: "convert",   icon: "pdf2img",   component: "PdfToJpg" },
  { slug: "png-to-pdf",         category: "pdf", subCategory: "convert",   icon: "convert",   component: "PngToPdf" },
  { slug: "images-to-pdf",      category: "pdf", subCategory: "convert",   icon: "img2pdf",   component: "ImagesToPdf" },
  { slug: "pdf-to-text",        category: "pdf", subCategory: "convert",   icon: "file-code",   component: "PdfToText" },
  { slug: "pdf-to-audio",       category: "pdf", subCategory: "convert",   icon: "audio",     component: "PdfToAudio" },

  { slug: "compress-pdf",       category: "pdf", subCategory: "optimize",  icon: "compress",  component: "CompressPdf" },
  { slug: "watermark-pdf",      category: "pdf", subCategory: "optimize",  icon: "watermark", component: "WatermarkPdf" },
  { slug: "page-numbers-pdf",   category: "pdf", subCategory: "optimize",  icon: "numbers",   component: "PageNumbersPdf" },
  { slug: "grayscale-pdf",      category: "pdf", subCategory: "optimize",  icon: "grayscale",   component: "GrayscalePdf" },
  { slug: "pdf-metadata",       category: "pdf", subCategory: "optimize",  icon: "info",      component: "PdfMetadata" },

  { slug: "protect-pdf",        category: "pdf", subCategory: "security",  icon: "shield",    component: "ProtectPdf" },
  { slug: "pdf-redaction",      category: "pdf", subCategory: "security",  icon: "redact",    component: "PdfRedaction" },
  { slug: "pdf-editor",         category: "pdf", subCategory: "security",  icon: "edit",      component: "PdfEditor" },

  // ── Image ────────────────────────────────────────────────────────
  { slug: "resize-image",       category: "image", subCategory: "resize-crop", icon: "resize",   component: "ResizeImage" },
  { slug: "rotate-image",       category: "image", subCategory: "resize-crop", icon: "rotate-cw",   component: "RotateImage" },
  { slug: "flip-image",         category: "image", subCategory: "resize-crop", icon: "flip",     component: "FlipImage" },
  { slug: "crop-image",         category: "image", subCategory: "resize-crop", icon: "crop-img",     component: "CropImage" },
  { slug: "circle-crop",        category: "image", subCategory: "resize-crop", icon: "circle",   component: "CircleCrop" },
  { slug: "round-corners",      category: "image", subCategory: "resize-crop", icon: "round",    component: "RoundCorners" },
  { slug: "id-photo",           category: "image", subCategory: "resize-crop", icon: "id",       component: "IdPhoto" },
  { slug: "document-scanner",   category: "image", subCategory: "resize-crop", icon: "scanner",  component: "DocumentScanner" },

  { slug: "convert-image",      category: "image", subCategory: "convert",     icon: "image-convert",  component: "ConvertImage" },
  { slug: "heic-to-jpg",        category: "image", subCategory: "convert",     icon: "image-convert",  component: "HeicToJpg" },
  { slug: "svg-to-png",         category: "image", subCategory: "convert",     icon: "image-convert",  component: "SvgToPng" },
  { slug: "png-to-jpg",         category: "image", subCategory: "convert",     icon: "image-convert",  component: "PngToJpg" },
  { slug: "webp-to-jpg",        category: "image", subCategory: "convert",     icon: "image-convert",  component: "WebpToJpg" },
  { slug: "jpg-to-webp",        category: "image", subCategory: "convert",     icon: "image-convert",  component: "JpgToWebp" },
  { slug: "image-to-base64",    category: "image", subCategory: "convert",     icon: "binary",     component: "ImageToBase64" },

  { slug: "compress-image",     category: "image", subCategory: "optimize-img", icon: "compress-img",  component: "CompressImage" },
  { slug: "remove-exif",        category: "image", subCategory: "optimize-img", icon: "remove-exif",    component: "RemoveExif" },
  { slug: "blur-image",         category: "image", subCategory: "optimize-img", icon: "blur",      component: "BlurImage" },
  { slug: "image-filters",      category: "image", subCategory: "optimize-img", icon: "image-filters",   component: "ImageFilters" },
  { slug: "add-text-to-image",  category: "image", subCategory: "optimize-img", icon: "text-overlay", component: "AddTextToImage" },
  { slug: "pixelate-image",     category: "image", subCategory: "optimize-img", icon: "pixelate",     component: "PixelateImage" },
  { slug: "color-picker",       category: "image", subCategory: "optimize-img", icon: "picker",    component: "ColorPicker" },
  { slug: "steganography",      category: "image", subCategory: "optimize-img", icon: "stego",     component: "Steganography" },
  { slug: "favicon-generator",  category: "image", subCategory: "optimize-img", icon: "favicon",   component: "FaviconGenerator" },

  // ── Text & Developer ─────────────────────────────────────────────
  { slug: "word-counter",         category: "text", subCategory: "text-tools",       icon: "count",     component: "WordCounter" },
  { slug: "case-converter",       category: "text", subCategory: "text-tools",       icon: "case",      component: "CaseConverter" },
  { slug: "find-replace",         category: "text", subCategory: "text-tools",       icon: "replace",   component: "FindReplace" },
  { slug: "sort-lines",           category: "text", subCategory: "text-tools",       icon: "sort",      component: "SortLines" },
  { slug: "reverse-text",         category: "text", subCategory: "text-tools",       icon: "flip-text",      component: "ReverseText" },
  { slug: "text-to-slug",         category: "text", subCategory: "text-tools",       icon: "url",      component: "TextToSlug" },
  { slug: "text-diff",            category: "text", subCategory: "text-tools",       icon: "diff",      component: "TextDiff" },
  { slug: "remove-duplicate-lines", category: "text", subCategory: "text-tools",     icon: "dedupe",    component: "RemoveDuplicateLines" },
  { slug: "lorem-ipsum",          category: "text", subCategory: "text-tools",       icon: "lorem",     component: "LoremIpsum" },
  { slug: "password-generator",   category: "text", subCategory: "text-tools",       icon: "key",       component: "PasswordGenerator" },
  { slug: "qr-generator",         category: "text", subCategory: "text-tools",       icon: "qr",        component: "QrGenerator" },
  { slug: "qr-with-logo",         category: "text", subCategory: "text-tools",       icon: "qr",        component: "QrWithLogo" },
  { slug: "age-calculator",       category: "text", subCategory: "text-tools",       icon: "calendar",  component: "AgeCalculator" },
  { slug: "invoice-generator",    category: "text", subCategory: "text-tools",       icon: "invoice",   component: "InvoiceGenerator" },
  { slug: "cv-builder",           category: "text", subCategory: "text-tools",       icon: "cv",        component: "CvBuilder" },
  { slug: "certificate-generator", category: "text", subCategory: "text-tools",     icon: "cert",      component: "CertificateGenerator" },
  { slug: "letter-generator",     category: "text", subCategory: "text-tools",       icon: "letter",    component: "LetterGenerator" },
  { slug: "id-card-generator",    category: "text", subCategory: "text-tools",       icon: "idcard",    component: "IdCardGenerator" },
  { slug: "ghost-text",           category: "text", subCategory: "text-tools",       icon: "ghost",     component: "GhostText" },
  { slug: "handwriting",          category: "text", subCategory: "text-tools",       icon: "pen",       component: "Handwriting" },

  { slug: "json-formatter",       category: "text", subCategory: "developer-tools",  icon: "braces",      component: "JsonFormatter" },
  { slug: "base64",               category: "text", subCategory: "developer-tools",  icon: "binary",      component: "Base64Tool" },
  { slug: "css-minifier",         category: "text", subCategory: "developer-tools",  icon: "minimize",      component: "CssMinifier" },
  { slug: "markdown-to-html",     category: "text", subCategory: "developer-tools",  icon: "file-code",      component: "MarkdownToHtml" },
  { slug: "html-encode",          category: "text", subCategory: "developer-tools",  icon: "code",      component: "HtmlEncode" },
  { slug: "url-encode",           category: "text", subCategory: "developer-tools",  icon: "url",      component: "UrlEncode" },
  { slug: "csv-json",             category: "text", subCategory: "developer-tools",  icon: "table",     component: "CsvJson" },
  { slug: "excel-to-csv",         category: "text", subCategory: "developer-tools",  icon: "table",     component: "ExcelToCsv" },
  { slug: "csv-to-excel",         category: "text", subCategory: "developer-tools",  icon: "table",     component: "CsvToExcel" },
  { slug: "excel-to-json",        category: "text", subCategory: "developer-tools",  icon: "table",     component: "ExcelToJson" },
  { slug: "json-to-excel",        category: "text", subCategory: "developer-tools",  icon: "table",     component: "JsonToExcel" },
  { slug: "mt940-to-excel",       category: "text", subCategory: "developer-tools",  icon: "bank",      component: "Mt940ToExcel" },
  { slug: "excel-to-mt940",       category: "text", subCategory: "developer-tools",  icon: "bank",      component: "ExcelToMt940" },
  { slug: "txt-to-mt940",         category: "text", subCategory: "developer-tools",  icon: "bank",      component: "TxtToMt940" },
  { slug: "uuid-generator",       category: "text", subCategory: "developer-tools",  icon: "key-round",       component: "UuidGenerator" },
  { slug: "hash-generator",       category: "text", subCategory: "developer-tools",  icon: "hash",      component: "HashGenerator" },
  { slug: "binary-text",          category: "text", subCategory: "developer-tools",  icon: "binary",      component: "BinaryText" },
  { slug: "morse-code",           category: "text", subCategory: "developer-tools",  icon: "morse",     component: "MorseCode" },
  { slug: "number-base",          category: "text", subCategory: "developer-tools",  icon: "number-base",      component: "NumberBase" },
  { slug: "roman-numerals",       category: "text", subCategory: "developer-tools",  icon: "numbers",   component: "RomanNumerals" },
  { slug: "random-number",        category: "text", subCategory: "developer-tools",  icon: "dice",      component: "RandomNumber" },
  { slug: "color-converter",      category: "text", subCategory: "developer-tools",  icon: "palette",   component: "ColorConverter" },
  { slug: "timestamp-converter",  category: "text", subCategory: "developer-tools",  icon: "clock",     component: "TimestampConverter" },
  { slug: "code-snippet",         category: "text", subCategory: "developer-tools",  icon: "code-snip", component: "CodeSnippet" },
  { slug: "file-xray",            category: "text", subCategory: "developer-tools",  icon: "xray",      component: "FileXray" },

  { slug: "remove-tashkeel",         category: "text", subCategory: "arabic-text-tools", icon: "text-ar",      component: "RemoveTashkeel" },
  { slug: "arabic-numerals",         category: "text", subCategory: "arabic-text-tools", icon: "ar-numerals",      component: "ArabicNumerals" },
  { slug: "hijri-gregorian",         category: "text", subCategory: "arabic-text-tools", icon: "hijri",     component: "HijriGregorian" },
  { slug: "tafqit",                  category: "text", subCategory: "arabic-text-tools", icon: "tafqit",       component: "Tafqit" },
  { slug: "arabic-keyboard",         category: "text", subCategory: "arabic-text-tools", icon: "keyboard",     component: "ArabicKeyboard" },
  { slug: "arabic-transliteration",  category: "text", subCategory: "arabic-text-tools", icon: "transliterate",      component: "ArabicTransliteration" },
  { slug: "zakat-calculator",        category: "text", subCategory: "arabic-text-tools", icon: "zakat",         component: "ZakatCalculator" },
];

/** Popular tools surfaced in the footer for internal linking */
export const POPULAR_SLUGS = [
  "merge-pdf",
  "compress-image",
  "heic-to-jpg",
  "qr-generator",
  "hijri-gregorian",
  "remove-tashkeel",
];

export function toolsByCategory(cat: Category): Tool[] {
  return TOOLS.filter((t) => t.category === cat);
}

export function findTool(category: string, slug: string): Tool | undefined {
  return TOOLS.find((t) => t.category === category && t.slug === slug);
}

export const CATEGORY_COLOR: Record<Category, string> = {
  pdf: "var(--color-cat-pdf)",
  image: "var(--color-cat-image)",
  text: "var(--color-cat-text)",
};

// iLovePDF-style flat icons: solid colored tile + white filled glyph.
// Full literal class names so Tailwind can statically generate them.
// Invoice & CV feature tools get the brand green.
export const ICON_TINT_CLASSES: Record<string, string> = {
  pdf: "bg-red-500 text-white",
  image: "bg-orange-500 text-white",
  text: "bg-blue-500 text-white",
  invoice: "bg-emerald-600 text-white",
  cv: "bg-emerald-600 text-white",
};

export function iconTintClass(tool: { category: Category; slug: string }): string {
  if (tool.slug === "invoice-generator") return ICON_TINT_CLASSES.invoice;
  if (tool.slug === "cv-builder") return ICON_TINT_CLASSES.cv;
  if (tool.slug === "id-card-generator") return ICON_TINT_CLASSES.invoice;
  return ICON_TINT_CLASSES[tool.category];
}
