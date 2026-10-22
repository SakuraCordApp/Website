import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const DOWNLOAD_URL = "/download";
const STALE_DOWNLOAD_URL =
  "https://github.com/SakuraCordApp/SakuraCord/releases/latest/download/SakuraCord.dmg";
const DISCORD_URL = "https://discord.gg/hWNwFXkUTP";
const MAIN_SITE_URL = "/";

// Workers' default cache, which Node lacks.
const cachedResponses = new Map();
globalThis.caches ??= {
  default: {
    match: async (request) => cachedResponses.get(request.url)?.clone(),
    put: async (request, response) => {
      cachedResponses.set(request.url, response);
    },
  },
};

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

  for (const path of ["/settings", "/settings/update", "/settings/themes"]) {
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
  for (const path of ["/settings", "/settings/update", "/settings/themes"]) {
    const response = await render(path);
    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), "http://localhost/");
  }
});

const THEME_TOKEN = "AQJKz_VpjwzNszNAALhRczO9cP__yjw";
const THEME_PATH = `/settings/themes/${THEME_TOKEN}`;
const THEME_IMAGE = `https://sakuracord.app/theme-preview/v6/${THEME_TOKEN}.png`;

test("server-renders a palette embed for theme links", async () => {
  const response = await render(THEME_PATH, {
    "user-agent":
      "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
  });
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /<title>Orange, Green &amp; Teal theme · SakuraCord<\/title>/);
  assert.equal(html.match(/property="og:image" content="([^"]+)"/)[1], THEME_IMAGE);
  assert.match(html, /property="og:image:width" content="1664"/);
  assert.match(html, /property="og:image:height" content="208"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(
    html,
    /property="og:description" content="Download SakuraCord to use this theme\. SakuraCord is a native and fast Discord client for macOS\."/,
  );
  assert.doesNotMatch(html, /og:image:alt/);
  assert.deepEqual(
    [...html.matchAll(/name="theme-color" content="([^"]+)"/g)].map(
      (match) => match[1],
    ),
    ["#8d543c"],
  );

  const payload = html.match(
    /<script id="discord:component-embed" type="application\/json">(.*?)<\/script>/s,
  )?.[1];
  assert.ok(payload);
  assert.ok(Buffer.byteLength(payload) <= 3000);
  const { component } = JSON.parse(payload);
  assert.equal(component.type, 17);
  assert.equal(component.accent_color, 0x8d543c);
  assert.equal(
    component.components[0].content,
    "## Orange, Green & Teal theme\nDownload SakuraCord to use this theme. SakuraCord is a native and fast Discord client for macOS.",
  );
  // A media description would make Discord badge the image "ALT".
  assert.deepEqual(component.components[1].items, [{ media: { url: THEME_IMAGE } }]);
  assert.deepEqual(component.components[2], {
    type: 1,
    components: [
      { type: 2, style: 5, label: "Get SakuraCord", url: "https://sakuracord.app" },
    ],
  });
});

test("theme links preview only for link-preview bots and redirect people home", async () => {
  // A corrupted checksum, which SakuraCord ignores too.
  const invalidPath = `/settings/themes/${THEME_TOKEN.replace("Vp", "Ap")}`;
  for (const [path, userAgent] of [
    [
      THEME_PATH,
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
    ],
    [
      invalidPath,
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
    ],
    // An encoded path reaches the same route and must get the same headers.
    [
      THEME_PATH.replace("/settings", "/%73ettings"),
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
    ],
    // Pinterest's in-app browser is a person, not its crawler.
    [
      THEME_PATH,
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [Pinterest/iOS]",
    ],
  ]) {
    const response = await render(path, { "user-agent": userAgent });
    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), "http://localhost/");
    assert.match(response.headers.get("vary"), /User-Agent/);
    assert.match(response.headers.get("cache-control"), /no-store/);
  }

  for (const userAgent of [
    "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
    "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
    "Twitterbot/1.0",
    "TelegramBot (like TwitterBot)",
    "facebookexternalhit/1.1 Facebot Twitterbot/1.0",
    "Mozilla/5.0 (compatible; Pinterestbot/1.0; +http://www.pinterest.com/bot.html)",
    "Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36 (compatible; GoogleMessages)",
    "Snap URL Preview Service; bot; snapchat; https://developers.snap.com/robots",
    "Mozilla/5.0 (compatible; MicrosoftPreview/2.0; +https://aka.ms/MicrosoftPreview)",
    "Iframely/1.3.1 (+https://iframely.com/docs/about)",
  ]) {
    const response = await render(THEME_PATH, { "user-agent": userAgent });
    assert.equal(response.status, 200, userAgent);
    assert.match(response.headers.get("vary"), /User-Agent/);
    const html = await response.text();
    assert.match(html, /discord:component-embed/);
    assert.doesNotMatch(html, /<h1[^>]*>Orange/);
  }

  const invalid = await render(invalidPath, { "user-agent": "Discordbot/2.0" });
  const invalidHtml = await invalid.text();
  assert.ok(
    invalid.status === 404 ||
      invalidHtml.includes('name="robots" content="noindex"'),
    "404 status or streamed Next.js not-found marker",
  );
  assert.doesNotMatch(invalidHtml, /discord:component-embed/);
});

