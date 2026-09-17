import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const DOWNLOAD_URL = "/download";
const STALE_DOWNLOAD_URL =
  "https://github.com/SakuraCordApp/SakuraCord/releases/latest/download/SakuraCord.dmg";
const DISCORD_URL = "https://discord.gg/hWNwFXkUTP";
const MAIN_SITE_URL = "/";

async function render(path = "/", headers = {}, service) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html", ...headers },
    }),
    {
      ROADMAP: service,
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the SakuraCord landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>SakuraCord - Native Discord for macOS<\/title>/);
  assert.match(html, /<h1[^>]*>SakuraCord<\/h1>/);
  assert.match(html, /Download Alpha/);
  assert.match(html, /macOS 27\+/);
  assert.match(html, /download-button-platform/);
  assert.doesNotMatch(html, /class="compatibility"/);
  assert.match(html, /full voice and video support/);
  assert.match(html, new RegExp(DOWNLOAD_URL.replaceAll(".", "\\.")));
  assert.doesNotMatch(
    html,
    new RegExp(STALE_DOWNLOAD_URL.replaceAll(".", "\\.")),
  );
  assert.match(html, new RegExp(DISCORD_URL.replaceAll(".", "\\.")));
  assert.match(
    html,
    new RegExp(
      `<a(?=[^>]*class="brand-link")(?=[^>]*href="${MAIN_SITE_URL.replaceAll(".", "\\.")}")[^>]*>`,
    ),
  );
  assert.match(
    html,
    /property="og:image" content="https:\/\/sakuracord\.app\/discord-preview-macbook-20260821\.png"/,
  );
  assert.match(html, /name="theme-color" content="#ef9bc4"/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/);
});

test("server-renders generic Discord metadata for every settings deeplink", async () => {
  const discordHeaders = {
    "user-agent":
      "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
  };

  for (const path of [
    "/settings",
    "/settings/update",
    "/settings/themes/AQGKz_VpjwzNszNAALhRczO9cKZmwo_Zmcet62c",
  ]) {
    const response = await render(path, discordHeaders);
    assert.equal(response.status, 200);

    const html = await response.text();
    assert.match(html, /<title>SakuraCord Settings Deeplink<\/title>/);
    assert.match(html, /Open it in SakuraCord to use the linked setting/);
    assert.match(
      html,
      new RegExp(`property="og:url" content="https://sakuracord\\.app${path}"`),
    );
    assert.match(
      html,
      /property="og:image" content="https:\/\/sakuracord\.app\/brand\/sakuracord-app-icon\.png"/,
    );
    assert.match(html, /property="og:image:width" content="1024"/);
    assert.match(html, /property="og:image:height" content="1024"/);
    assert.match(html, /property="og:image:type" content="image\/png"/);
    assert.match(html, /name="twitter:card" content="summary"/);
    assert.match(
      html,
      /name="twitter:image" content="https:\/\/sakuracord\.app\/brand\/sakuracord-app-icon\.png"/,
    );
    assert.match(html, /name="theme-color" content="#ef9bc4"/);
  }
});

test("redirects every human settings request to the homepage", async () => {
  for (const path of [
    "/settings",
    "/settings/update",
    "/settings/themes/AQGKz_VpjwzNszNAALhRczO9cKZmwo_Zmcet62c",
  ]) {
    const response = await render(path);
    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), "http://localhost/");
  }
});

test("redirects downloads to the latest versioned DMG", async (t) => {
  const dmgUrl =
    "https://github.com/SakuraCordApp/SakuraCord/releases/download/v0.1.0/SakuraCord.v0.1.0.dmg";

  t.mock.method(globalThis, "fetch", async (input, init) => {
    assert.equal(
      input,
      "https://api.github.com/repos/SakuraCordApp/SakuraCord/releases/latest",
    );
    assert.equal(init.headers["User-Agent"], "SakuraCord-Website");

    return Response.json({
      assets: [
        {
          name: "appcast.xml",
          content_type: "application/xml",
          browser_download_url: "https://example.com/appcast.xml",
        },
        {
          name: "SakuraCord.v0.1.0.dmg",
          content_type: "application/x-apple-diskimage",
          browser_download_url: dmgUrl,
        },
      ],
    });
  });

  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("download-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/download"),
    {},
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), dmgUrl);
});

