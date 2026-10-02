import { hub } from "../../../lib/roadmap";
import { sameOrigin } from "../../../lib/session";
import { errorResponse, jsonResponse } from "../../../lib/api";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonResponse({ error: "Forbidden" }, 403);
  try {
    const { text } = (await request.json()) as { text?: string };
    return jsonResponse({
      results: await hub().similar({ text: String(text ?? "").slice(0, 8000) }),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
