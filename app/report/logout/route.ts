import { SESSION_COOKIE, cookie, safeNext } from "../../lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return new Response(null, {
    status: 302,
    headers: {
      Location: safeNext(url.searchParams.get("next")),
      "Set-Cookie": cookie(SESSION_COOKIE, "", 0, url.protocol === "https:"),
      "Cache-Control": "no-store",
    },
  });
}
