import type { Metadata } from "next";
import Link from "next/link";
import { CommunityUnavailable } from "../community-unavailable";
import { communityMetadata } from "../lib/community-metadata";
import { formatReleaseDate, getReleases } from "../lib/releases";

export const metadata: Metadata = communityMetadata(
  "Releases · SakuraCord",
  "Every version of SakuraCord and what changed in it.",
  "/releases",
);

export default async function ReleasesPage() {
  const releases = await getReleases().catch(() => null);
  if (!releases) return <CommunityUnavailable title="Releases" />;
  return (
    <main id="main-content" className="community-page section-shell">
      <header className="community-heading">
        <div>
          <h1>Releases</h1>
          <p>Every version of SakuraCord and what changed in it.</p>
        </div>
        <Link className="community-text-link" href="/roadmap">
          See what’s next <span aria-hidden="true">›</span>
        </Link>
      </header>
      {releases.length ? (
        <ol className="release-list">
          {releases.map((release) => (
            <li className="release-row" key={release.tag}>
              <div className="release-row-meta">
                <p className="release-row-version">{`v${release.version.replace(/ Beta.*/, "")}`}</p>
                <time dateTime={release.date}>{formatReleaseDate(release.date)}</time>
                {release.prerelease ? <span className="release-badge">Nightly</span> : null}
              </div>
              <article className="release-row-body">
                <h2>
                  <Link href={`/releases/${encodeURIComponent(release.tag)}`}>
                    {`SakuraCord ${release.version}`}
                  </Link>
                </h2>
                {release.summary ? <p>{release.summary}</p> : null}
                <div className="release-row-links">
                  <Link
                    className="community-text-link"
                    href={`/releases/${encodeURIComponent(release.tag)}`}
                    aria-label={`Read release notes for ${release.version}`}
                  >
                    Read release notes <span aria-hidden="true">›</span>
                  </Link>
                  {release.download ? (
                    <a className="community-text-link" href={release.download}>
                      Download <span aria-hidden="true">›</span>
                    </a>
                  ) : null}
                </div>
              </article>
            </li>
          ))}
        </ol>
      ) : (
        <div className="community-empty">
          <h2>No releases yet</h2>
          <p>New versions will appear here when they’re published.</p>
        </div>
      )}
    </main>
  );
}
