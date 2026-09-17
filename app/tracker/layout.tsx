import { CommunityUnavailable } from "../community-unavailable";
import { getConfig, getTrackerSnapshot } from "../lib/roadmap";
import { TrackerWorkspace } from "./tracker-workspace";

export default async function TrackerLayout() {
  const data = await Promise.all([getConfig(), getTrackerSnapshot()]).catch(
    () => null,
  );
  if (!data) return <CommunityUnavailable title="Tracker" />;
  const [config, snapshot] = data;
  return (
    <main id="main-content" className="community-page section-shell">
      <TrackerWorkspace config={config} snapshot={snapshot} />
    </main>
  );
}
