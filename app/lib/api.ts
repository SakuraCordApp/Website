import { websiteSecrets } from "./roadmap";
import { readSession, sameOrigin } from "./session";

export function jsonResponse(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function errorResponse(error: unknown, status = 400) {
  const message =
    error instanceof Error ? error.message : "Something went wrong.";
  // Zod errors from the hub arrive as JSON text; surface the first message.
  const friendly = message.startsWith("[")
    ? "Please check the form and try again."
    : message;
  return jsonResponse({ error: friendly.slice(0, 300) }, status);
}

/** Resolve the signed-in Discord user for a mutating request. */
export async function requireUser(request: Request) {
  if (!sameOrigin(request))
    return { response: jsonResponse({ error: "Forbidden" }, 403) };
  const user = await readSession(request, websiteSecrets().sessionSecret);
  if (!user)
    return {
      response: jsonResponse({ error: "Sign in with Discord first." }, 401),
    };
  return { user };
}
