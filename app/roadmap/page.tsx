import type { Metadata } from "next";
import Link from "next/link";
import { CommunityUnavailable } from "../community-unavailable";
import { communityMetadata } from "../lib/community-metadata";
import { getRoadmap } from "../lib/roadmap";
import { RoadmapTimeline } from "./roadmap-timeline";

export const metadata: Metadata = communityMetadata(
  "Roadmap · SakuraCord",
  "See what is coming next in SakuraCord.",
  "/roadmap",
);

export default async function RoadmapPage() {
  const roadmap = await getRoadmap().catch(() => null);
  if (!roadmap) return <CommunityUnavailable title="Roadmap" />;
  const visible = roadmap.visible
    .map((number) =>
      roadmap.versions.find((version) => version.number === number),
    )
    .filter((version) => version !== undefined);
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
      <RoadmapTimeline versions={visible} />
      <aside className="roadmap-tracker-link">
        <div>
          <h2>The details behind each release.</h2>
          <p>
            Browse every bug and suggestion, vote for what matters, or report
            something new.
          </p>
        </div>
        <Link className="community-text-link" href="/tracker">
          Open the tracker <span aria-hidden="true">↗</span>
        </Link>
      </aside>
    </main>
  );
}
