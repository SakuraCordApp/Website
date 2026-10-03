import { hub, websiteSecrets } from "../../lib/roadmap";
import {
  SESSION_DAYS,
  callbackUrl,
  discordIdentity,
  signSession,
} from "../../lib/discord-identity";
import {
  OAUTH_COOKIE,
  SESSION_COOKIE,
  cookie,
  readCookie,
  safeNext,
  verify,
} from "../../lib/session";

function failure(message: string) {
  return new Response(message, {
    status: 400,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secure = url.protocol === "https:";
  const { sessionSecret, discordClientSecret } = websiteSecrets();
  if (!sessionSecret || !discordClientSecret)
    return new Response("Sign-in is not configured yet.", { status: 503 });
  const stored = await verify<{ state: string; next: string; exp: number }>(
    readCookie(request, OAUTH_COOKIE),
    sessionSecret,
  );
  const code = url.searchParams.get("code");
  if (!stored || !code || url.searchParams.get("state") !== stored.state)
    return failure("This sign-in link expired. Go back and try again.");
  const { applicationId } = await hub().reportForm();
  const user = await discordIdentity({
    applicationId,
    clientSecret: discordClientSecret,
    code,
    redirectUri: callbackUrl(url.origin),
  });
  if (!user) return failure("Discord sign-in failed. Please try again.");
  const session = await signSession(user, sessionSecret);
  const headers = new Headers({
    Location: safeNext(stored.next),
    "Cache-Control": "no-store",
  });
  headers.append(
    "Set-Cookie",
    cookie(SESSION_COOKIE, session.token, SESSION_DAYS * 86_400, secure),
  );
  headers.append("Set-Cookie", cookie(OAUTH_COOKIE, "", 0, secure));
  return new Response(null, { status: 302, headers });
}
