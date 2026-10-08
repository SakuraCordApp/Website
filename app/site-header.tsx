"use client";

/* eslint-disable @next/next/no-img-element -- Local brand icon is already optimized. */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const DISCORD_URL = "https://discord.gg/hWNwFXkUTP";
const GITHUB_URL = "https://github.com/SakuraCordApp/SakuraCord";
const THEMES = ["light", "system", "dark"] as const;
type Theme = (typeof THEMES)[number];

const links = [
  { href: "/#features", label: "Features", match: () => false },
  { href: "/roadmap", label: "Roadmap", match: (path: string) => path === "/roadmap" },
  { href: "/releases", label: "Releases", match: (path: string) => path.startsWith("/releases") },
  { href: "/tracker", label: "Tracker", match: (path: string) => path.startsWith("/tracker") },
  { href: "/report", label: "Report", match: (path: string) => path.startsWith("/report") },
];

function savedTheme(): Theme {
  try {
    const value = localStorage.getItem("sc-theme");
    if (value === "light" || value === "dark") return value;
  } catch {}
  return "system";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle(
    "dark",
    theme === "dark" ||
      (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches),
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    // The head script applied the saved choice before paint. Apply it again in case React rebuilt
    // the document after a hydration mismatch, which drops the class, then sync the switch.
    const initial = savedTheme();
    applyTheme(initial);
    queueMicrotask(() => setTheme(initial));
    const system = matchMedia("(prefers-color-scheme: dark)");
    const follow = () => applyTheme(savedTheme());
    system.addEventListener("change", follow);
    return () => system.removeEventListener("change", follow);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, [menuOpen]);

  // Sections ease in as they reach the screen, on every page.
  useEffect(() => {
    const items = [...document.querySelectorAll(".reveal:not(.in)")];
    if (
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      items.forEach((item) => item.classList.add("in"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [pathname]);

  // The visible icon is the current choice; clicking it moves on to the next one.
  const cycleTheme = () => {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    try {
      localStorage.setItem("sc-theme", next);
    } catch {}
    applyTheme(next);
    setTheme(next);
  };

  const pageLink = (link: (typeof links)[number], onNavigate?: () => void) => (
    <li key={link.href}>
      <Link
        href={link.href}
        prefetch={link.href === "/tracker" || link.href === "/report" ? false : undefined}
        aria-current={link.match(pathname) ? "page" : undefined}
        onClick={onNavigate}
      >
        {link.label}
      </Link>
    </li>
  );

  const navLinks = (onNavigate?: () => void) => (
    <>
      {pageLink(links[0], onNavigate)}
      <li>
        {/* A plain link: /download is a Worker redirect to the latest DMG, not a page. */}
        <a href="/download" onClick={onNavigate}>
          Download
        </a>
      </li>
      {links.slice(1).map((link) => pageLink(link, onNavigate))}
      <li>
        <a href={DISCORD_URL} target="_blank" rel="noreferrer" onClick={onNavigate}>
          Discord
        </a>
      </li>
      <li>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer" onClick={onNavigate}>
          GitHub
        </a>
      </li>
    </>
  );

  return (
    <header
      className="top-nav"
      id="top-nav"
      data-menu-open={menuOpen}
      aria-label="Primary navigation"
    >
      <div className="nav-wrap">
        <nav className="nav-bar" aria-label="SakuraCord links">
          <Link className="nav-brand" href="/" aria-label="SakuraCord home">
            <img src="/site/icon-light.png" alt="" className="theme-img-light" />
            <img src="/site/icon-dark.png" alt="" className="theme-img-dark" />
            <span translate="no">SakuraCord</span>
          </Link>
          <ul className="nav-links">{navLinks()}</ul>
          <div className="nav-trailing">
            <button
              type="button"
              className="switcher"
              data-active={THEMES.indexOf(theme)}
              onClick={cycleTheme}
              aria-label={`Appearance: ${theme}. Switch to ${THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]}`}
            >
              <span className="switcher__pill" aria-hidden="true"></span>
              <span className="switcher__option" data-on={theme === "light"}>
                <span className="switcher__icon">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="10" cy="10" r="4" fill="currentColor" stroke="none" /><path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M3.9 3.9l1.4 1.4M14.7 14.7l1.4 1.4M16.1 3.9l-1.4 1.4M5.3 14.7l-1.4 1.4" /></svg>
                </span>
              </span>
              <span className="switcher__option" data-on={theme === "system"}>
                <span className="switcher__icon">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="10" rx="2" /><path d="M7 16.5h6" /></svg>
                </span>
              </span>
              <span className="switcher__option" data-on={theme === "dark"}>
                <span className="switcher__icon">
                  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M16.5 12.3A7 7 0 0 1 7.7 3.5a7 7 0 1 0 8.8 8.8Z" /></svg>
                </span>
              </span>
            </button>
            <button
              className="nav-menu-button"
              type="button"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <path className="nav-line nav-line-first" d="M3 10h14" />
                <path className="nav-line nav-line-second" d="M3 10h14" />
              </svg>
            </button>
          </div>
        </nav>
        <nav className="mobile-navigation" id="mobile-navigation" aria-label="Mobile navigation">
          <div>
            <ul>
              {navLinks(() => setMenuOpen(false))}
            </ul>
          </div>
        </nav>
      </div>
    </header>
  );
}
