/* eslint-disable @next/next/no-img-element -- Local assets are pre-optimized; vinext has no runtime Next image optimizer. */
import { AppWindowIcon } from "@phosphor-icons/react/dist/ssr/AppWindow";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { DiscordLogoIcon } from "@phosphor-icons/react/dist/ssr/DiscordLogo";
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
                <a className="button button-primary" href={DOWNLOAD_URL}>
                  <DownloadSimpleIcon aria-hidden="true" weight="bold" />
                  Download Alpha
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
              <p className="compatibility">
                <span className="compatibility-icon" aria-hidden="true">
                  <span className="apple-glyph"></span>
                </span>
                Requires macOS 27 or newer
              </p>
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
                <DiscordLogoIcon aria-hidden="true" weight="fill" />
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

              <a className="button button-primary button-large" href={DOWNLOAD_URL}>
                <DownloadSimpleIcon aria-hidden="true" weight="bold" />
                Download Alpha
              </a>
              <p className="compatibility">
                <span className="compatibility-icon" aria-hidden="true">
                  <span className="apple-glyph"></span>
                </span>
                Requires macOS 27 or newer
              </p>
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
