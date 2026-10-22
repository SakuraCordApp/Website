import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommunityUnavailable } from "../../community-unavailable";
import { communityMetadata } from "../../lib/community-metadata";
import { Markdown } from "../../lib/markdown";
import { formatReleaseDate, getReleases } from "../../lib/releases";
import { Morph } from "../../symbol";

type Props = { params: Promise<{ tag: string }> };

async function findRelease(tag: string) {
  const releases = await getReleases().catch(() => null);
  if (!releases) return undefined;
  return releases.find((release) => release.tag === tag) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = decodeURIComponent((await params).tag);
  const release = await findRelease(tag);
  return communityMetadata(
    release ? `SakuraCord ${release.version} · Releases` : "Releases · SakuraCord",
    release?.summary.slice(0, 160) || "Release notes for SakuraCord.",
    `/releases/${encodeURIComponent(tag)}`,
  );
}

export default async function ReleaseNotesPage({ params }: Props) {
  const tag = decodeURIComponent((await params).tag);
  const release = await findRelease(tag);
  if (release === undefined) return <CommunityUnavailable title="Releases" />;
  if (!release) notFound();
  return (
    <main id="main-content" className="community-page section-shell release-notes">
      <Link className="community-text-link release-back" href="/releases">
        <span aria-hidden="true">‹</span> All releases
      </Link>
      <header className="release-notes-head">
        <p className="release-notes-meta">
          <time dateTime={release.date}>{formatReleaseDate(release.date)}</time>
          {release.prerelease ? <span className="release-badge">Nightly</span> : null}
        </p>
        <h1>{`SakuraCord ${release.version}`}</h1>
        {release.summary ? <p className="release-notes-summary">{release.summary}</p> : null}
        <div className="community-heading-actions">
          {release.download ? (
            <a className="community-button" href={release.download}>
              <Morph icon="arrow.down.circle.fill">{`Download ${release.version}`}</Morph>
            </a>
          ) : null}
          <a className="community-button is-secondary" href={release.url} target="_blank" rel="noreferrer">
            <Morph icon="arrow.up.right">View on GitHub</Morph>
          </a>
        </div>
      </header>
      {release.notes ? (
        <div className="release-notes-body">
          <Markdown source={release.notes} />
        </div>
      ) : null}
    </main>
  );
}
