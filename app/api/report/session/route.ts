import { websiteSecrets } from "../../../lib/roadmap";
import { readSession } from "../../../lib/session";
import { jsonResponse } from "../../../lib/api";

export async function GET(request: Request) {
  const { sessionSecret, discordClientSecret } = websiteSecrets();
  return jsonResponse({
    user: await readSession(request, sessionSecret),
    signInAvailable: Boolean(sessionSecret && discordClientSecret),
  });
}
