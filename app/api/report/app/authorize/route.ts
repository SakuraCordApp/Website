import {
  callbackUrl,
  discordIdentity,
  signSession,
} from "../../../../lib/discord-identity";
import { errorResponse, jsonResponse } from "../../../../lib/api";
import { hub, websiteSecrets } from "../../../../lib/roadmap";
import { sign, verify } from "../../../../lib/session";

// Sign-in for the SakuraCord app. The app authorizes this redirect URI with the
// person's Discord session on their Mac and sends only the resulting one-time
// code here; it receives a bearer session for the report APIs.

type AppState = { purpose: "app"; nonce: string; exp: number };

export async function GET(request: Request) {
  const { sessionSecret, discordClientSecret } = websiteSecrets();
  if (!sessionSecret || !discordClientSecret)
    return jsonResponse({ error: "Sign-in is not configured yet." }, 503);
  try {
    const { applicationId } = await hub().reportForm();
    const state = await sign(
      { purpose: "app", nonce: crypto.randomUUID(), exp: Date.now() + 10 * 60_000 },
      sessionSecret,
    );
    return jsonResponse({
      applicationId,
      redirectUri: callbackUrl(new URL(request.url).origin),
      scopes: ["identify"],
      state,
    });
  } catch (error) {
    return errorResponse(error, 503);
  }
}

export async function POST(request: Request) {
  const { sessionSecret, discordClientSecret } = websiteSecrets();
  if (!sessionSecret || !discordClientSecret)
    return jsonResponse({ error: "Sign-in is not configured yet." }, 503);
  try {
    const { code, state } = (await request.json()) as {
      code?: string;
      state?: string;
    };
    const stored = await verify<AppState>(state, sessionSecret);
    if (!stored || stored.purpose !== "app" || !code)
      return jsonResponse({ error: "This sign-in expired. Try again." }, 400);
    const { applicationId } = await hub().reportForm();
    const user = await discordIdentity({
      applicationId,
      clientSecret: discordClientSecret,
      code: String(code),
      redirectUri: callbackUrl(new URL(request.url).origin),
    });
    if (!user)
      return jsonResponse({ error: "Discord sign-in failed. Try again." }, 401);
    return jsonResponse({ ...(await signSession(user, sessionSecret)), user });
  } catch (error) {
    return errorResponse(error);
  }
}
