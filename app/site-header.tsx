"use client";

/* eslint-disable @next/next/no-img-element -- Local brand icon is already optimized. */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecksIcon } from "@phosphor-icons/react/dist/csr/ListChecks";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { GithubLogoIcon } from "@phosphor-icons/react/dist/csr/GithubLogo";
import { ListIcon } from "@phosphor-icons/react/dist/csr/List";
import { MapTrifoldIcon } from "@phosphor-icons/react/dist/csr/MapTrifold";
import { useEffect, useRef, useState } from "react";
import { DiscordMark } from "./discord-mark";

const DISCORD_URL = "https://discord.gg/hWNwFXkUTP";
const GITHUB_URL = "https://github.com/SakuraCordApp/SakuraCord";

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const closeMenuFromOutside = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (
        menuButtonRef.current?.contains(event.target) ||
        navigationRef.current?.contains(event.target)
      ) {
        return;
      }
      setMenuOpen(false);
    };

    const closeMenuFromEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeMenuFromOutside);
    document.addEventListener("keydown", closeMenuFromEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenuFromOutside);
      document.removeEventListener("keydown", closeMenuFromEscape);
    };
  }, [menuOpen]);

  return (
    <header className="site-header" aria-label="Primary navigation">
      <div className="header-inner">
        <Link className="brand-link" href="/" aria-label="SakuraCord home">
          <img
            src="/brand/favicon.png"
            alt=""
            width={42}
            height={42}
            aria-hidden="true"
          />
          <span translate="no">SakuraCord</span>
        </Link>

        <button
          ref={menuButtonRef}
          className="menu-button"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <ListIcon aria-hidden="true" weight="bold" />
        </button>

        <nav
          ref={navigationRef}
          id="primary-navigation"
          className={menuOpen ? "nav-links is-open" : "nav-links"}
          aria-label="SakuraCord links"
        >
          <Link
            href="/roadmap"
            aria-current={pathname === "/roadmap" ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            <MapTrifoldIcon aria-hidden="true" weight="regular" />
            <span>Roadmap</span>
          </Link>
          <Link
            href="/tracker"
            prefetch={false}
            aria-current={pathname.startsWith("/tracker") ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            <ListChecksIcon aria-hidden="true" weight="regular" />
            <span>Tracker</span>
          </Link>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            <DiscordMark />
            <span>Discord</span>
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            <GithubLogoIcon aria-hidden="true" weight="fill" />
            <span>GitHub</span>
          </a>
          <a
            className="header-download"
            href="/download"
            aria-label="Download SakuraCord alpha for macOS"
            onClick={() => setMenuOpen(false)}
          >
            <DownloadSimpleIcon aria-hidden="true" weight="bold" />
            <span>Download</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
