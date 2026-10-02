import Link from "next/link";
import type { CSSProperties } from "react";
import type { RoadmapVersion } from "../lib/roadmap-types";

export function RoadmapTimeline({ versions }: { versions: RoadmapVersion[] }) {
  if (!versions.length)
    return (
      <div className="community-empty">
        <h2>The next version plan is being prepared.</h2>
        <p>Published plans will appear here.</p>
      </div>
    );
  return (
    <div className="release-timeline">
      {versions.map((version) => {
        const total = version.openIssues + version.closedIssues;
        const progress = total
          ? Math.round((version.closedIssues / total) * 100)
          : 0;
        return (
          <article className="release-entry" key={version.number}>
            <div className="release-version">
              v{version.version}
              <span className="release-state">
                {version.state === "closed" ? "Latest release" : "Up next"}
              </span>
            </div>
            <div className="release-content">
              <h2>{version.headline}</h2>
              {version.summary ? (
                <p className="release-summary">{version.summary}</p>
              ) : null}
              {version.highlights.length ? (
                <ul>
                  {version.highlights.map((highlight) => (
                    <li key={highlight.text}>
                      {highlight.text}
                      {highlight.issues.map((number) => (
                        <Link
                          key={number}
                          className="release-issue"
                          href={`/tracker/items/${number}`}
                        >
                          #{number}
                        </Link>
                      ))}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="release-summary">
                  Highlights are being prepared.
                </p>
              )}
              {version.state === "open" && total ? (
                <div
                  className="release-progress"
                  aria-label={`${progress}% complete`}
                >
                  <span
                    style={{ "--progress": `${progress}%` } as CSSProperties}
                  />
                  <small>
                    {version.closedIssues} of {total} tracked items done
                  </small>
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
