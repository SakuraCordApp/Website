/* eslint-disable @next/next/no-img-element -- Local assets are pre-optimized; vinext has no runtime Next image optimizer. */
import { AppWindowIcon } from "@phosphor-icons/react/dist/ssr/AppWindow";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr/DownloadSimple";
import { GithubLogoIcon } from "@phosphor-icons/react/dist/ssr/GithubLogo";
import { MapTrifoldIcon } from "@phosphor-icons/react/dist/ssr/MapTrifold";
import { MemoryIcon } from "@phosphor-icons/react/dist/ssr/Memory";
import { VideoCameraIcon } from "@phosphor-icons/react/dist/ssr/VideoCamera";
import { Reveal } from "./reveal";

const DOWNLOAD_URL =
  "https://github.com/SakuraCordApp/SakuraCord/releases/latest/download/SakuraCord.dmg";
const GITHUB_URL = "https://github.com/SakuraCordApp/SakuraCord";
const DISCORD_URL = "https://discord.gg/hWNwFXkUTP";
const ROADMAP_URL = "https://roadmap.sakuracord.app";

const externalLinkProps = {
  target: "_blank",
  rel: "noreferrer",
} as const;

function DiscordMark() {
  return (
    <svg
      className="discord-mark"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.618-1.25.077.077 0 0 0-.078-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.028C.533 9.046-.319 13.58.1 18.058a.082.082 0 0 0 .031.056c2.053 1.508 4.041 2.423 5.993 3.03a.078.078 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.042-.106 12.3 12.3 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.011c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.099.246.198.373.292a.077.077 0 0 1-.007.128 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.029c1.961-.607 3.95-1.522 6.002-3.03a.077.077 0 0 0 .031-.055c.5-5.177-.838-9.674-3.548-13.66a.061.061 0 0 0-.031-.029ZM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.419 0 1.333-.956 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.419 0 1.333-.946 2.419-2.157 2.419Z" />
    </svg>
  );
}

