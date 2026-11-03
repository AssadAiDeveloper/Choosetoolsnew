import React from "react";
import { Link } from "@/i18n/navigation";
import { findToolForSlug } from "@/lib/blog";

interface Props {
  text: string;
  locale: string;
}

type Node = string | React.ReactElement;

/**
 * Renders inline formatting in guide text:
 *   - [text](https://...)        external link (rel="noopener noreferrer", no nofollow)
 *   - [tool-slug:Link text]     internal tool link (localized path)
 *   - **bold**
 *   - *italic*
 *   - `code`
 * Everything else is escaped (rendered as text).
 */
export function InlineText({ text, locale }: Props) {
  const nodes = parseInline(text, locale);
  return <>{nodes}</>;
}

export function parseInline(text: string, locale: string): Node[] {
  const out: Node[] = [];
  // Tokenize: try to match patterns in priority order.
  const re = /(\[([^\]]+)\]\((https?:\/\/[^)]+)\)|\[([a-z0-9-]+):([^\]]+)\]|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const full = m[0];
    if (m[3]) {
      // external link: [text](url)
      out.push(
        <a key={key++} href={m[3]} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 underline">
          {m[2]}
        </a>
      );
    } else if (m[4] && m[5]) {
      // internal tool link: [slug:text]
      const slug = m[4];
      const label = m[5];
      const tool = findToolForSlug(slug);
      const href = tool ? `/${tool.category}/${slug}` : `/guides/${slug}`;
      out.push(
        <Link key={key++} href={href} className="font-medium text-brand-700 underline">
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
