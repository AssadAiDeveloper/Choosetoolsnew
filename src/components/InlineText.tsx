import React from "react";
import { Link } from "@/i18n/navigation";
import { findToolForSlug } from "@/lib/blog";
import { TOOLS } from "@/lib/tools";

interface Props {
  text: string;
  locale: string;
}

type Node = string | React.ReactElement;

export function InlineText({ text, locale }: Props) {
  const nodes = parseInline(text, locale);
  return <>{nodes}</>;
}

export function parseInline(text: string, locale: string): Node[] {
  const out: Node[] = [];
  const re = /(\[([^\]]+)\]\(([^)]+)\)|\[([a-z0-9-]+):([^\]]+)\]|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const full = m[0];
    if (m[2] && m[3]) {
      const label = m[2];
      const target = m[3];
      if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("//")) {
        out.push(
          <a key={key++} href={target} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 underline">
            {label}
          </a>
        );
      } else if (target.startsWith("/")) {
        const prefix = locale === "en" ? "" : `/${locale}`;
        out.push(
          <Link key={key++} href={`${prefix}${target}`} className="font-medium text-brand-700 underline">
            {label}
          </Link>
        );
      } else {
        out.push(full);
      }
    } else if (m[4] && m[5]) {
      const slug = m[4];
      const label = m[5];
      const tool = findToolForSlug(slug);
      const href = tool ? `/${tool.category}/${slug}` : `/guides/${slug}`;
      const prefix = locale === "en" ? "" : `/${locale}`;
      out.push(
        <Link key={key++} href={`${prefix}${href}`} className="font-medium text-brand-700 underline">
          {label}
        </Link>
      );
    } else if (m[6]) {
      out.push(<strong key={key++}>{m[6]}</strong>);
    } else if (m[7]) {
      out.push(<em key={key++}>{m[7]}</em>);
    } else if (m[8]) {
      out.push(<code key={key++} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-sm">{m[8]}</code>);
    } else {
      out.push(full);
    }
    last = m.index + full.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// Export TOOLS for validator reuse
export { TOOLS };