test("renders theme previews as cacheable PNGs in the theme's colors", async () => {
  const response = await render(`/theme-preview/v6/${THEME_TOKEN}.png?v=2`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.match(response.headers.get("cache-control"), /immutable/);

  const png = Buffer.from(await response.arrayBuffer());
  assert.equal(png.readUInt32BE(16), 1664);
  assert.equal(png.readUInt32BE(20), 208);
  const { inflateSync } = await import("node:zlib");
  const idat = [];
  for (let offset = 8; offset < png.length; ) {
    const length = png.readUInt32BE(offset);
    if (png.toString("ascii", offset + 4, offset + 8) === "IDAT") {
      idat.push(png.subarray(offset + 8, offset + 8 + length));
    }
    offset += length + 12;
  }
  const scanlines = inflateSync(Buffer.concat(idat));
  const stride = 1664 * 4 + 1;
  const pixel = (x, y) => {
    const row = scanlines.subarray(y * stride + 1, (y + 1) * stride);
    const value = [0, 0, 0, 0];
    for (let column = 0; column <= x; column++) {
      for (let channel = 0; channel < 4; channel++) {
        value[channel] = (value[channel] + row[column * 4 + channel]) & 0xff;
      }
    }
    return `#${value
      .slice(0, 3)
      .map((channel) => channel.toString(16).padStart(2, "0"))
      .join("")}/${value[3]}`;
  };
  // Dot centres sit 16pt apart from the 28pt margin + 10pt inset + 12pt
  // radius, on the bar's centre line, at 4px per point.
  assert.equal(pixel(200, 104), "#8d543c/255");
  assert.equal(pixel(264, 104), "#638d3a/255");
  assert.equal(pixel(328, 104), "#378d73/255");
  // The safe margin around the card is transparent.
  assert.equal(pixel(0, 0).split("/")[1], "0");
  assert.equal(pixel(60, 104).split("/")[1], "0");

  // Earlier embeds' image URLs still resolve.
  for (const version of ["v1", "v2", "v3", "v4", "v5"]) {
    assert.equal(
      (await render(`/theme-preview/${version}/${THEME_TOKEN}.png`)).status,
      200,
    );
  }
  assert.equal(
    (await render(`/theme-preview/v6/${THEME_TOKEN.replace("Vp", "Ap")}.png`))
      .status,
    404,
  );
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

const meta = {
  kinds: [
    { id: "bug", label: "Bug", plural: "Bugs" },
    { id: "feature", label: "Feature", plural: "Features" },
  ],
  statuses: [
    {
      id: "new",
      label: "New",
      featureLabel: "New",
      description: "Waiting for triage",
      color: "#F472B6",
      open: true,
      emoji: "🌱",
    },
    {
      id: "planned",
      label: "Planned",
      featureLabel: "Planned",
      description: "Scheduled",
      color: "#60A5FA",
      open: true,
      emoji: "🗓️",
    },
    {
      id: "shipped",
      label: "Shipped",
      featureLabel: "Shipped",
      description: "Released",
      color: "#34D399",
      open: false,
      emoji: "🌸",
    },
  ],
  areas: [
    {
      id: "communication",
      label: "Communication",
      emoji: "📞",
      description: "Calls",
      color: "#A78BFA",
    },
  ],
  priorities: [
    { id: "high", label: "High", color: "#F97316", description: "Major" },
  ],
};
const trackerIssue = {
  number: 51,
  title: "Improve voice controls",
  kind: "feature",
  status: "planned",
  area: "communication",
  priority: "high",
  summary: "Make audio devices easier to select.",
  votes: 4,
  milestone: "0.2.0",
  shippedIn: null,
  duplicateOf: null,
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-02T00:00:00Z",
  closedAt: null,
  url: "https://github.com/SakuraCordApp/SakuraCord/issues/51",
  threadUrl: "https://discord.com/channels/1/2",
};
const issueDetail = {
  ...trackerIssue,
  labels: [],
  reporter: { name: "Sakura", source: "discord" },
  sections: [
    {
      heading: "What would you like?",
      text: "Devices can be selected from the call bar",
    },
  ],
  attachments: [],
  fixes: [],
  shippedStableIn: null,
  open: true,
  timeline: [
    { kind: "created", createdAt: "2026-09-01T00:00:00Z", data: {} },
    {
      kind: "comment",
      createdAt: "2026-09-02T00:00:00Z",
      data: {
        source: "github",
        author: "super-original",
        body: "Working on it",
        url: "https://github.com/x",
      },
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
      if (url.pathname === "/api/v2/tracker")
        return Response.json({ issues: [trackerIssue], meta, etag: '"one"' });
      if (url.pathname === "/api/v2/issues/51")
        return missing
          ? Response.json({ error: "Not found" }, { status: 404 })
          : Response.json(issueDetail);
      if (url.pathname.startsWith("/api/v2/issues/"))
        return Response.json({ error: "Not found" }, { status: 404 });
      if (url.pathname === "/api/v2/legacy/SCR-01KYACC17TP89XBS7HWEW6FR5K")
        return Response.json({ number: 51 });
      if (url.pathname.startsWith("/api/v2/legacy/"))
        return Response.json({ error: "Not found" }, { status: 404 });
      if (url.pathname === "/api/v2/roadmap")
        return Response.json({
          visible: [2, 3],
          versions: [
            {
              number: 1,
              version: "0.1.0",
              headline: "Old version",
              summary: "",
              highlights: [],
              state: "closed",
              dueOn: null,
              closedAt: "2026-07-01T00:00:00Z",
              openIssues: 0,
              closedIssues: 3,
              url: null,
            },
            {
              number: 2,
              version: "0.1.9",
              headline: "Latest release",
              summary: "",
              highlights: [],
              state: "closed",
              dueOn: null,
              closedAt: "2026-09-01T00:00:00Z",
              openIssues: 0,
              closedIssues: 5,
              url: null,
            },
            {
              number: 3,
              version: "0.2.0",
              headline: "Better conversations",
              summary: "Calls and more.",
              highlights: [{ text: "Improved voice calls", issues: [51] }],
              state: "open",
              dueOn: null,
              closedAt: null,
              openIssues: 3,
              closedIssues: 1,
              url: null,
            },
          ],
        });
      throw new Error(`Unexpected public request: ${url}`);
    },
    reportForm: async () => ({
      applicationId: "1",
      versions: ["0.1.9"],
      kinds: {},
      meta,
    }),
  };
}

test("server-renders roadmap milestones and tracker data with internal links", async () => {
  const service = roadmapServiceFixture();
  const roadmap = await render("/roadmap", {}, service);
  assert.equal(roadmap.status, 200);
  const roadmapHtml = await roadmap.text();
  assert.match(roadmapHtml, /<h2>Better conversations<\/h2>/);
  assert.match(roadmapHtml, /Improved voice calls/);
  assert.match(roadmapHtml, /href="\/tracker\/items\/51"/);
  assert.match(roadmapHtml, /Latest release/);
  assert.doesNotMatch(roadmapHtml, /Old version/);
  const tracker = await render("/tracker?priority=high", {}, service);
  assert.equal(tracker.status, 200);
  const html = await tracker.text();
  assert.match(html, /Improve voice controls/);
  assert.match(html, /href="\/tracker\/items\/51\?priority=high"/);
  assert.match(html, /href="\/report\?type=bug"/);
  assert.doesNotMatch(html, /Loading roadmap items/);
});

test("direct tracker links render item details and canonical metadata", async () => {
  const requests = [];
  const response = await render(
    "/tracker/items/51",
    {},
    roadmapServiceFixture({ requests }),
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<dialog[^>]*open=""/);
  assert.match(html, /Devices can be selected from the call bar/);
  assert.match(html, /Working on it/);
  assert.match(html, /aria-label="Close item"/);
  assert.equal(
    requests.filter((path) => path === "/api/v2/issues/51").length,
    1,
    "metadata and page share one detail request",
  );
  assert.match(
    html,
    /<title>Improve voice controls · SakuraCord Tracker<\/title>/,
  );
  assert.match(
    html,
    /rel="canonical" href="https:\/\/sakuracord.app\/tracker\/items\/51"/,
  );
});

test("legacy tracker IDs redirect to the GitHub issue number", async () => {
  const response = await render(
    "/tracker/items/SCR-01KYACC17TP89XBS7HWEW6FR5K",
    {},
    roadmapServiceFixture(),
  );
  assert.ok(
    [301, 307, 308].includes(response.status),
    `status ${response.status}`,
  );
  assert.match(response.headers.get("location") ?? "", /\/tracker\/items\/51$/);
});

test("missing tracker items produce a not-found response", async () => {
  const response = await render(
    "/tracker/items/999",
    {},
    roadmapServiceFixture(),
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
  for (const path of ["/tracker?priority=high", "/roadmap"]) {
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
  assert.deepEqual(snapshot.issues, [trackerIssue]);
  assert.equal(first.headers.get("etag"), snapshot.etag);
  const unchanged = await render(
    "/api/tracker",
    { "If-None-Match": snapshot.etag },
    service,
  );
  assert.equal(unchanged.status, 304);
  const unavailable = await render(
    "/api/tracker",
    {},
    { fetch: async () => new Response("Unavailable", { status: 503 }) },
  );
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.headers.get("cache-control"), "no-store");
});

test("the report page renders and mutations require a Discord session", async () => {
  const service = roadmapServiceFixture();
  const page = await render("/report?type=bug&version=0.1.9", {}, service);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /aria-label="Primary navigation"/);
  const session = await render("/api/report/session", {}, service);
  assert.deepEqual(await session.json(), {
    user: null,
    signInAvailable: false,
  });
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("submit", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const submit = await worker.fetch(
    new Request("http://localhost/api/report/submit", {
      method: "POST",
      body: new FormData(),
    }),
    {
      ROADMAP: service,
      ASSETS: { fetch: async () => new Response("", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(submit.status, 401);
});

test("native report sign-in accepts only verified identities and rejects malformed bearer tokens", async (t) => {
  const { default: worker } = await import("../dist/server/index.js");
  const user = { id: "123456789012345678", username: "fixture", global_name: "Fixture" };
  const calls = [];
  const env = {
    SESSION_SECRET: "local-test-session-secret",
    DISCORD_CLIENT_SECRET: "local-test-client-secret",
    ROADMAP: {
      reportForm: async () => ({ applicationId: "1530180517155176458" }),
      meToo: async (input) => { calls.push(input); return { number: input.number }; },
    },
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  };
  const invoke = (path, init) => worker.fetch(
    new Request(`https://sakuracord.app${path}`, init), env,
    { waitUntil() {}, passThroughOnException() {} },
  );
  const post = (body, token) => ({
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  t.mock.method(globalThis, "fetch", async (url, init) => {
    if (url === "https://discord.com/api/v10/oauth2/token") {
      assert.equal(init.body.get("code"), "fixture-code");
      assert.equal(init.body.get("redirect_uri"), "https://sakuracord.app/report/callback");
      return Response.json({ access_token: "fixture-access-token" });
    }
    assert.equal(url, "https://discord.com/api/v10/users/@me");
    assert.equal(init.headers.Authorization, "Bearer fixture-access-token");
    return Response.json(user);
  });
  const start = await invoke("/api/report/app/authorize");
  assert.equal(start.status, 200);
  const { state } = await start.json();
  for (const token of [state, "bad.%", "bad.signature.extra"]) {
    const denied = await invoke("/api/report/me-too", post({ number: 42 }, token));
    assert.equal(denied.status, 401);
  }
  assert.equal(calls.length, 0);
  const exchange = await invoke("/api/report/app/authorize", post({ code: "fixture-code", state }));
  assert.equal(exchange.status, 200);
  const session = await exchange.json();
  assert.equal(session.user.id, user.id);
  assert.ok(session.expiresAt > Date.now());
  const followed = await invoke("/api/report/me-too", post({ number: 42 }, session.token));
  assert.equal(followed.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].user.id, user.id);
  const cookieRequest = post({ number: 43 });
  cookieRequest.headers.Cookie = `sc_session=${session.token}`;
  assert.equal((await invoke("/api/report/me-too", cookieRequest)).status, 200);
  assert.equal(calls[1].user.id, user.id);
});
