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
npm test
```

The test command creates a production build and verifies the rendered landing
page, metadata, release link, community link, and accessibility fallbacks.

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
- Engineering roadmap: `https://roadmap.sakuracord.app`

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
