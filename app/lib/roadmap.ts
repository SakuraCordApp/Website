import { cache } from "react";
import { roadmapService } from "../../worker/roadmap-context";
import type {
  HubService,
  IssueDetail,
  RoadmapData,
  TrackerSnapshot,
} from "./roadmap-types";

export class RoadmapRequestError extends Error {
  constructor(public status: number) {
    super(`Roadmap service returned ${status}`);
  }
}

function context() {
  const service = roadmapService.getStore();
  if (!service) throw new Error("Roadmap service binding is unavailable");
  return service;
}

async function request<T>(path: string): Promise<T> {
  const service = context();
  const cached = service.responses.get(path);
  if (cached) return cached as Promise<T>;
  const response = (async () => {
    try {
      const response = await service.fetch(
        new Request(`https://roadmap.sakuracord.app/api/v2/${path}`, {
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

export const getTrackerSnapshot = cache(() =>
  request<TrackerSnapshot>("tracker"),
);

export const getIssueDetail = cache(async (number: number) => {
  try {
    return await request<IssueDetail>(`issues/${number}`);
  } catch (error) {
    if (error instanceof RoadmapRequestError && error.status === 404)
      return null;
    throw error;
  }
});

export const getRoadmap = cache(() => request<RoadmapData>("roadmap"));

export const resolveLegacyId = cache(async (id: string) => {
  try {
    return (
      await request<{ number: number }>(`legacy/${encodeURIComponent(id)}`)
    ).number;
  } catch {
    return null;
  }
});

/** The hub's RPC methods (report filing, votes, comments). */
export function hub(): HubService {
  return context().env.ROADMAP as unknown as HubService;
}

export function websiteSecrets() {
  const { env } = context();
  return {
    discordClientSecret: env.DISCORD_CLIENT_SECRET,
    sessionSecret: env.SESSION_SECRET,
  };
}
