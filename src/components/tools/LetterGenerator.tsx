"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { PrimaryButton } from "../ToolShell";
import { downloadBlob } from "@/lib/download";

type LetterType = "resignation" | "leave" | "complaint" | "appeal" | "transfer" | "job";

export default function LetterGenerator() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const isEs = locale === "es";
  const ui = isAr
    ? { copy: "نسخ", copied: "تم النسخ", download: "تنزيل", date: "التاريخ" }
    : isEs
    ? { copy: "Copiar", copied: "Copiado", download: "Descargar", date: "Fecha" }
    : { copy: "Copy", copied: "Copied", download: "Download", date: "Date" };

  const [type, setType] = useState<LetterType>("resignation");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [date, setDate] = useState(new Date().toLocaleDateString(isAr ? "ar" : isEs ? "es" : "en", { year: "numeric", month: "long", day: "numeric" }));
  const [copied, setCopied] = useState(false);

  const LETTERS: Record<LetterType, { label: string; body: (d: { name: string; company: string; position: string; date: string; ar: boolean }) => string }> =
    useMemo(() => {
      const ar = isAr;
      const n = name || (ar ? "[الاسم]" : isEs ? "[Nombre]" : "[Your name]");
      const c = company || (ar ? "[الشركة]" : isEs ? "[Empresa]" : "[Company]");
      const p = position || (ar ? "[المنصب]" : isEs ? "[Puesto]" : "[Position]");
      const d = date;
      const body = (type: LetterType) => {
        if (ar) {
          if (type === "resignation") return `إلى السيد/ة مدير ${c}\n\nالموضوع: تقديم استقالة\n\nتحية طيبة وبعد،\n\nأتقدم إليكم بخطابي هذا مقدماً استقالتي من منصبي ${p || ""} في ${c}، على أن يكون آخر يوم عمل لي بتاريخ ${d}.\n\nأشكركم على الفرصة التي أتيحت لي طوال فترة عملي، وأتمنى لكم وللشركة دوام التوفيق.\n\nوتفضلوا بقبول فائق الاحترام والتقدير،\n${n}`;
          if (type === "leave") return `إلى السيد/ة مدير ${c}\n\nالموضوع: طلب إجازة\n\nتحية طيبة وبعد،\n\nأتقدم إليكم بطلبي هذا لأخذ إجازة من تاريخ ${d}، وذلك لظروف شخصية. أرجو التكرم بالموافقة على طلبي.\n\nوتفضلوا بقبول فائق الاحترام،\n${n}`;
          if (type === "complaint") return `إلى السيد/ة مدير ${c}\n\nالموضوع: شكوى\n\nتحية طيبة وبعد،\n\nأود إحاطة سيادتكم علماً بتعرضي لبعض الصعوبات في عملي بمنصب ${p || ""}، وأرجو النظر في الأمر ومعالجته.\n\nشاكراً لكم حسن تعاونكم،\n${n}`;
          if (type === "appeal") return `إلى السيد/ة مدير ${c}\n\nالموضوع: تظلم\n\nتحية طيبة وبعد،\n\nأتقدم بهذا التظلم حول قرار صدر بحقي، وأرجو من سيادتكم إعادة النظر في الأمر وإنصافي.\n\nوتفضلوا بقبول فائق الاحترام،\n${n}`;
          if (type === "transfer") return `إلى السيد/ة مدير ${c}\n\nالموضوع: طلب نقل\n\nتحية طيبة وبعد،\n\nأرجو التكرم بالموافقة على طلبي بنقلي إلى فرع/قسم آخر، وذلك لظروف {سبب}.\n\nشاكراً لكم حسن تفهمكم،\n${n}`;
          return `إلى السيد/ة مدير ${c}\n\nالموضوع: طلب وظيفة\n\nتحية طيبة وبعد،\n\nأتقدم إليكم بطلبي هذا راغباً في الانضمام إلى فريق عملكم في منصب ${p || ""}. أرفق سيرتي الذاتية للمراجعة.\n\nمع خالص الشكر والتقدير،\n${n}`;
        }
        if (isEs) {
          if (type === "resignation") return `Estimado/a gerente de ${c},\n\nAsunto: Renuncia\n\nReciba un cordial saludo.\n\nPor medio de la presente presento mi renuncia a mi puesto ${p || ""} en ${c}, con fecha de cese el ${d}.\n\nAgradezco la oportunidad brindada durante mi trayectoria.\n\nAtentamente,\n${n}`;
          if (type === "leave") return `Estimado/a gerente de ${c},\n\nAsunto: Solicitud de permiso\n\nLe solicito un permiso personal a partir del ${d}.\n\nGracias por su atención.\n\nAtentamente,\n${n}`;
          if (type === "complaint") return `Estimado/a gerente de ${c},\n\nAsunto: Reclamación\n\nDeseo informarle de algunas dificultades en mi puesto ${p || ""} y solicito su intervención.\n\nGracias.\n\nAtentamente,\n${n}`;
          if (type === "appeal") return `Estimado/a gerente de ${c},\n\nAsunto: Recurso\n\nPresento este recurso sobre una decisión y solicito que sea revisada.\n\nAtentamente,\n${n}`;
          if (type === "transfer") return `Estimado/a gerente de ${c},\n\nAsunto: Solicitud de traslado\n\nSolicito mi traslado a otra sede por motivos personales.\n\nGracias.\n\nAtentamente,\n${n}`;
          return `Estimado/a gerente de ${c},\n\nAsunto: Solicitud de empleo\n\nDeseo postularme al puesto ${p || ""}. Adjunto mi currículum.\n\nAtentamente,\n${n}`;
        }
        if (type === "resignation") return `Dear Manager of ${c},\n\nSubject: Letter of Resignation\n\nI am writing to formally resign from my position as ${p || ""} at ${c}, with my last working day being ${d}.\n\nI am grateful for the opportunity given to me during my time here and wish the company continued success.\n\nSincerely,\n${n}`;
        if (type === "leave") return `Dear Manager of ${c},\n\nSubject: Leave Request\n\nI would like to request personal leave starting from ${d}.\n\nThank you for your consideration.\n\nSincerely,\n${n}`;
        if (type === "complaint") return `Dear Manager of ${c},\n\nSubject: Complaint\n\nI am writing to raise some concerns regarding my role as ${p || ""} and kindly request your intervention.\n\nThank you.\n\nSincerely,\n${n}`;
        if (type === "appeal") return `Dear Manager of ${c},\n\nSubject: Appeal\n\nI would like to appeal a recent decision and kindly request it be reconsidered.\n\nSincerely,\n${n}`;
        if (type === "transfer") return `Dear Manager of ${c},\n\nSubject: Transfer Request\n\nI kindly request a transfer to another branch for personal reasons.\n\nThank you.\n\nSincerely,\n${n}`;
        return `Dear Manager of ${c},\n\nSubject: Job Application\n\nI am writing to apply for the position of ${p || ""}. My CV is attached for your review.\n\nSincerely,\n${n}`;
      };
      return {
        resignation: { label: ar ? "استقالة" : isEs ? "Renuncia" : "Resignation", body: () => body("resignation") },
        leave: { label: ar ? "إجازة" : isEs ? "Permiso" : "Leave", body: () => body("leave") },
        complaint: { label: ar ? "شكوى" : isEs ? "Reclamación" : "Complaint", body: () => body("complaint") },
        appeal: { label: ar ? "تظلم" : isEs ? "Recurso" : "Appeal", body: () => body("appeal") },
        transfer: { label: ar ? "نقل" : isEs ? "Traslado" : "Transfer", body: () => body("transfer") },
        job: { label: ar ? "طلب وظيفة" : isEs ? "Empleo" : "Job Application", body: () => body("job") },
      };
    }, [isAr, isEs, name, company, position, date]);

  const letter = LETTERS[type].body({ name, company, position, date, ar: isAr });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const input = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500";
  const label = "mb-1 block text-xs font-medium text-ink-soft";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(LETTERS) as LetterType[]).map((lt) => (
          <button key={lt} onClick={() => setType(lt)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${type === lt ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line hover:border-brand-500"}`}>
            {LETTERS[lt].label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block"><span className={label}>{isAr ? "الاسم" : isEs ? "Nombre" : "Name"}</span>
          <input dir="auto" value={name} onChange={(e) => setName(e.target.value)} className={input} /></label>
        <label className="block"><span className={label}>{isAr ? "الشركة" : isEs ? "Empresa" : "Company"}</span>
          <input dir="auto" value={company} onChange={(e) => setCompany(e.target.value)} className={input} /></label>
        <label className="block"><span className={label}>{isAr ? "المنصب" : isEs ? "Puesto" : "Position"}</span>
          <input dir="auto" value={position} onChange={(e) => setPosition(e.target.value)} className={input} /></label>
      </div>
      <label className="block"><span className={label}>{ui.date}</span>
        <input dir="ltr" value={date} onChange={(e) => setDate(e.target.value)} className={input} /></label>
      <textarea dir="auto" readOnly value={letter} rows={16}
        className="w-full rounded-card border border-brand-100 bg-brand-50/40 p-4 text-sm leading-relaxed" />
      <div className="flex flex-wrap gap-3">
        <PrimaryButton onClick={copy}>{copied ? ui.copied : ui.copy}</PrimaryButton>
        <button onClick={() => downloadBlob(new Blob([letter], { type: "text/plain;charset=utf-8" }), "letter.txt")}
          className="rounded-xl border border-line bg-surface px-6 py-3 font-medium text-ink hover:border-brand-500 hover:text-brand-700">
          {ui.download} .txt
        </button>
      </div>
    </div>
  );
}
