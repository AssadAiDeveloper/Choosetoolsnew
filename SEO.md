# SEO — ChooseTools

مرجع هندسة SEO للموقع والتحقق من التغييرات. مكتوب للسير على إصدار `8cfe4ef` فما بعد.

---

## 1) الخريطة العامة

| البعد | الواقع |
|---|---|
| اللغات | 11: `en` (بلا بادئة) + ar, es, nl, fr, de, ru, hi, id, tr, pt — `localePrefix: "as-needed"` |
| التصنيفات | `pdf` · `image` · `text` |
| الأدوات | 101 أداة (من `src/lib/tools.ts`) |
| المدونة | ~100 مقال × لكل لغة (من `src/lib/blog.ts`) |
| Sitemap | 2321 عنواناً بلا تكرار، تحوي `lastmod`، بدون معاملات/`_rsc` |

---

## 2) الهندسة التقنية (منفّذة وناشرة)

| المكوّن | الموقع | التفاصيل |
|---|---|---|
| Sitemap | `app/sitemap.ts` | ديناميكي من `TOOLS`/`CATEGORIES`/`blogSlugs()`، مع `lastModified` من `lib/blog.ts` لكل إدخال |
| hreflang | template عام | 12 وسماً (11 لغة + `x-default` = `/en`) + canonical لكل نسخة، بحيث **كل لغة canonical لنفسها** |
| التوجيه الدائم | `middleware.ts` | `/en` و`/en/*` → **308** دائم (`slice(4)`)، وتعيين `Content-Language` لكل استجابة HTML، مع بقاء `createMiddleware(routing)` |
| robots | `app/robots.ts` | يسمح بالزحف، يستبعد فقط `/*_rsc=*` |
| JSON-LD أداة | `app/[locale]/[category]/[slug]/page.tsx` | `WebSite` + `WebApplication` (يحمل `inLanguage: locale`، `applicationCategory: UtilitiesApplication`، OS أي، Offer $0) + `FAQPage` + `BreadcrumbList` |
| JSON-LD مقالة | `app/[locale]/blog/[slug]/page.tsx` | `Article` (`inLanguage` + `about` + headline + صورة + تواريخ + author=`hoursmedia`) + `FAQPage` + `BreadcrumbList` |
| تحويلات سليمة | — | http→https **308** · www→بدون **308** · شرطة مائلة→بدون **308** · صفحات غير موجودة → 404 حقيقي |

---

## 3) القياس الحالي (فحص شباط 2026)

**ثابت (مقيس من زحف فعلي لـ 33 صفحة):**

- TTFB الوسيط **270ms** (p90 = 445ms)
- H1 = 1 في **100%** من الصفحات
- كل الأوصاف خلال حدود 50–160
- ربط داخلي ~**63 رابط/صفحة**
- RTL سليم للعربية

**ثغرات مقاسة (بترتيب الأولوية):**

| # | الثغرة | التأثير | الخطة |
|---|---|---|---|
| 1 | **صفر backlinks** | السلطة غائبة → الترتيب الرئيسي شبه مستحيل | PR/دلائل أدوات/ضيافة، 6–12 شهراً |
| 2 | **~2.5MB لكل صفحة** (js ~1.7MB + 19 خطاً/700KB) | CWV على الهواتف | تقسيم حِزم pdf.js/pdf-lib + ترشيد الخطوط — **بعد** قياس CWV الحقيقي |
| 3 | **H2 شبه معدوم** في التصنيفات (تحويلة 0) | محتوى رقيق للترتيب | إثراء صفحات pdf/image/text (30 يوماً) |
| 4 | **عناوين الأدوات قصيرة** (≤29) | فرصة كلمات مفتاحية ضائعة | توسيع العنوان إلى 40–60 مع فائدة + كلمة |
| 5 | `/blog` العنوان 71 حرفاً | مقطوع في SERP | تقصير إلى ≤60 |
| 6 | اسم متشابه (`choosetool.store`) + حساب قديم على chef.io | تشويش العلامة | إشعار/مراقبة |

---

## 4) التحقق من أي تغيير (قبل النشر)

```bash
npx tsc --noEmit
npm run build
npm run start -- -p 3999
node C:\Users\sAssa\AppData\Local\Temp\opencode\seo-audit\verify-local.mjs
```

قائمة الفحوصات التي يجب أن تمر جميعها:

1. `GET /en` → **308** والوجهة `/`
2. `GET /en/pdf/pdf-editor` → **308** → `/pdf/pdf-editor`
3. `GET /` يحمل `Content-Language: en` و`GET /ar/...` يحمل `ar`
4. `sitemap.xml` = 2321 إدخالاً وكلها بـ `lastmod`
5. JSON-LD: `WebApplication.inLanguage` = locale، و`Article.inLanguage` + `Article.about` موجودان
6. `meta description` لكل حساب المحرر ≤ 160 حرفاً

> ملاحظة: `npm run start` قد يخدم نسخة قديمة إذا بقي خادم حي على المنفذ — تحقق من PID المستمع (`Get-NetTCPConnection -LocalPort 3999`) قبل الاختبار.

---

## 5) القياسات المطلوبة منك (لم تكتمل بعد)

- **GSC**: أداء آخر 12 شهراً (queries) · Indexing/Pages · Experience/Core Web Vitals
- **PageSpeed**: روابط الفحص لـ `/pdf/pdf-to-word` و`/pdf` و`/blog` (PSI API محجوب من شبكتي، يرد 429)
- **GA4**: Traffic acquisition · Engagement/Pages · Tech/Language

---

## 6) قواعد لا يُكسر (SEO runbook)

- **لا** ميزة/صفحة دون فحص 4 أعلاه قبل الدفع.
- أي أداة جديدة تُضاف إلى `TOOLS` تظهر **تلقائياً**: في sitemap، وفي المدونة، وفي التصنيف (لا تفعّل النسخ اليدوي).
- الترجمة الحقيقية لا الآلية للصفحات الإستراتيجية (الرئيسية، pdf-to-word، pdf-editor).
- لا تُضف معاملات (`?ref=...`) إلى روابط indexable دون canonical/استبعاد في robots.
- لا تحذف لغةً من `routing.locales` دون حذف وسوم hreflang المقابلة — كسرها يبطل `x-default`.
- أي تعديل في `middleware.ts` يمس كل اللغات: أعد `build` وكرر فحص 2 و3 و4.
- لا تعدّل `messages/en.json` (أوصاف/عناوين الأدوات) دون الحفاظ على الحدود: عنوان 30–60، وصف ≤160.