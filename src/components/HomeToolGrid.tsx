"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  TOOLS,
  SUB_FILTERS,
  iconTintClass,
  type Category,
  type SubCategory,
} from "@/lib/tools";
import { ToolIcon } from "./ToolIcon";

const MAIN_CATS: Category[] = ["pdf", "image", "text"];

type MainKey = "all" | Category;
type SubKey = SubCategory | "all";

export function HomeToolGrid() {
  const t = useTranslations();
  const [q, setQ] = useState("");
  const [main, setMain] = useState<MainKey>("all");
  const [sub, setSub] = useState<SubKey>("all");

  const searched = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return TOOLS;
    return TOOLS.filter((tool) => {
      const name = t(`tools.${tool.slug}.name`).toLowerCase();
      const desc = t(`tools.${tool.slug}.desc`).toLowerCase();
      return name.includes(needle) || desc.includes(needle) || tool.slug.includes(needle);
    });
  }, [q, t]);

  const filtered = useMemo(() => {
    let list = searched;
    if (main !== "all") list = list.filter((tool) => tool.category === main);
    if (main !== "all" && sub !== "all") list = list.filter((tool) => tool.subCategory === sub);
    return list;
  }, [searched, main, sub]);

  const counts = useMemo(() => {
    const c: Record<MainKey, number> = { all: searched.length, pdf: 0, image: 0, text: 0 };
    for (const tool of searched) c[tool.category] = (c[tool.category] || 0) + 1;
    return c;
  }, [searched]);

  const subCounts = useMemo(() => {
    const c = {} as Record<SubKey, number>;
    c.all = 0;
    if (main === "all") return c;
    const pool = searched.filter((tool) => tool.category === main);
    for (const f of SUB_FILTERS[main]) {
      if (f.key === "all") c.all = pool.length;
      else c[f.key] = pool.filter((tool) => tool.subCategory === f.key).length;
    }
    return c;
  }, [searched, main]);

  function selectMain(next: MainKey) {
    setMain(next);
    setSub("all");
  }

  const subFilters = main === "all" ? [] : SUB_FILTERS[main];

  return (
    <div id="all-tools">
      <div className="mx-auto max-w-xl">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("home.search")}
          className="w-full rounded-xl border border-line bg-surface px-5 py-3.5 text-base text-start text-ink shadow-sm outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:placeholder:text-slate-300"
        />
      </div>

      <div className="mx-auto mt-6 max-w-3xl">
        <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-full bg-gray-100 p-1.5 dark:bg-slate-800/60">
          <TabPill
            active={main === "all"}
            onClick={() => selectMain("all")}
            label={t("nav.allTools")}
            count={counts.all}
          />
          {MAIN_CATS.map((cat) => (
            <TabPill
              key={cat}
              active={main === cat}
              onClick={() => selectMain(cat)}
              label={t(`categories.${cat}.name`)}
              count={counts[cat]}
            />
          ))}
        </div>

        {subFilters.length > 0 && (
          <div key={main} className="mt-3 flex flex-wrap items-center justify-center gap-1.5 rounded-full bg-gray-50 p-1.5 animate-dropIn dark:bg-slate-800/40">
            {subFilters.map((f) => (
              <TabPill
                key={f.key}
                active={sub === f.key}
                onClick={() => setSub(f.key)}
                label={t(`sub.${main}.${f.labelKey}`)}
                count={subCounts[f.key] || 0}
                small
              />
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-ink-soft">{t("home.noResults")}</p>
      )}

      <div key={main + sub + q} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-fadeIn">
        {filtered.map((tool) => (
          <Link
              key={tool.slug}
              href={`/${tool.category}/${tool.slug}`}
              className="group flex items-start gap-3.5 rounded-card border border-slate-400 bg-surface p-4 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:border-brand-500 hover:shadow-md dark:border-slate-600 dark:hover:border-brand-500 dark:hover:shadow-black/40"
            >
              <span
                className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconTintClass(tool)}`}
              >
                <ToolIcon icon={tool.icon} />
              </span>
              <span>
                <span className="block font-semibold text-start group-hover:text-brand-700">
                  {t(`tools.${tool.slug}.name`)}
                </span>
                <span className="mt-0.5 block text-sm leading-snug text-start text-ink-soft">
                  {t(`tools.${tool.slug}.desc`)}
                </span>
              </span>
            </Link>
        ))}
      </div>
    </div>
  );
}

function TabPill({
  active,
  onClick,
  label,
  count,
  small,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full font-medium transition-all duration-200 ${
        small ? "px-3.5 py-1.5 text-xs" : "px-4 py-2 text-sm"
      } ${
        active
          ? "bg-brand-600 text-white shadow-sm"
          : "bg-transparent text-ink-soft hover:bg-surface hover:text-ink dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 font-mono ${
          small ? "text-[10px]" : "text-xs"
        } ${active ? "bg-white/20" : "bg-gray-200/60 text-ink-soft dark:bg-slate-700/60"}`}
      >
        {count}
      </span>
    </button>
  );
}
