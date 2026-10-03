import type { SessionUser } from "./roadmap-types";
import { sign } from "./session";

// Discord sign-in shared by the website and the SakuraCord app. Both obtain an
// identify-scoped authorization code for /report/callback; only this worker
// holds the client secret that turns it into a verified identity.

export const SESSION_DAYS = 30;

export function callbackUrl(origin: string) {
  return `${origin}/report/callback`;
}

export async function discordIdentity(input: {
  applicationId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<SessionUser | null> {
  const token = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: input.applicationId,
      client_secret: input.clientSecret,
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: input.redirectUri,
    }),
  });
  if (!token.ok) return null;
  const { access_token: accessToken } = (await token.json()) as {
    access_token: string;
  };
  const me = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!me.ok) return null;
  const user = (await me.json()) as {
    id: string;
    username: string;
    global_name?: string | null;
    avatar?: string | null;
  };
  return {
    id: user.id,
    username: user.username,
    name: user.global_name || user.username,
    avatarUrl: user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : null,
  };
}

/** A signed session; the website stores it in a cookie and the app keeps it in memory. */
export async function signSession(user: SessionUser, secret: string) {
  const expiresAt = Date.now() + SESSION_DAYS * 86_400_000;
  return {
    token: await sign({ ...user, exp: expiresAt }, secret),
    expiresAt,
  };
}
