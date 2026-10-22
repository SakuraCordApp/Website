/* eslint-disable @next/next/no-img-element -- Local assets are pre-optimized; vinext has no runtime Next image optimizer. */
import { GithubLogoIcon } from "@phosphor-icons/react/dist/ssr/GithubLogo";
import Link from "next/link";
import { DiscordMark } from "./discord-mark";
import { SFSymbol } from "./symbol";
import { HomeEffects } from "./home-effects-client";
import { ReleaseLine } from "./release-line";

const DOWNLOAD_URL = "/download";
const GITHUB_URL = "https://github.com/SakuraCordApp/SakuraCord";
const DISCORD_URL = "https://discord.gg/hWNwFXkUTP";
const ROADMAP_URL = "/roadmap";

const discordComponentEmbed = {
  component: {
    type: 17,
    accent_color: 0xef9bc4,
    components: [
      {
        type: 10,
        content:
          "# SakuraCord\nYour Discord servers, chats, and calls in an app that feels at home on the Mac—with familiar keyboard shortcuts, native menus, and lower memory use. Currently in alpha for macOS 27 and later.",
      },
      {
        type: 12,
        items: [
          {
            media: {
              url: "https://sakuracord.app/discord-preview-macbook-20261008.png",
            },
            description:
              "SakuraCord running on a MacBook beneath the SakuraCord wordmark",
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: "Website",
            url: "https://sakuracord.app",
          },
          { type: 2, style: 5, label: "GitHub", url: GITHUB_URL },
          { type: 2, style: 5, label: "Discord", url: DISCORD_URL },
        ],
      },
    ],
  },
};

const externalLinkProps = {
  target: "_blank",
  rel: "noreferrer",
} as const;

