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

## Important links

- Latest DMG: `https://sakuracord.app/download`
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
