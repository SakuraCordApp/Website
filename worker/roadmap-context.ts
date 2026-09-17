import { AsyncLocalStorage } from "node:async_hooks";

// The cache belongs to one HTTP request, including metadata and server renders.
export const roadmapService = new AsyncLocalStorage<{
  fetch: (request: Request) => Promise<Response>;
  responses: Map<string, Promise<unknown>>;
}>();
