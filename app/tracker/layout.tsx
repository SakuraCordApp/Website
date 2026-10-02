import type { ReactNode } from "react";
import { CommunityUnavailable } from "../community-unavailable";
import { getTrackerSnapshot } from "../lib/roadmap";
import { TrackerWorkspace } from "./tracker-workspace";

export default async function TrackerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const snapshot = await getTrackerSnapshot().catch(() => null);
  if (!snapshot) return <CommunityUnavailable title="Tracker" />;
  return (
    <main id="main-content" className="community-page section-shell">
      <TrackerWorkspace snapshot={snapshot}>{children}</TrackerWorkspace>
    </main>
  );
}
