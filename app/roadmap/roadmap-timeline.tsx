"use client";
import { useEffect, useState } from "react";
import type { RoadmapVersion } from "../lib/roadmap-types";
export function RoadmapTimeline({
  initialVersions,
}: {
  initialVersions: RoadmapVersion[];
}) {
  const [versions, setVersions] = useState(initialVersions);
  useEffect(() => {
    const source = new EventSource("/api/roadmap/versions/events");
    source.addEventListener("versions", (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as { data?: RoadmapVersion[] };
        if (
          Array.isArray(payload.data) &&
          payload.data.every(
            (version) =>
              typeof version.id === "string" &&
              typeof version.version === "string" &&
              Array.isArray(version.highlights),
          )
        )
          setVersions(payload.data);
      } catch {
        /* Keep the last complete snapshot while the stream reconnects. */
      }
    });
    return () => source.close();
  }, []);
  const visible = versions
    .filter((version) => version.state === "planned")
    .sort(
      (a, b) =>
        a.position - b.position ||
        a.version.localeCompare(b.version, undefined, { numeric: true }),
    );
  if (!visible.length)
    return (
      <div className="community-empty">
        <h2>The next version plan is being prepared.</h2>
        <p>Published plans will appear here.</p>
      </div>
    );
  return (
    <div className="release-timeline">
      {visible.map((version) => (
        <article className="release-entry" key={version.id}>
          <div className="release-version">v{version.version}</div>
          <div className="release-content">
            <h2>{version.title}</h2>
            {version.highlights.length ? (
              <ul>
                {version.highlights.map((highlight) => (
                  <li key={highlight.id}>{highlight.title}</li>
                ))}
              </ul>
            ) : (
              <p>Highlights are being prepared.</p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
