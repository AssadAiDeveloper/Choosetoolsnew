"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  ar: "العربية",
  es: "Español",
  nl: "Nederlands",
  fr: "Français",
  de: "Deutsch",
  ru: "Русский",
  hi: "हिन्दी",
  id: "Bahasa Indonesia",
  tr: "Türkçe",
  pt: "Português",
};

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function Header() {
  const t = useTranslations("nav");
  const tc = useTranslations("categories");
  const tcommon = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [langOpen, setLangOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  function isActive(href: string) {
    return pathname === href;
  }

  const mainLinks = [
    { href: "/pdf", label: tc("pdf.name") },
    { href: "/image", label: tc("image.name") },
    { href: "/text", label: tc("text.name") },
  ];

  const featureLinks = [
    { href: "/text/invoice-generator", label: t("invoice") },
    { href: "/text/cv-builder", label: t("cv") },
  ];

  const allLinks = [
    ...mainLinks,
    { href: "/blog", label: t("blog") },
    ...featureLinks,
  ];

  const mobileLinks = [
    ...mainLinks,
    { href: "/blog", label: t("blog") },
    ...featureLinks,
  ];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const linkClass = (href: string) =>
    `header-link ${isActive(href) ? "header-link--active" : ""}`;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur dark:bg-[#0d1424]/95">
      <div className="header-container">
        {/* Left corner — Logo */}
        <div className="header-left">
          <Link href="/" className="shrink-0" aria-label="ChooseTools home">
            <Logo />
          </Link>
        </div>

        {/* Center — main nav links */}
        <nav className="header-center" aria-label="primary">
          {allLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={linkClass(item.href)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right corner — language + dark mode + (mobile) hamburger */}
        <div className="header-right">
          <ThemeToggle />
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              aria-haspopup="menu"
              aria-expanded={langOpen}
              aria-label={tcommon("changeLanguage")}
              className="header-lang-button"
            >
              <GlobeIcon />
              <span className="hidden sm:inline">{LOCALE_LABELS[locale]}</span>
              <ChevronIcon open={langOpen} />
            </button>

            {langOpen && (
              <div className="absolute end-0 top-full z-50 mt-2 w-56 origin-top-right animate-dropIn rounded-xl border border-line bg-surface p-1.5 shadow-lg dark:bg-[#0d1424]">
                {Object.entries(LOCALE_LABELS).map(([code, label]) => (
                  <button
                    key={code}
                    onClick={() => { router.replace(pathname, { locale: code }); setLangOpen(false); }}
                    className={`flex w-full items-center whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      code === locale
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-100"
                        : "text-ink hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={t("menu")}
            aria-expanded={mobileOpen}
            className="header-hamburger"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="overflow-hidden border-t border-line bg-surface px-4 py-3 dark:border-white/5 dark:bg-[#0d1424]">
          <ul className="space-y-1">
            {mobileLinks.map((item, i) => (
              <li key={i}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block break-words rounded-lg px-3 py-2.5 font-medium transition ${
                    isActive(item.href)
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-100"
                      : "text-ink hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
