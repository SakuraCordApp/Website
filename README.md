# SakuraCord website

The product site for [SakuraCord](https://github.com/SakuraCordApp/SakuraCord),
a native SwiftUI Discord client for macOS.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run lint
npm run typecheck
npm test
```

The test command creates a production build and verifies the rendered landing
page, metadata, release link, community link, accessibility fallbacks, public
data rendering, direct tracker links, and missing-item handling.

## Discord preview image

The Open Graph and Twitter preview is generated at
`public/discord-preview-macbook-20260821.png`. Regenerate it after editing its
source assets with:

```bash
npm run render:discord-preview
```

The editable composition is `public/og-v12-source.svg`. The renderer combines
it with the original desktop screenshot, the SakuraCord client screenshot, and
the licensed Mythic MacBook shell assets in `public/media`. Generated working
images are intentionally not required by the final composition. When replacing
the preview, use a new output filename and update `app/layout.tsx` to invalidate
social-platform caches.

## Important links

- Latest DMG: `https://sakuracord.app/download`
- Nightly Sparkle feed: `https://sakuracord.app/updates/appcast.xml`
- Source: `https://github.com/SakuraCordApp/SakuraCord`
- Discord: `https://discord.gg/hWNwFXkUTP`
- Roadmap: `https://sakuracord.app/roadmap`
- Tracker: `https://sakuracord.app/tracker`

The site is built with Next.js-compatible React through vinext.

## Deployment

Production runs on Cloudflare Workers at `https://sakuracord.app`.
Cloudflare Builds watches the `main` branch of
`SakuraCordApp/Website` and deploys every push using:

```bash
npm run build
npm run deploy
```

Deployments are handled by Cloudflare's Git integration, not GitHub Actions.

## Public roadmap and tracker

The website owns the shared header, footer, roadmap, tracker board, and item
dialogs. Public data remains in the Roadmap service; server components read its
`/api/v1` endpoints through the request-scoped `ROADMAP` service binding. The
browser endpoints expose the public version event stream and a read-only tracker
snapshot with conditional ETag refresh. No mutation credentials
or account actions are exposed by the website.

The tracker board lives in a persistent layout seeded with full public items.
Board and dialogs share that snapshot. Native history opens `/tracker/items/:id`
without a request, including Back/Forward within the mounted tracker. Modified
clicks retain normal link behavior. The snapshot refreshes once a minute while
visible, and on focus after at least 30 seconds, using ETags to avoid unchanged
response bodies. Failed refreshes keep the previous snapshot visible. Tracker
navigation prefetch is disabled to avoid duplicating the initial snapshot.
Filters remain in the query string; Close, Escape, and browser history return
to the board. Direct links and refreshes server-render the same item and close
to the tracker when no board navigation preceded them.

Local development uses the configured remote binding for public read requests
and requires Cloudflare authentication and a workerd runtime that supports the
configured compatibility date. `MINIFLARE_WORKERD_PATH` can select a newer local
runtime when the installed Cloudflare tooling bundles an older one.

Deploy Website first and verify the new routes before deploying the Roadmap
repository's legacy-subdomain redirects. Both repositories retain their existing
automated deployment workflows.
