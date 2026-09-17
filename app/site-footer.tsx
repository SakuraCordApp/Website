import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="section-shell site-footer">
      <Link className="brand-link" href="/" aria-label="SakuraCord home">
        <span translate="no">SakuraCord</span>
      </Link>
      <p>
        SakuraCord is an independent project and is not affiliated with Discord.
      </p>
    </footer>
  );
}