export default function Home() {
  return (
    <>
      <script
        id="discord:component-embed"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(discordComponentEmbed).replace(
            /</g,
            "\\u003c",
          ),
        }}
      />
      <main id="top" className="home">
        <section id="main-content" tabIndex={-1} aria-labelledby="hero-title" className="hero">
          <div className="site-container">
            <div className="hero-icon">
              <img src="/site/icon-light.png" alt="The SakuraCord app icon" className="theme-img-light" width="112" height="112" />
              <img src="/site/icon-dark.png" alt="" className="theme-img-dark" width="112" height="112" aria-hidden="true" />
            </div>
            <h1 id="hero-title" className="sr-only" translate="no">SakuraCord</h1>
            <p className="type-display balance">Discord, at home on the Mac.</p>
            <p className="lede type-subhead text-muted balance">SakuraCord is a fast, native Discord client written in SwiftUI, with full voice and video, rich content, and far less overhead than the official app.</p>
            <div className="hero-actions">
              <div className="row">
                <a className="pill pill-solid" href={DOWNLOAD_URL} aria-label="Download SakuraCord for macOS"><span className="morph"><span className="rest">Download for Mac</span><span className="hover" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.53 3.83c.84-1.01 1.4-2.43 1.25-3.83-1.21.05-2.66.8-3.53 1.82-.78.9-1.46 2.34-1.27 3.71 1.34.1 2.71-.69 3.55-1.7M12.15 6.9c-.95 0-2.42-1.08-3.96-1.04-2.04.03-3.91 1.18-4.96 3.01-2.12 3.68-.55 9.1 1.52 12.09 1.01 1.45 2.21 3.09 3.79 3.04 1.52-.07 2.09-.99 3.94-.99 1.83 0 2.35.99 3.96.95 1.64-.03 2.68-1.48 3.68-2.95 1.15-1.69 1.63-3.32 1.66-3.41-.04-.02-3.18-1.22-3.22-4.86-.03-3.04 2.48-4.49 2.6-4.56-1.43-2.09-3.63-2.32-4.39-2.38-2-.15-3.68 1.09-4.62 1.09" /></svg></span></span></a>
                <a className="pill pill-neutral" href={GITHUB_URL} {...externalLinkProps}><span className="morph"><span className="rest">GitHub</span><span className="hover" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg></span></span></a>
              </div>
              <ReleaseLine />
            </div>
            <div className="hero-card reveal">
              <div className="mac">
                <div className="plate" aria-hidden="true"></div>
                <div className="screen">
                    <div className="mbar" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M15.53 3.83c.84-1.01 1.4-2.43 1.25-3.83-1.21.05-2.66.8-3.53 1.82-.78.9-1.46 2.34-1.27 3.71 1.34.1 2.71-.69 3.55-1.7M12.15 6.9c-.95 0-2.42-1.08-3.96-1.04-2.04.03-3.91 1.18-4.96 3.01-2.12 3.68-.55 9.1 1.52 12.09 1.01 1.45 2.21 3.09 3.79 3.04 1.52-.07 2.09-.99 3.94-.99 1.83 0 2.35.99 3.96.95 1.64-.03 2.68-1.48 3.68-2.95 1.15-1.69 1.63-3.32 1.66-3.41-.04-.02-3.18-1.22-3.22-4.86-.03-3.04 2.48-4.49 2.6-4.56-1.43-2.09-3.63-2.32-4.39-2.38-2-.15-3.68 1.09-4.62 1.09" /></svg><span className="right"><i className="mi mi-battery"></i><i className="mi mi-wifi"></i><i className="mi mi-search"></i><i className="mi mi-control"></i><span>Thu Oct 8&nbsp;&nbsp;9:41 AM</span></span></div>
                    <div className="dock" aria-hidden="true">
                      <img src="/site/dock/finder.png" alt="" /><img src="/site/dock/safari.png" alt="" /><img src="/site/dock/messages.png" alt="" /><img src="/site/dock/mail.png" alt="" /><img src="/site/dock/photos.png" alt="" /><img src="/site/dock/music.png" alt="" /><img src="/site/dock/calendar.png" alt="" /><img src="/site/dock/notes.png" alt="" /><span className="run"><img className="theme-img-light" src="/site/icon-light.png" alt="" /><img className="theme-img-dark" src="/site/icon-dark.png" alt="" /></span><img src="/site/dock/appstore.png" alt="" /><img src="/site/dock/settings.png" alt="" /><i className="sep"></i><img src="/site/dock/trash.png" alt="" />
                    </div>
                  <img src="/site/shots/welcome-light.webp" alt="SakuraCord’s welcome screen: the SakuraCord wordmark, “Welcome to SakuraCord” and a Continue button" className="theme-img-light" width="2498" height="1712" fetchPriority="high" />
                  <img src="/site/shots/welcome-dark.webp" alt="" className="theme-img-dark" width="2498" height="1712" aria-hidden="true" fetchPriority="high" />
                </div>
                <img className="shell" src="/site/macbook-air-shell.webp" alt="" width="1920" height="1280" aria-hidden="true" />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="features" aria-labelledby="features-title">
          <h2 id="features-title" className="sr-only">What SakuraCord does</h2>
          <div className="site-container grid">
            <div className="stage">
              <div className="mac-crop">
                <div className="mac">
                  <div className="plate" aria-hidden="true"></div>
                  <div className="screen" id="feature-screens">
                    <div className="mbar" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M15.53 3.83c.84-1.01 1.4-2.43 1.25-3.83-1.21.05-2.66.8-3.53 1.82-.78.9-1.46 2.34-1.27 3.71 1.34.1 2.71-.69 3.55-1.7M12.15 6.9c-.95 0-2.42-1.08-3.96-1.04-2.04.03-3.91 1.18-4.96 3.01-2.12 3.68-.55 9.1 1.52 12.09 1.01 1.45 2.21 3.09 3.79 3.04 1.52-.07 2.09-.99 3.94-.99 1.83 0 2.35.99 3.96.95 1.64-.03 2.68-1.48 3.68-2.95 1.15-1.69 1.63-3.32 1.66-3.41-.04-.02-3.18-1.22-3.22-4.86-.03-3.04 2.48-4.49 2.6-4.56-1.43-2.09-3.63-2.32-4.39-2.38-2-.15-3.68 1.09-4.62 1.09" /></svg><span className="right"><i className="mi mi-battery"></i><i className="mi mi-wifi"></i><i className="mi mi-search"></i><i className="mi mi-control"></i><span>Thu Oct 8&nbsp;&nbsp;9:41 AM</span></span></div>
                    <div className="dock" aria-hidden="true">
                      <img src="/site/dock/finder.png" alt="" /><img src="/site/dock/safari.png" alt="" /><img src="/site/dock/messages.png" alt="" /><img src="/site/dock/mail.png" alt="" /><img src="/site/dock/photos.png" alt="" /><img src="/site/dock/music.png" alt="" /><img src="/site/dock/calendar.png" alt="" /><img src="/site/dock/notes.png" alt="" /><span className="run"><img className="theme-img-light" src="/site/icon-light.png" alt="" /><img className="theme-img-dark" src="/site/icon-dark.png" alt="" /></span><img src="/site/dock/appstore.png" alt="" /><img src="/site/dock/settings.png" alt="" /><i className="sep"></i><img src="/site/dock/trash.png" alt="" />
                    </div>
                    <div data-screen="0">
                      <img src="/site/shots/hero-light.webp" alt="SakuraCord’s main window with server sidebar, channel list and chat" className="theme-img-light" width="1920" height="1118" loading="lazy" />
                      <img src="/site/shots/hero-dark.webp" alt="" className="theme-img-dark" width="1920" height="1143" aria-hidden="true" loading="lazy" />
                    </div>
                    <div data-screen="1" style={{opacity: "0"}}>
                      <img src="/site/shots/rich-light.webp" alt="Rich Discord content in SakuraCord: app messages with selection fields, role pickers and channel pickers rendered as native controls" width="1670" height="994" loading="lazy" className="theme-img-light" /><img src="/site/shots/rich.webp" alt="" aria-hidden="true" width="1670" height="994" loading="lazy" className="theme-img-dark" />
                    </div>
                    <div data-screen="2" style={{opacity: "0"}}>
                      <img src="/site/shots/call-light.webp" alt="An incoming direct call in SakuraCord, with accept and decline buttons" width="1670" height="994" loading="lazy" className="theme-img-light" /><img src="/site/shots/call.webp" alt="" aria-hidden="true" width="1670" height="994" loading="lazy" className="theme-img-dark" />
                    </div>
                    <div data-screen="3" style={{opacity: "0"}}>
                      <img src="/site/shots/forum-light.webp" alt="A forum channel in SakuraCord: posts with tags, reactions and reply counts" width="1670" height="994" loading="lazy" className="theme-img-light" /><img src="/site/shots/forum.webp" alt="" aria-hidden="true" width="1670" height="994" loading="lazy" className="theme-img-dark" />
                    </div>
                    <div data-screen="4" style={{opacity: "0"}}>
                      <img src="/site/shots/theme-light.webp" alt="SakuraCord’s Theme settings: the theme designer’s colour wheel with brightness and opacity dials" width="1448" height="1039" loading="lazy" className="theme-img-light" /><img src="/site/shots/theme.webp" alt="" aria-hidden="true" width="1448" height="1039" loading="lazy" className="theme-img-dark" />
                    </div>
                  </div>
                  <img className="shell" src="/site/macbook-air-shell.webp" alt="" width="1920" height="1280" aria-hidden="true" />
                </div>
              </div>
            </div>
            <ol id="feature-list">
              <li data-feature="0" className="active">
                <h3 className="type-display balance">Native by design.</h3>
                <p className="type-subhead text-muted balance">SwiftUI surfaces, real Mac windows, menus, shortcuts and settings, presented in Liquid Glass. No Electron, no Chromium bundle.</p>
              </li>
              <li data-feature="1">
                <h3 className="type-display balance">Rich Discord content.</h3>
                <p className="type-subhead text-muted balance">Embeds, Components V2, modals, stickers, GIFs, uploads, custom emoji and slash commands, rendered as native controls.</p>
              </li>
              <li data-feature="2">
                <h3 className="type-display balance">Voice and video.</h3>
                <p className="type-subhead text-muted balance">Guild voice and direct calls with native device controls, Opus audio, H.264 video and DAVE support.</p>
              </li>
              <li data-feature="3">
                <h3 className="type-display balance">Forums, first class.</h3>
                <p className="type-subhead text-muted balance">Browse posts by tag, sort and filter them, and jump into threads without leaving the window.</p>
              </li>
              <li data-feature="4">
                <h3 className="type-display balance">Make it yours.</h3>
                <p className="type-subhead text-muted balance">A theme designer with colour wheels, glass and window opacity. Copy your theme and share it with the server.</p>
              </li>
            </ol>
          </div>
        </section>

        <section id="facts" className="facts" aria-labelledby="facts-title">
          <div className="site-container">
            <h2 id="facts-title" className="facts-head balance">
              <span className="facts-ink">Free. Open source. Native.</span>
              <span className="facts-dim">Everything <strong>Discord</strong> does, built for the <strong>Mac</strong>.</span>
            </h2>
          </div>
          <div className="facts-row" id="facts-row" role="region" aria-label="SakuraCord facts" tabIndex={0}>
              <article className="fact-card" data-open="false">
                <div className="fact-face fact-front">
                  <span className="fact-icon fact-icon-gift" aria-hidden="true"></span>
                  <p className="fact-text"><strong>Free, forever.</strong> No subscription, no ads.</p>
                </div>
                <div className="fact-face fact-back" id="fact-more-1">
                  <p className="fact-more">Download the DMG and use every feature.</p>
                </div>
                <button className="fact-toggle" type="button" aria-expanded="false" aria-controls="fact-more-1" aria-label="More about free forever"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M10 4.5v11M4.5 10h11" /></svg></button>
              </article>
              <article className="fact-card" data-open="false">
                <div className="fact-face fact-front">
                  <span className="fact-icon fact-icon-code" aria-hidden="true"></span>
                  <p className="fact-text"><strong>Open source.</strong> Every line on GitHub, GPL-3.0.</p>
                </div>
                <div className="fact-face fact-back" id="fact-more-2">
                  <p className="fact-more">Read it, fork it, and build it yourself.</p>
                </div>
                <button className="fact-toggle" type="button" aria-expanded="false" aria-controls="fact-more-2" aria-label="More about open source"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M10 4.5v11M4.5 10h11" /></svg></button>
              </article>
              <article className="fact-card" data-open="false">
                <div className="fact-face fact-front">
                  <span className="fact-icon fact-icon-macbook" aria-hidden="true"></span>
                  <p className="fact-text"><strong>Native on macOS 27.</strong> SwiftUI and Liquid Glass, no web view.</p>
                </div>
                <div className="fact-face fact-back" id="fact-more-3">
                  <p className="fact-more">Real Mac windows, menus, and shortcuts.</p>
                </div>
                <button className="fact-toggle" type="button" aria-expanded="false" aria-controls="fact-more-3" aria-label="More about native macOS"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M10 4.5v11M4.5 10h11" /></svg></button>
              </article>
              <article className="fact-card" data-open="false">
                <div className="fact-face fact-front">
                  <span className="fact-icon fact-icon-phone" aria-hidden="true"></span>
                  <p className="fact-text"><strong>Voice and video.</strong> Calls with DAVE encryption.</p>
                </div>
                <div className="fact-face fact-back" id="fact-more-4">
                  <p className="fact-more">Guild voice and direct calls with native controls.</p>
                </div>
                <button className="fact-toggle" type="button" aria-expanded="false" aria-controls="fact-more-4" aria-label="More about voice and video"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M10 4.5v11M4.5 10h11" /></svg></button>
              </article>
              <article className="fact-card" data-open="false">
                <div className="fact-face fact-front">
                  <span className="fact-icon fact-icon-bubbles" aria-hidden="true"></span>
                  <p className="fact-text"><strong>Rich messages.</strong> Embeds, components, stickers and GIFs.</p>
                </div>
                <div className="fact-face fact-back" id="fact-more-5">
                  <p className="fact-more">Components V2, custom emoji, and slash commands.</p>
                </div>
                <button className="fact-toggle" type="button" aria-expanded="false" aria-controls="fact-more-5" aria-label="More about rich messages"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M10 4.5v11M4.5 10h11" /></svg></button>
              </article>
              <article className="fact-card" data-open="false">
                <div className="fact-face fact-front">
                  <span className="fact-icon fact-icon-palette" aria-hidden="true"></span>
                  <p className="fact-text"><strong>Make it yours.</strong> A theme designer with colour and glass.</p>
                </div>
                <div className="fact-face fact-back" id="fact-more-6">
                  <p className="fact-more">Tune colour, glass, and opacity, then share it.</p>
                </div>
                <button className="fact-toggle" type="button" aria-expanded="false" aria-controls="fact-more-6" aria-label="More about the theme designer"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M10 4.5v11M4.5 10h11" /></svg></button>
              </article>
          </div>
          <div className="site-container">
            <div className="facts-nav">
              <button className="facts-arrow" id="facts-prev" type="button" aria-label="Scroll facts back"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12.5 4 7 10l5.5 6" /></svg></button>
              <button className="facts-arrow" id="facts-next" type="button" aria-label="Scroll facts forward"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7.5 4 13 10l-5.5 6" /></svg></button>
            </div>
          </div>
        </section>

        <section className="word-scroll" id="native" aria-labelledby="native-title">
          <div className="stage">
            <div className="copy" id="ws-copy">
              <div>
                <h2 id="native-title" className="text">
                  <span className="sr-only">Everything you love about Discord, native on your Mac.</span>
                  <span className="line" aria-hidden="true">
                    <span className="w"><span className="dim">Everything</span><span className="lit" data-word="Everything" aria-hidden="true"></span></span>{" "}
                    <span className="w"><span className="dim">you</span><span className="lit" data-word="you" aria-hidden="true"></span></span>{" "}
                    <span className="w"><span className="dim">love</span><span className="lit" data-word="love" aria-hidden="true"></span></span>{" "}
                    <span className="w"><span className="dim">about</span><span className="lit" data-word="about" aria-hidden="true"></span></span>{" "}
                    <span className="w"><span className="dim">Discord,</span><span className="lit" data-word="Discord," aria-hidden="true"></span></span>
                  </span>
                  <span className="line" aria-hidden="true">
                    <span className="w"><span className="dim">native</span><span className="lit" data-word="native" aria-hidden="true"></span><span className="glo" data-word="native" aria-hidden="true"></span></span>{" "}
                    <span className="w"><span className="dim">on</span><span className="lit" data-word="on" aria-hidden="true"></span></span>{" "}
                    <span className="w"><span className="dim">your</span><span className="lit" data-word="your" aria-hidden="true"></span></span>{" "}
                    <span className="w"><span className="dim">Mac.</span><span className="lit" data-word="Mac." aria-hidden="true"></span></span>
                  </span>
                </h2>
                <p className="sub type-subhead">SwiftUI and Liquid Glass instead of a web app in a wrapper, so it runs far lighter on memory than the official client.</p>
              </div>
            </div>
            <div className="demo" id="ws-demo">
              <canvas className="petals" aria-hidden="true"></canvas>
              <img className="petals-still" src="/site/icon-light.png" alt="The SakuraCord app icon" width="512" height="512" />
            </div>
          </div>
        </section>

        <section id="showcase" className="showcase" aria-labelledby="showcase-title">
          <div className="site-container">
            <h2 id="showcase-title" className="type-title balance reveal">Take a quick look.</h2>
            <div className="show-card reveal">
              <div className="show-viewport" id="show-viewport" role="region" aria-roledescription="carousel" aria-label="SakuraCord tour" tabIndex={0}>
                <article className="show-slide" role="group" aria-roledescription="slide" aria-label="1 of 5">
                  <img src="/site/shots/hero-dark.webp" alt="The whole server in one native window: sidebar, channel list, members, and chat" width="1920" height="1143" loading="lazy" />
                  <p className="show-cap"><strong>The whole server, at a glance.</strong><span>Channels, members and chat in one native window.</span></p>
                </article>
                <article className="show-slide" role="group" aria-roledescription="slide" aria-label="2 of 5">
                  <img src="/site/shots/rich-light.webp" alt="Rich Discord content in SakuraCord: app messages with selection fields, role pickers and channel pickers rendered as native controls" width="1670" height="994" loading="lazy" className="theme-img-light" /><img src="/site/shots/rich.webp" alt="" aria-hidden="true" width="1670" height="994" loading="lazy" className="theme-img-dark" />
                  <p className="show-cap"><strong>Rich messages, rendered natively.</strong><span>Embeds and app messages as real Mac controls.</span></p>
                </article>
                <article className="show-slide" role="group" aria-roledescription="slide" aria-label="3 of 5">
                  <img src="/site/shots/call-light.webp" alt="An incoming direct call in SakuraCord, with accept and decline buttons" width="1670" height="994" loading="lazy" className="theme-img-light" /><img src="/site/shots/call.webp" alt="" aria-hidden="true" width="1670" height="994" loading="lazy" className="theme-img-dark" />
                  <p className="show-cap"><strong>Calls when they matter.</strong><span>Voice and video with accept and decline.</span></p>
                </article>
                <article className="show-slide" role="group" aria-roledescription="slide" aria-label="4 of 5">
                  <img src="/site/shots/forum-light.webp" alt="A forum channel in SakuraCord: posts with tags, reactions and reply counts" width="1670" height="994" loading="lazy" className="theme-img-light" /><img src="/site/shots/forum.webp" alt="" aria-hidden="true" width="1670" height="994" loading="lazy" className="theme-img-dark" />
                  <p className="show-cap"><strong>Forums without leaving the app.</strong><span>Posts with tags, reactions and reply counts.</span></p>
                </article>
                <article className="show-slide" role="group" aria-roledescription="slide" aria-label="5 of 5">
                  <img src="/site/shots/theme-light.webp" alt="SakuraCord theme designer with a colour wheel, brightness and opacity dials" width="1448" height="1039" loading="lazy" className="theme-img-light" /><img src="/site/shots/theme.webp" alt="" aria-hidden="true" width="1448" height="1039" loading="lazy" className="theme-img-dark" />
                  <p className="show-cap"><strong>Make it yours.</strong><span>Theme designer with colour, glass and opacity.</span></p>
                </article>
              </div>
              <div className="show-controls">
                <div className="show-dots" id="show-dots" role="tablist" aria-label="Tour slides">
                  <button type="button" role="tab" aria-selected="true" aria-label="Go to slide 1" data-slide="0"><span className="dot"><span className="dot-fill"></span></span></button>
                  <button type="button" role="tab" aria-selected="false" aria-label="Go to slide 2" data-slide="1" tabIndex={-1}><span className="dot"><span className="dot-fill"></span></span></button>
                  <button type="button" role="tab" aria-selected="false" aria-label="Go to slide 3" data-slide="2" tabIndex={-1}><span className="dot"><span className="dot-fill"></span></span></button>
                  <button type="button" role="tab" aria-selected="false" aria-label="Go to slide 4" data-slide="3" tabIndex={-1}><span className="dot"><span className="dot-fill"></span></span></button>
                  <button type="button" role="tab" aria-selected="false" aria-label="Go to slide 5" data-slide="4" tabIndex={-1}><span className="dot"><span className="dot-fill"></span></span></button>
                </div>
                <button className="show-pause" id="show-pause" type="button" aria-label="Pause auto-advance" aria-pressed="false"><svg className="icon-pause" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="3.5" height="12" rx="1" /><rect x="11.5" y="4" width="3.5" height="12" rx="1" /></svg><svg className="icon-play" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6 4.5v11l9-5.5-9-5.5Z" /></svg></button>
              </div>
            </div>
          </div>
        </section>

        <section id="download" className="install" aria-labelledby="install-title">
          <div className="site-container" style={{textAlign: "center"}}>
            <div className="reveal">
              <h2 id="install-title" className="type-title balance">Set up in a minute.</h2>
              <p className="type-subhead text-muted balance" style={{maxWidth: "44ch", margin: "1rem auto 0"}}>Download the latest DMG, open it, and move SakuraCord into Applications. Or install it with Homebrew.</p>
            </div>
            <div className="steps">
              <div className="step reveal">
                <h3><span className="step-num" aria-hidden="true">1</span> Install with Homebrew</h3>
                <div className="brew">
                  <code id="brew-command">brew install --cask SakuraCordApp/tap/sakuracord</code>
                  <button className="copy-button" type="button" id="copy-brew" aria-label="Copy the Homebrew command">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="2" /><path d="M10.5 3.5v-1a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1" transform="translate(1 1)" /></svg>
                    <span id="copy-label">Copy</span>
                  </button>
                </div>
              </div>
              <div className="step reveal">
                <h3><span className="step-num" aria-hidden="true">2</span> Approve the first launch</h3>
                <p className="type-body text-muted">Current releases are ad-hoc signed rather than notarized, so macOS may ask you to approve SakuraCord once in System Settings → Privacy &amp; Security.</p>
              </div>
              <div className="step reveal">
                <h3><span className="step-num" aria-hidden="true">3</span> Sign in and chat</h3>
                <p className="type-body text-muted">That’s it. Your servers, channels, calls and forums are where Discord put them, inside a real Mac app.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="faq" aria-labelledby="faq-title">
          <div className="site-container">
            <div style={{textAlign: "center"}} className="reveal">
              <h2 id="faq-title" className="type-title balance">Before you install.</h2>
              <a href={DISCORD_URL} {...externalLinkProps} className="site-link type-body" style={{marginTop: "1.25rem"}}>Ask the community on Discord <span aria-hidden="true">›</span></a>
            </div>
            <div className="faq-list">
              <div className="faq-row" data-open="false" data-side="right">
                <h3 className="faq-q-wrap">
                  <button type="button" className="faq-q" id="faq-t-1" aria-expanded="false" aria-controls="faq-a-1">
                    <span>Is SakuraCord affiliated with Discord?</span>
                    <span className="faq-plus" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 10h14M10 3v14" /></svg></span>
                  </button>
                </h3>
                <div className="faq-a-wrap" id="faq-a-1" role="region" aria-labelledby="faq-t-1">
                  <div className="faq-a-clip">
                    <div className="faq-a"><p>No. SakuraCord is an independent project and isn’t affiliated with Discord. Discord doesn’t provide a supported platform for third-party clients, so compatibility can change as Discord evolves.</p></div>
                  </div>
                </div>
              </div>
              <div className="faq-row" data-open="false" data-side="left">
                <h3 className="faq-q-wrap">
                  <button type="button" className="faq-q" id="faq-t-2" aria-expanded="false" aria-controls="faq-a-2">
                    <span>What does it need to run?</span>
                    <span className="faq-plus" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 10h14M10 3v14" /></svg></span>
                  </button>
                </h3>
                <div className="faq-a-wrap" id="faq-a-2" role="region" aria-labelledby="faq-t-2">
                  <div className="faq-a-clip">
                    <div className="faq-a"><p>macOS 27 or later. Download the latest DMG, open it, and move SakuraCord into Applications.</p></div>
                  </div>
                </div>
              </div>
              <div className="faq-row" data-open="false" data-side="right">
                <h3 className="faq-q-wrap">
                  <button type="button" className="faq-q" id="faq-t-3" aria-expanded="false" aria-controls="faq-a-3">
                    <span>Is it free and open source?</span>
                    <span className="faq-plus" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 10h14M10 3v14" /></svg></span>
                  </button>
                </h3>
                <div className="faq-a-wrap" id="faq-a-3" role="region" aria-labelledby="faq-t-3">
                  <div className="faq-a-clip">
                    <div className="faq-a"><p>Yes. SakuraCord is free, and every line is published on GitHub under the GPL-3.0 license.</p></div>
                  </div>
                </div>
              </div>
              <div className="faq-row" data-open="false" data-side="left">
                <h3 className="faq-q-wrap">
                  <button type="button" className="faq-q" id="faq-t-4" aria-expanded="false" aria-controls="faq-a-4">
                    <span>Why does macOS warn me on first launch?</span>
                    <span className="faq-plus" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 10h14M10 3v14" /></svg></span>
                  </button>
                </h3>
                <div className="faq-a-wrap" id="faq-a-4" role="region" aria-labelledby="faq-t-4">
                  <div className="faq-a-clip">
                    <div className="faq-a"><p>Releases are ad-hoc signed rather than notarized, so Gatekeeper may need a one-time approval in System Settings → Privacy &amp; Security.</p></div>
                  </div>
                </div>
              </div>
              <div className="faq-row" data-open="false" data-side="right">
                <h3 className="faq-q-wrap">
                  <button type="button" className="faq-q" id="faq-t-5" aria-expanded="false" aria-controls="faq-a-5">
                    <span>Can I build it from source?</span>
                    <span className="faq-plus" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 10h14M10 3v14" /></svg></span>
                  </button>
                </h3>
                <div className="faq-a-wrap" id="faq-a-5" role="region" aria-labelledby="faq-t-5">
                  <div className="faq-a-clip">
                    <div className="faq-a"><p>Yes. You need macOS 27, Xcode 27 with Swift 6.4 and its Metal Toolchain, and Git. Clone the repository and run <code>./script/build_and_run.sh --offline</code>. The offline demo never contacts Discord.</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="community" aria-labelledby="community-title">
          <div className="site-container">
            <h2 id="community-title" className="type-title balance reveal">Join the community.</h2>
            <div className="community-list">
              <a className="panel panel-link reveal" href={DISCORD_URL} {...externalLinkProps}>
                <DiscordMark className="discord-mark" />
                <h3>Discord server</h3>
                <p>Talk with the community, get help and share feedback.</p>
                <span className="panel-more">Join <span aria-hidden="true">›</span></span>
              </a>
              <a className="panel panel-link reveal" href={GITHUB_URL} {...externalLinkProps}>
                <GithubLogoIcon className="panel-icon" aria-hidden="true" weight="fill" />
                <h3>GitHub</h3>
                <p>Read the code, follow releases and contribute.</p>
                <span className="panel-more">View the source <span aria-hidden="true">›</span></span>
              </a>
              <Link className="panel panel-link reveal" href={ROADMAP_URL}>
                <SFSymbol name="map.fill" className="panel-icon" />
                <h3>Roadmap</h3>
                <p>See what’s planned next and what just shipped.</p>
                <span className="panel-more">See the roadmap <span aria-hidden="true">›</span></span>
              </Link>
            </div>
          </div>
        </section>

        <section className="cta" aria-labelledby="cta-title">
          <div className="site-container reveal">
            <div className="hero-icon">
              <img src="/site/icon-light.png" alt="" className="theme-img-light" width="112" height="112" aria-hidden="true" />
              <img src="/site/icon-dark.png" alt="" className="theme-img-dark" width="112" height="112" aria-hidden="true" />
            </div>
            <h2 id="cta-title" className="type-display balance">Free and open source.</h2>
            <p className="type-subhead text-muted balance">Read every line on GitHub, or download it and try it tonight.</p>
            <div className="hero-actions">
              <div className="row">
                <a className="pill pill-solid" href={DOWNLOAD_URL} aria-label="Download SakuraCord for macOS"><span className="morph"><span className="rest">Download for Mac</span><span className="hover" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.53 3.83c.84-1.01 1.4-2.43 1.25-3.83-1.21.05-2.66.8-3.53 1.82-.78.9-1.46 2.34-1.27 3.71 1.34.1 2.71-.69 3.55-1.7M12.15 6.9c-.95 0-2.42-1.08-3.96-1.04-2.04.03-3.91 1.18-4.96 3.01-2.12 3.68-.55 9.1 1.52 12.09 1.01 1.45 2.21 3.09 3.79 3.04 1.52-.07 2.09-.99 3.94-.99 1.83 0 2.35.99 3.96.95 1.64-.03 2.68-1.48 3.68-2.95 1.15-1.69 1.63-3.32 1.66-3.41-.04-.02-3.18-1.22-3.22-4.86-.03-3.04 2.48-4.49 2.6-4.56-1.43-2.09-3.63-2.32-4.39-2.38-2-.15-3.68 1.09-4.62 1.09" /></svg></span></span></a>
                <a className="pill pill-neutral" href={GITHUB_URL} {...externalLinkProps}><span className="morph"><span className="rest">GitHub</span><span className="hover" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg></span></span></a>
              </div>
              <ReleaseLine />
            </div>
          </div>
        </section>
      </main>
      <HomeEffects />
    </>
  );
}
