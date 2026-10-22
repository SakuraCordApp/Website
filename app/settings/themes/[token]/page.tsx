/* eslint-disable @next/next/no-img-element -- The preview is rendered by the worker; vinext has no runtime Next image optimizer. */
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import {
  activeColors,
  decodeThemeToken,
  previewAppearance,
  renderedRGB,
  rgbHex,
  themeName,
  themePreviewPath,
  themePreviewSize,
  type SharedTheme,
} from "../../../lib/theme-link";

const SITE_URL = "https://sakuracord.app";

type ThemeLinkPageProps = {
  params: Promise<{ token: string }>;
};

async function loadThemeLink({ params }: ThemeLinkPageProps) {
  const { token } = await params;
  const decoded = decodeThemeToken(token);
  if (!decoded) notFound();
  const theme = decoded.kind === "current" ? decoded.theme : decoded.preview;
  const name = theme ? `${themeName(theme)} theme` : "SakuraCord theme";
  return {
    token,
    theme,
    name,
    description: themeDescription(theme, decoded.kind !== "current"),
    palette: theme ? themePalette(theme) : [],
  };
}

function themePalette(theme: SharedTheme) {
  const appearance = previewAppearance(theme);
  return activeColors(theme).map((color) =>
    rgbHex(renderedRGB(theme, color, appearance)),
  );
}

function themeDescription(theme: SharedTheme | null, needsUpdate: boolean) {
  const opacity = Math.round((theme?.windowOpacity ?? 1) * 100);
  const summary = theme
    ? `A ${theme.appearance === "system" ? "" : `${theme.appearance} `}SakuraCord theme with ${theme.activeColorCount} ${theme.activeColorCount === 1 ? "color" : "colors"}${opacity < 100 ? ` and ${opacity}% window opacity` : ""}.`
    : "A SakuraCord theme.";
  return needsUpdate
    ? `${summary} It needs a newer version of SakuraCord.`
    : `${summary} Paste the link into any SakuraCord chat, then press Apply Theme.`;
}

function componentEmbed({
  token,
  theme,
  name,
  description,
  palette,
}: Awaited<ReturnType<typeof loadThemeLink>>) {
  return {
    component: {
      type: 17,
      accent_color: Number.parseInt((palette[0] ?? "#ef9bc4").slice(1), 16),
      components: [
        { type: 10, content: `## ${name}\n${description}` },
        ...(theme
          ? [
              {
                type: 12,
                items: [
                  {
                    media: { url: `${SITE_URL}${themePreviewPath(token)}` },
                    description: `${name} palette`,
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

export async function generateMetadata(
  props: ThemeLinkPageProps,
): Promise<Metadata> {
  const { token, theme, name, description } = await loadThemeLink(props);
  const title = `${name} · SakuraCord`;
  const image = theme
    ? {
        url: themePreviewPath(token),
        ...themePreviewSize(theme),
        type: "image/png",
        alt: `${name} palette`,
      }
    : {
        url: "/brand/sakuracord-app-icon.png",
        width: 1024,
        height: 1024,
        type: "image/png",
        alt: "SakuraCord app icon",
      };

  return {
    title,
    description,
    alternates: { canonical: `/settings/themes/${token}` },
    openGraph: {
      type: "website",
      url: `/settings/themes/${token}`,
      siteName: "SakuraCord",
      title,
      description,
      images: [image],
    },
    twitter: {
      card: theme ? "summary_large_image" : "summary",
      title,
      description,
      images: [image],
    },
  };
}

export async function generateViewport(
  props: ThemeLinkPageProps,
): Promise<Viewport> {
  const { palette } = await loadThemeLink(props);
  return { themeColor: palette[0] ?? "#ef9bc4", colorScheme: "dark" };
}

export default async function ThemeLinkPage(props: ThemeLinkPageProps) {
  const themeLink = await loadThemeLink(props);
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
        <p>{themeLink.description}</p>
        {themeLink.theme && (
          <img
            className="theme-link-preview"
            src={themePreviewPath(themeLink.token)}
            {...themePreviewSize(themeLink.theme)}
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
