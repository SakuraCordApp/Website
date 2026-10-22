"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Releases = {
  release: { version: string } | null;
  nightly: { version: string } | null;
};

/** The line under the download buttons: current version, requirement, and the nightly. */
export function ReleaseLine() {
  const [releases, setReleases] = useState<Releases | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/releases", { signal: controller.signal })
      .then((response) =>
        response.ok ? (response.json() as Promise<Releases>) : null,
      )
      .then((data) => {
        if (data) setReleases(data);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <p className="hero-facts type-caption text-muted">
      {releases?.release ? (
        <>
          <Link className="release-nightly" href="/releases">
            Version {releases.release.version}
          </Link>
          {" · "}
        </>
      ) : null}
      <span className="download-button-platform">macOS 27 or later</span>
      {releases?.nightly ? (
        <>
          {" · "}
          <a className="release-nightly" href="/download/nightly">
            Get the nightly ({releases.nightly.version})
          </a>
        </>
      ) : null}
    </p>
  );
}
