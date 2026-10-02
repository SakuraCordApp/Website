import { AsyncLocalStorage } from "node:async_hooks";

export interface WebsiteSecrets {
  DISCORD_CLIENT_SECRET?: string;
  SESSION_SECRET?: string;
}

// The context belongs to one HTTP request, including metadata and server
// renders. `env` exposes the hub's RPC methods and the website's own secrets.
export const roadmapService = new AsyncLocalStorage<{
  fetch: (request: Request) => Promise<Response>;
  responses: Map<string, Promise<unknown>>;
  env: Env & WebsiteSecrets;
}>();
