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
