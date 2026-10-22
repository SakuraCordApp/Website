import { cache } from "react";

const RELEASES_API =
  "https://api.github.com/repos/SakuraCordApp/SakuraCord/releases?per_page=50";

interface GitHubRelease {
  tag_name: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
  html_url: string;
  assets?: Array<{ name: string; browser_download_url: string }>;
}

export interface Release {
  tag: string;
  /** "0.1.6 Beta 5" */
  version: string;
  prerelease: boolean;
  date: string;
  /** The opening paragraph of the notes. */
  summary: string;
  /** The notes after the opening paragraph, as Markdown. */
  notes: string;
  download: string | null;
  url: string;
}

export function versionLabel(tag: string) {
  return tag.replace(/^v/, "").replace(/-/g, " ");
}

function toRelease(release: GitHubRelease): Release {
  // The release action leaves a marker comment; it is not part of the notes.
  const body = (release.body ?? "").replace(/<!--[\s\S]*?-->/g, "").trim();
  const [first, ...rest] = body.split(/\n\s*\n/);
  const opensWithParagraph = first && !/^(#|-|\*\s|\d+\.)/.test(first.trim());
  return {
    tag: release.tag_name,
    version: versionLabel(release.tag_name),
    prerelease: release.prerelease,
    date: release.published_at ?? "",
    summary: opensWithParagraph ? first.trim() : "",
    notes: (opensWithParagraph ? rest.join("\n\n") : body).trim(),
    download:
      release.assets?.find((asset) => asset.name.toLowerCase().endsWith(".dmg"))
        ?.browser_download_url ?? null,
    url: release.html_url,
  };
}

/** Published releases and nightlies, newest first. */
export const getReleases = cache(async (): Promise<Release[]> => {
  const response = await fetch(RELEASES_API, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "SakuraCord-Website",
    },
    cf: { cacheEverything: true, cacheTtl: 300 },
  } as RequestInit);
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
  const releases = (await response.json()) as GitHubRelease[];
  return releases.filter((release) => !release.draft).map(toRelease);
});

export function formatReleaseDate(iso: string) {
  return iso
    ? new Date(iso).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : "";
}
