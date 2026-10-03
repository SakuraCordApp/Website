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

## Reports, roadmap, and tracker

GitHub Issues in `SakuraCordApp/SakuraCord` are canonical. The Hub Worker serves
its `/api/v2` read cache through the website's `ROADMAP` service binding.
`/tracker` displays issue numbers, statuses, votes, and the synchronized
conversation; `/roadmap` displays GitHub milestones. Legacy `SCR-…` links
redirect to their migrated issue numbers.

`/report` uses the hub's shared form schema and duplicate search. Both bugs and
suggestions accept only the latest published nightly or regular release. Old
app-prefilled versions require updating and retesting; the server validates the
selected version again before filing. Duplicate suggestions include closed
reports and available fix/release information. Discord OAuth
(`identify` only) establishes a signed, HttpOnly session cookie. Verified users
can submit reports, follow existing issues, and comment. The website passes
that identity to hub RPC methods; browser clients never receive bot tokens,
GitHub credentials, or the session-signing secret. Comments are mirrored to
GitHub and Discord.

Older app builds open `/report` with version, macOS, and hardware query
parameters. These values remain editable and are only filed when the user
submits. The login flow preserves the draft.

Current app builds file reports natively through the same APIs. On submit, the
app authorizes the `identify` scope for `/report/callback` with the person's
Discord session on their Mac, without following the redirect, and posts only
the one-time code and the signed state from `GET /api/report/app/authorize`
back to that route. The response is a bearer session in the same signed format
as the cookie; `/api/report/submit` and `/api/report/me-too` accept either.
The app never sends its Discord credential to the website.

Runtime secrets `DISCORD_CLIENT_SECRET` and `SESSION_SECRET` live in Cloudflare;
maintainer copies are in Keychain. Code changes deploy only through the
existing push-triggered Workers Builds pipeline. Hub queue recovery and
free-tier capacity are documented in the
[Hub README](https://github.com/SakuraCordApp/Roadmap#free-tier-capacity-and-recovery).

Local development uses the configured remote service binding and requires
Cloudflare authentication. Live authenticated submissions mutate real reports;
use a clearly marked temporary report for end-to-end verification and remove
it afterward.
