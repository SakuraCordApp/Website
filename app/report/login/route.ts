import { callbackUrl } from "../../lib/discord-identity";
import { hub, websiteSecrets } from "../../lib/roadmap";
import { OAUTH_COOKIE, cookie, safeNext, sign } from "../../lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { sessionSecret } = websiteSecrets();
  if (!sessionSecret)
    return new Response("Sign-in is not configured yet.", { status: 503 });
  const { applicationId } = await hub().reportForm();
  const state = crypto.randomUUID();
  const next = safeNext(url.searchParams.get("next"));
  const authorize = new URL("https://discord.com/oauth2/authorize");
  authorize.search = new URLSearchParams({
    client_id: applicationId,
    response_type: "code",
    redirect_uri: callbackUrl(url.origin),
    scope: "identify",
    state,
    prompt: "none",
  }).toString();
  const signed = await sign(
    { state, next, exp: Date.now() + 10 * 60_000 },
    sessionSecret,
  );
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      "Set-Cookie": cookie(
        OAUTH_COOKIE,
        signed,
        600,
        url.protocol === "https:",
      ),
      "Cache-Control": "no-store",
    },
  });
}
