import type { Metadata } from "next";
import { CommunityUnavailable } from "../community-unavailable";
import Link from "next/link";
import { getVersions } from "../lib/roadmap";
import { RoadmapTimeline } from "./roadmap-timeline";
import { communityMetadata } from "../lib/community-metadata";
export const metadata: Metadata = communityMetadata(
  "Roadmap · SakuraCord",
  "See what is coming next in SakuraCord.",
  "/roadmap",
);
export default async function RoadmapPage() {
  const versions = await getVersions().catch(() => null);
  if (!versions) return <CommunityUnavailable title="Roadmap" />;
  return (
    <main id="main-content" className="community-page section-shell">
      <header className="community-heading">
        <div>
          <h1>Roadmap</h1>
          <p>What’s coming next in SakuraCord.</p>
        </div>
        <Link className="community-text-link" href="/tracker">
          Explore the tracker <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <RoadmapTimeline initialVersions={versions} />
      <aside className="roadmap-tracker-link">
        <div>
          <h2>The details behind each release.</h2>
          <p>Browse individual features, fixes, and community reports.</p>
        </div>
        <Link className="community-text-link" href="/tracker">
          Open the tracker <span aria-hidden="true">↗</span>
        </Link>
      </aside>
    </main>
  );
}
