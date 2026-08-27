/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

const LATEST_RELEASE_API =
  "https://api.github.com/repos/SakuraCordApp/SakuraCord/releases/latest";
const RELEASES_API =
  "https://api.github.com/repos/SakuraCordApp/SakuraCord/releases?per_page=20";
const RELEASES_URL =
  "https://github.com/SakuraCordApp/SakuraCord/releases/latest";

interface GitHubRelease {
  assets?: Array<{
    browser_download_url?: string;
    content_type?: string;
    name?: string;
    updated_at?: string;
  }>;
  draft?: boolean;
  prerelease?: boolean;
}

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

async function latestDmgResponse(request: Request): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const releaseResponse = await fetch(LATEST_RELEASE_API, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "SakuraCord-Website",
    },
    cf: {
      cacheEverything: true,
      cacheTtl: 300,
    },
  });

  if (!releaseResponse.ok) {
    return Response.redirect(RELEASES_URL, 302);
  }

  const release = (await releaseResponse.json()) as GitHubRelease;
  const dmg = release.assets?.find(
    (asset) =>
      asset.name?.toLowerCase().endsWith(".dmg") &&
      asset.browser_download_url,
  );

  if (!dmg?.browser_download_url) {
    return Response.redirect(RELEASES_URL, 302);
  }

  return Response.redirect(dmg.browser_download_url, 302);
}

async function nightlyAppcastResponse(request: Request): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const releasesResponse = await fetch(RELEASES_API, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "SakuraCord-Website",
    },
    cf: {
      cacheEverything: true,
      cacheTtl: 60,
    },
  });

  if (!releasesResponse.ok) {
    return new Response("The nightly update feed is temporarily unavailable.", {
      status: 502,
    });
  }

  const releases = (await releasesResponse.json()) as GitHubRelease[];
  const appcast = releases
    .find((release) => !release.draft && release.prerelease)
    ?.assets?.find(
      (asset) =>
        asset.name === "appcast.xml" && asset.browser_download_url,
    );

  if (!appcast?.browser_download_url) {
    return new Response("No nightly update feed has been published.", {
      status: 404,
    });
  }

  const appcastURL = new URL(appcast.browser_download_url);
  if (appcast.updated_at) {
    appcastURL.searchParams.set("updated", appcast.updated_at);
  }
  const appcastResponse = await fetch(appcastURL, {
    method: request.method,
    cf: {
      cacheEverything: true,
      cacheTtl: 60,
    },
  });

  if (!appcastResponse.ok) {
    return new Response("The nightly update feed is temporarily unavailable.", {
      status: 502,
    });
  }

  const headers = new Headers(appcastResponse.headers);
  headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  headers.set("Content-Type", "application/xml; charset=utf-8");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.delete("Content-Disposition");

  return new Response(request.method === "HEAD" ? null : appcastResponse.body, {
    status: 200,
    headers,
  });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/download") {
      return latestDmgResponse(request);
    }

    if (url.pathname === "/updates/appcast.xml") {
      return nightlyAppcastResponse(request);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
