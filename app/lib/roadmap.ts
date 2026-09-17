import { cache } from "react";
import { roadmapService } from "../../worker/roadmap-context";
import type {
  PublicConfig,
  RoadmapVersion,
  TrackerItem,
  TrackerSnapshot,
} from "./roadmap-types";

export class RoadmapRequestError extends Error {
  constructor(public status: number) {
    super(`Roadmap service returned ${status}`);
  }
}

async function request<T>(path: string): Promise<T> {
  const service = roadmapService.getStore();
  if (!service) throw new Error("Roadmap service binding is unavailable");
  const cached = service.responses.get(path);
  if (cached) return cached as Promise<T>;
  const response = (async () => {
    try {
      const response = await service.fetch(
        new Request(`https://roadmap.sakuracord.app/api/v1/${path}`, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(10_000),
        }),
      );
      if (!response.ok) throw new RoadmapRequestError(response.status);
      return response.json() as Promise<T>;
    } catch (error) {
      if (!(error instanceof RoadmapRequestError) || error.status >= 500)
        console.error("Public roadmap request failed", {
          path: path.split("?", 1)[0],
          message: error instanceof Error ? error.message : "Unknown error",
        });
      throw error;
    }
  })();
  service.responses.set(path, response);
  return response;
}

export const getConfig = cache(async () => {
  const { areas, itemTypes, priorities, lifecycle, publicSections } =
    await request<PublicConfig>("config");
  return { areas, itemTypes, priorities, lifecycle, publicSections };
});
export const getVersions = cache(
  async () => (await request<{ data: RoadmapVersion[] }>("versions")).data,
);
export const getItems = cache(async () => {
  const items: TrackerItem[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  do {
    const query = new URLSearchParams({ limit: "250" });
    if (cursor) query.set("cursor", cursor);
    const page = await request<{ data: TrackerItem[]; nextCursor?: string }>(
      `items?${query}`,
    );
    items.push(...page.data);
    cursor = page.nextCursor;
    if (cursor && seen.has(cursor))
      throw new Error("Repeated roadmap pagination cursor");
    if (cursor) seen.add(cursor);
  } while (cursor);
  return items.map(
    ({
      id,
      title,
      description,
      type,
      status,
      priority,
      area,
      labels,
      acceptanceCriteria,
      references,
      linkedDiscordThreads,
      revision,
    }): TrackerItem => ({
      id,
      title,
      description,
      type,
      status,
      priority,
      area,
      labels,
      acceptanceCriteria,
      references,
      linkedDiscordThreads,
      revision,
    }),
  );
});

export const getTrackerSnapshot = cache(async (): Promise<TrackerSnapshot> => {
  const items = await getItems();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(items)),
  );
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return { items, etag: `"${hash}"` };
});