const benefits = [
  {
    icon: AppWindowIcon,
    title: "A native Mac app",
    copy: "Written in SwiftUI, with standard Mac windows, menus, keyboard shortcuts, and system materials.",
  },
  {
    icon: VideoCameraIcon,
    title: "Voice and video",
    copy: "Join voice channels, start calls, choose audio devices, and use your camera inside SakuraCord.",
  },
  {
    icon: MemoryIcon,
    title: "Lower memory use",
    copy: "There is no Chromium bundle behind the interface, so the app needs far less memory than the official client.",
  },
];

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

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

          <div className="header-actions">
            <nav className="nav-links" aria-label="External links">
              <a href={DISCORD_URL} {...externalLinkProps}>
                Discord
              </a>
              <a href={GITHUB_URL} {...externalLinkProps}>
                GitHub
              </a>
              <a href={ROADMAP_URL} {...externalLinkProps}>
                Roadmap
              </a>
            </nav>

            <a
              className="header-download"
              href={DOWNLOAD_URL}
              aria-label="Download SakuraCord alpha for macOS"
            >
              <DownloadSimpleIcon aria-hidden="true" weight="bold" />
              <span>Download</span>
            </a>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="hero section-shell" id="top" aria-labelledby="hero-title">
          <div className="hero-copy">
            <Reveal>
              <h1 id="hero-title" translate="no">
                SakuraCord
              </h1>
            </Reveal>

            <Reveal delay={0.08}>
              <p className="hero-summary">
                Discord, at home on the Mac. Native SwiftUI, full voice &amp;
                video, and far less overhead.
              </p>
            </Reveal>

            <Reveal delay={0.14}>
              <div className="hero-actions" aria-label="SakuraCord downloads and source">
                <a
                  className="button button-primary download-button"
                  href={DOWNLOAD_URL}
                >
                  <span className="download-button-copy">
                    <span className="download-button-title">
                      <DownloadSimpleIcon aria-hidden="true" weight="bold" />
                      <span>Download Alpha</span>
                    </span>
                    <span className="download-button-platform">
                      <span className="apple-glyph" aria-hidden="true">
                        
                      </span>
                      MacOS 27+
                    </span>
                  </span>
                </a>
                <a
                  className="button button-secondary"
                  href={GITHUB_URL}
                  {...externalLinkProps}
                >
                  <GithubLogoIcon aria-hidden="true" weight="fill" />
                  View on GitHub
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal className="hero-visual" delay={0.12}>
            <div className="product-stage">
              <img
                className="product-image"
                src="/media/sakuracord-app.webp"
                alt="SakuraCord open to the community general channel on macOS"
                width={2880}
                height={1584}
                loading="eager"
                fetchPriority="high"
              />
            </div>
          </Reveal>
        </section>

        <section
          className="benefits-section"
          id="benefits"
          aria-labelledby="benefits-title"
        >
          <div className="section-shell benefits-inner">
            <Reveal className="benefits-intro">
              <h2 id="benefits-title">Discord, built as a Mac app.</h2>
            </Reveal>

            <div className="benefit-list">
              {benefits.map((benefit, index) => (
                <Reveal
                  className="benefit-item"
                  delay={index * 0.04}
                  key={benefit.title}
                >
                  <benefit.icon aria-hidden="true" weight="regular" />
                  <h3>{benefit.title}</h3>
                  <p>{benefit.copy}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section
          className="community-section"
          aria-labelledby="community-title"
        >
          <div className="section-shell community-inner">
            <Reveal>
              <h2 id="community-title">Join the community.</h2>
            </Reveal>

            <Reveal className="community-rail" delay={0.06}>
              <a href={DISCORD_URL} {...externalLinkProps}>
                <DiscordMark />
                <span>Discord server</span>
                <ArrowUpRightIcon
                  className="community-arrow"
                  aria-hidden="true"
                  weight="bold"
                />
              </a>
              <a href={GITHUB_URL} {...externalLinkProps}>
                <GithubLogoIcon aria-hidden="true" weight="fill" />
                <span>GitHub</span>
                <ArrowUpRightIcon
                  className="community-arrow"
                  aria-hidden="true"
                  weight="bold"
                />
              </a>
              <a href={ROADMAP_URL} {...externalLinkProps}>
                <MapTrifoldIcon aria-hidden="true" weight="regular" />
                <span>Roadmap</span>
                <ArrowUpRightIcon
                  className="community-arrow"
                  aria-hidden="true"
                  weight="bold"
                />
              </a>
            </Reveal>
          </div>
        </section>

        <section
          className="download-section"
          id="download"
          aria-labelledby="download-title"
        >
          <div className="section-shell download-inner">
            <Reveal className="download-mark">
              <img
                src="/brand/favicon.png"
                alt=""
                width={72}
                height={72}
                aria-hidden="true"
              />
            </Reveal>

            <Reveal className="download-copy" delay={0.06}>
              <h2 id="download-title">Download SakuraCord.</h2>

              <a
                className="button button-primary button-large download-button"
                href={DOWNLOAD_URL}
              >
                <span className="download-button-copy">
                  <span className="download-button-title">
                    <DownloadSimpleIcon aria-hidden="true" weight="bold" />
                    <span>Download Alpha</span>
                  </span>
                  <span className="download-button-platform">
                    <span className="apple-glyph" aria-hidden="true">
                      
                    </span>
                    MacOS 27+
                  </span>
                </span>
              </a>
            </Reveal>
          </div>

          <footer className="section-shell site-footer">
            <a className="brand-link" href="#top" aria-label="Back to SakuraCord home">
              <img
                src="/brand/favicon.png"
                alt=""
                width={38}
                height={38}
                aria-hidden="true"
              />
              <span translate="no">SakuraCord</span>
            </a>
            <p>
              SakuraCord is an independent project and is not affiliated with
              Discord.
            </p>
          </footer>
        </section>
      </main>
    </>
  );
}
