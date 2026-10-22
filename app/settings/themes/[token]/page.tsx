/* eslint-disable @next/next/no-img-element -- The preview is rendered by the worker; vinext has no runtime Next image optimizer. */
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import {
  decodeThemeToken,
  previewAppearance,
  renderedRGB,
  rgbHex,
  themeName,
  themePreviewPath,
  THEME_PREVIEW_SIZE,
} from "../../../lib/theme-link";

const SITE_URL = "https://sakuracord.app";
const SAKURA_PINK = "#ef9bc4";
const DESCRIPTION =
  "Download SakuraCord to use this theme. SakuraCord is a native and fast Discord client for macOS.";

type ThemeLinkPageProps = {
  params: Promise<{ token: string }>;
};

// Metadata, viewport and the page all need the decoded link.
const loadThemeLink = cache((token: string) => {
  const decoded = decodeThemeToken(token);
  if (!decoded) notFound();
  const theme = decoded.kind === "current" ? decoded.theme : decoded.preview;
  const name = theme ? `${themeName(theme)} theme` : "SakuraCord theme";
  return {
    token,
    theme,
    name,
    // The card's first palette color, as SakuraCord renders it.
    accent: theme
      ? rgbHex(renderedRGB(theme, theme.colors[0], previewAppearance(theme)))
      : SAKURA_PINK,
  };
});

function componentEmbed({
  token,
  theme,
  name,
  accent,
}: ReturnType<typeof loadThemeLink>) {
  return {
    component: {
      type: 17,
      accent_color: Number.parseInt(accent.slice(1), 16),
      components: [
        { type: 10, content: `## ${name}\n${DESCRIPTION}` },
        ...(theme
          ? [
              {
                type: 12,
                items: [
                  {
                    // No description: Discord would badge the image "ALT",
                    // and the text above already names the theme.
                    media: { url: `${SITE_URL}${themePreviewPath(token)}` },
                  },
                ],
              },
            ]
          : []),
        {
          type: 1,
          components: [
            { type: 2, style: 5, label: "Get SakuraCord", url: SITE_URL },
          ],
        },
      ],
    },
  };
}

export async function generateMetadata({
  params,
}: ThemeLinkPageProps): Promise<Metadata> {
  const { token, theme, name } = loadThemeLink((await params).token);
  const title = `${name} · SakuraCord`;
  const image = theme
    ? {
        url: themePreviewPath(token),
        ...THEME_PREVIEW_SIZE,
        type: "image/png",
      }
    : {
        url: "/brand/sakuracord-app-icon.png",
        width: 1024,
        height: 1024,
        type: "image/png",
        alt: "SakuraCord app icon",
      };

  const shared = { title, description: DESCRIPTION, images: [image] };

  return {
    title,
    description: DESCRIPTION,
    alternates: { canonical: `/settings/themes/${token}` },
    openGraph: {
      type: "website",
      url: `/settings/themes/${token}`,
      siteName: "SakuraCord",
      ...shared,
    },
    twitter: { card: theme ? "summary_large_image" : "summary", ...shared },
  };
}

export async function generateViewport({
  params,
}: ThemeLinkPageProps): Promise<Viewport> {
  const { accent } = loadThemeLink((await params).token);
  return { themeColor: accent, colorScheme: "dark" };
}

export default async function ThemeLinkPage({ params }: ThemeLinkPageProps) {
  const themeLink = loadThemeLink((await params).token);
  return (
    <>
      <script
        id="discord:component-embed"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(componentEmbed(themeLink)).replace(
            /</g,
            "\\u003c",
          ),
        }}
      />
      <main
        id="main-content"
        className="community-page section-shell community-empty"
      >
        <h1>{themeLink.name}</h1>
        <p>{DESCRIPTION}</p>
        {themeLink.theme && (
          <img
            className="theme-link-preview"
            src={themePreviewPath(themeLink.token)}
            {...THEME_PREVIEW_SIZE}
            alt={`${themeLink.name} palette`}
          />
        )}
        <p>
          <a className="button button-primary" href="/download">
            Download SakuraCord
          </a>
        </p>
      </main>
    </>
  );
}
