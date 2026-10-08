import Link from "next/link";

const DISCORD_URL = "https://discord.gg/hWNwFXkUTP";
const GITHUB_URL = "https://github.com/SakuraCordApp/SakuraCord";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="cols">
          <div>
            <h2>
              <Link className="brand-link" href="/">
                SakuraCord
              </Link>
            </h2>
            <ul>
              <li><Link href="/#features">Features</Link></li>
              <li><a href="/download">Download</a></li>
              <li><Link href="/#faq">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h2>Community</h2>
            <ul>
              <li><a href={DISCORD_URL} target="_blank" rel="noreferrer">Discord</a></li>
              <li><Link href="/roadmap">Roadmap</Link></li>
              <li><Link href="/tracker" prefetch={false}>Tracker</Link></li>
              <li><Link href="/report" prefetch={false}>Report a bug</Link></li>
            </ul>
          </div>
          <div>
            <h2>Project</h2>
            <ul>
              <li><a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a></li>
              <li><Link href="/releases">Releases</Link></li>
            </ul>
          </div>
        </div>
        <p className="note">
          SakuraCord is free and open source under GPL-3.0. It is an independent project and is not affiliated with Discord.
        </p>
      </div>
    </footer>
  );
}
