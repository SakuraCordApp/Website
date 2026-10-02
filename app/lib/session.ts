import type { SessionUser } from "./roadmap-types";

// Discord sign-in for website reports. The session is a signed cookie holding
// the verified Discord identity; no server-side session storage is needed.

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
  if (!token || !token.includes(".")) return null;
  const [body, signature] = token.split(".");
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(signature!),
    encoder.encode(body!),
  );
  if (!valid) return null;
  try {
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body!)),
    ) as T;
    return payload.exp > Date.now() ? payload : null;
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
  const payload = await verify<SessionUser & { exp: number }>(
    readCookie(request, SESSION_COOKIE),
    secret,
  );
  if (!payload) return null;
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
