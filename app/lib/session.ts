import type { SessionUser } from "./roadmap-types";

// Discord sign-in for reports. The session is a signed token holding the
// verified Discord identity: a cookie on the website, a bearer token in the
// SakuraCord app. No server-side session storage is needed.

export const SESSION_COOKIE = "sc_session";
export const OAUTH_COOKIE = "sc_oauth";
const encoder = new TextEncoder();

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(
    atob(padded + "===".slice((padded.length + 3) % 4)),
    (c) => c.charCodeAt(0),
  );
}

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return {
    key,
    signature: new Uint8Array(
      await crypto.subtle.sign("HMAC", key, encoder.encode(data)),
    ),
  };
}

export async function sign(payload: object, secret: string): Promise<string> {
  const body = base64Url(encoder.encode(JSON.stringify(payload)));
  const { signature } = await hmac(secret, body);
  return `${body}.${base64Url(signature)}`;
}

export async function verify<T extends { exp: number }>(
  token: string | undefined,
  secret: string,
): Promise<T | null> {
  if (typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 2 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part)))
      return null;
    const [body, signature] = parts;
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "HMAC", key, fromBase64Url(signature!), encoder.encode(body!),
    );
    if (!valid) return null;
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body!)),
    ) as T;
    return payload && typeof payload.exp === "number" && payload.exp > Date.now()
      ? payload : null;
  } catch {
    return null;
  }
}

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("Cookie") ?? "";
  for (const part of header.split(/;\s*/)) {
    const index = part.indexOf("=");
    if (index > 0 && part.slice(0, index) === name)
      return decodeURIComponent(part.slice(index + 1));
  }
  return undefined;
}

export function cookie(
  name: string,
  value: string,
  maxAgeSeconds: number,
  secure = true,
) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure ? "; Secure" : ""}`;
}

export async function readSession(
  request: Request,
  secret: string | undefined,
): Promise<SessionUser | null> {
  if (!secret) return null;
  const bearer = request.headers
    .get("Authorization")
    ?.match(/^Bearer\s+(\S+)$/i)?.[1];
  const payload = await verify<SessionUser & { exp: number }>(
    bearer ?? readCookie(request, SESSION_COOKIE),
    secret,
  );
  // State tokens share the signing key; only identities are sessions.
  if (!payload || typeof payload.id !== "string") return null;
  return {
    id: payload.id,
    username: payload.username,
    name: payload.name,
    avatarUrl: payload.avatarUrl,
  };
}

/** Reject cross-site form posts; browsers always send Origin on POST. */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

export function safeNext(value: string | null | undefined): string {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/report";
}
