import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const DOWNLOAD_URL =
  "https://github.com/SakuraCordApp/SakuraCord/releases/latest/download/SakuraCord.dmg";
const DISCORD_URL = "https://discord.gg/hWNwFXkUTP";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
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
  assert.match(html, /MacOS 27\+/);
  assert.match(html, /full voice and video support/);
  assert.match(html, new RegExp(DOWNLOAD_URL.replaceAll(".", "\\.")));
  assert.match(html, new RegExp(DISCORD_URL.replaceAll(".", "\\.")));
  assert.match(html, /property="og:image" content="https:\/\/sakuracord\.app\/og\.png"/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/);
});

test("keeps the landing page accessible and resilient", async () => {
  const [page, css, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /className="skip-link"/);
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
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /prefers-reduced-transparency:\s*reduce/);
  assert.match(layout, /colorScheme:\s*"dark"/);
  assert.match(packageJson, /"name": "sakuracord-website"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