test("keeps the landing page accessible and resilient", async () => {
  const [page, css, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /className="skip-link"/);
  assert.match(page, /aria-labelledby="hero-title"/);
  assert.match(page, /className="benefit-list"/);
  assert.match(page, /Discord, built as a Mac app\./);
  assert.match(page, /Join the community\./);
  assert.match(page, /There is no Chromium bundle behind the interface/);
  assert.match(page, /className="discord-mark"/);
  assert.doesNotMatch(page, /DiscordLogoIcon/);
  assert.match(
    css,
    /\.hero-actions \.button,\s*\.download-copy \.button\s*\{\s*width: 100%;/,
  );
  assert.match(css, /::selection\s*\{[^}]*background: var\(--pink-light\)/s);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /prefers-reduced-transparency:\s*reduce/);
  assert.match(layout, /colorScheme:\s*"dark"/);
  assert.match(packageJson, /"name": "sakuracord-website"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});

const trackerConfig = {
  areas: [{ id: "chat", label: "Chat" }],
  itemTypes: [{ id: "feature", label: "New Features" }],
  priorities: [{ id: "high", label: "High" }],
  lifecycle: [{ id: "planned", label: "Planned", color: "#60a5fa" }],
  publicSections: [{ id: "planned", label: "Planned", statuses: ["planned"] }],
};
const trackerItem = {
  id: "SCR-01KYACC17TP89XBS7HWEW6FR5K",
  title: "Improve voice controls",
  description: "Make audio devices easier to select.",
  type: "feature",
  area: "chat",
  status: "planned",
  priority: "high",
  labels: [],
  revision: 1,
  references: [],
  linkedDiscordThreads: [],
  acceptanceCriteria: [
    {
      id: "audio",
      statement: "Devices can be selected",
      satisfied: false,
      evidence: [],
    },
  ],
};
function roadmapServiceFixture({ missing = false, requests = [] } = {}) {
  return {
    fetch: async (request) => {
      assert.equal(request.method, "GET");
      assert.equal(request.headers.get("Authorization"), null);
      const url = new URL(request.url);
      requests.push(url.pathname);
      if (url.pathname === "/api/v1/config")
        return Response.json(trackerConfig);
      if (url.pathname === "/api/v1/items") {
        // Exercise pagination as well as server rendering.
        return Response.json(
          url.searchParams.has("cursor")
            ? { data: [trackerItem] }
            : { data: [], nextCursor: "second-page" },
        );
      }
      if (url.pathname.startsWith("/api/v1/items/"))
        return missing
          ? Response.json({ error: { message: "Not found" } }, { status: 404 })
          : Response.json({ data: trackerItem });
      if (url.pathname === "/api/v1/versions")
        return Response.json({
          data: [
            {
              id: "next",
              version: "0.2.0",
              title: "Better conversations",
              state: "planned",
              position: 1,
              highlights: [{ id: "voice", title: "Improved voice calls" }],
            },
            {
              id: "old",
              version: "0.1.0",
              title: "Released version",
              state: "released",
              position: 0,
              highlights: [],
            },
          ],
        });
      throw new Error(`Unexpected public request: ${url}`);
    },
  };
}

test("server-renders roadmap and paginated tracker data with unified internal links", async () => {
  const service = roadmapServiceFixture();
  const roadmap = await render("/roadmap", {}, service);
  assert.equal(roadmap.status, 200);
  const roadmapHtml = await roadmap.text();
  assert.match(roadmapHtml, /<h2>Better conversations<\/h2>/);
  assert.match(roadmapHtml, /Improved voice calls/);
  assert.doesNotMatch(roadmapHtml, /<h2>Released version<\/h2>/);
  const tracker = await render("/tracker?priority=high", {}, service);
  assert.equal(tracker.status, 200);
  const html = await tracker.text();
  assert.match(html, /Improve voice controls/);
  assert.match(
    html,
    /href="\/tracker\/items\/SCR-01KYACC17TP89XBS7HWEW6FR5K\?priority=high"/,
  );
  assert.match(html, /href="\/roadmap"/);
  assert.doesNotMatch(html, /Loading roadmap items/);
  assert.match(
    html,
    /Devices can be selected/,
    "The initial snapshot includes modal details",
  );
});

test("direct tracker links render item content and canonical metadata", async () => {
  const requests = [];
  const response = await render(
    `/tracker/items/${trackerItem.id}`,
    {},
    roadmapServiceFixture({ requests }),
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<dialog[^>]*open=""/);
  assert.match(html, /Devices can be selected/);
  assert.match(html, /aria-label="Close item"/);
  assert.equal(
    requests.filter((path) => path === "/api/v1/items").length,
    2,
    "metadata and layout share the same paginated snapshot",
  );
  assert.ok(
    !requests.some((path) => path.startsWith("/api/v1/items/")),
    "direct links reuse snapshot details",
  );
  assert.match(
    html,
    /<title>Improve voice controls · SakuraCord Tracker<\/title>/,
  );
  assert.match(
    html,
    new RegExp(
      `rel="canonical" href="https://sakuracord.app/tracker/items/${trackerItem.id}"`,
    ),
  );
});

test("missing tracker items produce a not-found response", async () => {
  const response = await render(
    "/tracker/items/missing",
    {},
    roadmapServiceFixture({ missing: true }),
  );
  const html = await response.text();
  assert.ok(
    response.status === 404 || html.includes('name="robots" content="noindex"'),
    "404 status or streamed Next.js not-found marker",
  );
  assert.match(html, /Item not found/);
});

test("a public-data outage renders a retry state inside the shared site", async () => {
  const service = {
    fetch: async () => new Response("Unavailable", { status: 503 }),
  };
  for (const path of [
    "/tracker?priority=high",
    "/roadmap",
    `/tracker/items/${trackerItem.id}`,
  ]) {
    const response = await render(path, {}, service);
    const html = await response.text();
    assert.match(html, /is temporarily unavailable/);
    assert.match(html, /Try again/);
    assert.match(html, /aria-label="Primary navigation"/);
  }
});

test("tracker snapshot refresh uses ETags and recovers after an outage", async () => {
  const service = roadmapServiceFixture();
  const first = await render("/api/tracker", {}, service);
  assert.equal(first.status, 200);
  const snapshot = await first.json();
  assert.deepEqual(snapshot.items, [trackerItem]);
  assert.equal(first.headers.get("etag"), snapshot.etag);
  const unchanged = await render(
    "/api/tracker",
    { "If-None-Match": snapshot.etag },
    service,
  );
  assert.equal(unchanged.status, 304);
  assert.equal(await unchanged.text(), "");

  const unavailable = await render(
    "/api/tracker",
    {},
    {
      fetch: async () => new Response("Unavailable", { status: 503 }),
    },
  );
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.headers.get("cache-control"), "no-store");

  const changed = {
    ...trackerItem,
    title: "Updated voice controls",
    revision: 2,
  };
  const updated = await render(
    "/api/tracker",
    { "If-None-Match": snapshot.etag },
    {
      fetch: async () => Response.json({ data: [changed] }),
    },
  );
  assert.equal(updated.status, 200);
  const refreshed = await updated.json();
  assert.notEqual(refreshed.etag, snapshot.etag);
  assert.deepEqual(refreshed.items, [changed]);
});
