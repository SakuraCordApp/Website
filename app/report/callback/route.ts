import { hub, websiteSecrets } from "../../lib/roadmap";
import {
  OAUTH_COOKIE,
  SESSION_COOKIE,
  cookie,
  readCookie,
  safeNext,
  sign,
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
  const token = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: applicationId,
      client_secret: discordClientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${url.origin}/report/callback`,
    }),
  });
  if (!token.ok) return failure("Discord sign-in failed. Please try again.");
  const { access_token: accessToken } = (await token.json()) as {
    access_token: string;
  };
  const me = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!me.ok) return failure("Discord sign-in failed. Please try again.");
  const user = (await me.json()) as {
    id: string;
    username: string;
    global_name?: string | null;
    avatar?: string | null;
  };
  const session = await sign(
    {
      id: user.id,
      username: user.username,
      name: user.global_name || user.username,
      avatarUrl: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : null,
      exp: Date.now() + 30 * 86_400_000,
    },
    sessionSecret,
  );
  const headers = new Headers({
    Location: safeNext(stored.next),
    "Cache-Control": "no-store",
  });
  headers.append(
    "Set-Cookie",
    cookie(SESSION_COOKIE, session, 30 * 86_400, secure),
  );
  headers.append("Set-Cookie", cookie(OAUTH_COOKIE, "", 0, secure));
  return new Response(null, { status: 302, headers });
}
