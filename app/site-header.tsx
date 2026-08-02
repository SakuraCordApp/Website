"use client";

/* eslint-disable @next/next/no-img-element -- Local brand icon is already optimized. */

import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { GithubLogoIcon } from "@phosphor-icons/react/dist/csr/GithubLogo";
import { ListIcon } from "@phosphor-icons/react/dist/csr/List";
import { MapTrifoldIcon } from "@phosphor-icons/react/dist/csr/MapTrifold";
import { useEffect, useRef, useState } from "react";
import { DiscordMark } from "./discord-mark";

type SiteHeaderProps = {
  discordUrl: string;
  downloadUrl: string;
  githubUrl: string;
  roadmapUrl: string;
};

export function SiteHeader({
  discordUrl,
  downloadUrl,
  githubUrl,
  roadmapUrl,
}: SiteHeaderProps) {
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
        <a className="brand-link" href="#top" aria-label="SakuraCord home">
          <img
            src="/brand/favicon.png"
            alt=""
            width={42}
            height={42}
            aria-hidden="true"
          />
          <span translate="no">SakuraCord</span>
        </a>

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
          aria-label="External links"
        >
          <a
            href={discordUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            <DiscordMark />
            <span>Discord</span>
          </a>
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            <GithubLogoIcon aria-hidden="true" weight="fill" />
            <span>GitHub</span>
          </a>
          <a
            href={roadmapUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            <MapTrifoldIcon aria-hidden="true" weight="regular" />
            <span>Roadmap</span>
          </a>
          <a
            className="header-download"
            href={downloadUrl}
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
