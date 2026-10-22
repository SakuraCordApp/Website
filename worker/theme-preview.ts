import {
  activeColors,
  clamp,
  decodeThemeToken,
  previewAppearance,
  renderedRGB,
  THEME_CARD,
  themePreviewSize,
  type SharedTheme,
} from "../app/lib/theme-link";

// AppKit's controlBackgroundColor in each appearance.
const CONTROL_BACKGROUND = {
  dark: [30 / 255, 30 / 255, 30 / 255],
  light: [1, 1, 1],
};
// sakuraCordDeepLinkCard: the surface covers the gradient at 94% inside a 1pt
// border, dot outlines are 92%, and the glow is a 13pt NSShadow of 28% accent
// cast by the card's 20% accent fill.
const SURFACE_OPACITY = 0.94;
const OUTLINE_OPACITY = 0.92;
const BORDER_WIDTH = 1;
const GLOW_SIGMA = 13 / 2; // NSShadow's blur radius spans about two sigma.
const GLOW_OPACITY = 0.28 * 0.2;

// Complementary error function for non-negative values
// (Abramowitz–Stegun 7.1.26), for the glow falloff.
function erfc(value: number) {
  const t = 1 / (1 + 0.3275911 * value);
  return (
    t *
    (0.254829592 +
      t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) *
    Math.exp(-value * value)
  );
}

// Draws the in-chat theme link card's palette: overlapping dots on the card
// surface, with its gradient border and accent glow, on a transparent canvas.
// Returns straight (non-premultiplied) RGBA. The pixel loop stays
// allocation-free; per-column and per-row terms are hoisted out of it.
function renderThemePreview(theme: SharedTheme) {
  const { scale, padding, cornerRadius, dotDiameter, dotStep, outlineWidth, glowMargin } =
    THEME_CARD;
  const { width, height } = themePreviewSize(theme);
  const appearance = previewAppearance(theme);
  const palette = activeColors(theme).map((color) => {
    const rgb = renderedRGB(theme, color, appearance);
    return [rgb.red, rgb.green, rgb.blue];
  });
  const accent = palette[0];
  const surface = CONTROL_BACKGROUND[appearance];

  const cardLeft = glowMargin;
  const cardTop = glowMargin;
  const cardRight = width / scale - glowMargin;
  const cardBottom = height / scale - glowMargin;
  const centerX = (cardLeft + cardRight) / 2;
  const centerY = (cardTop + cardBottom) / 2;
  const straightHalfWidth = (cardRight - cardLeft) / 2 - cornerRadius;
  const straightHalfHeight = (cardBottom - cardTop) / 2 - cornerRadius;
  const dotRadius = dotDiameter / 2;
  const dotReach = dotRadius + 1 / scale;
  const dotX = palette.map(
    (_, index) => cardLeft + padding + dotRadius + index * dotStep,
  );

  // NSGradient(colors:) at angle 0 spans the card's bounds, so the border
  // colour depends only on the column.
  const border = new Float64Array(width * 3);
  for (let x = 0; x < width; x++) {
    const position =
      clamp(((x + 0.5) / scale - cardLeft) / (cardRight - cardLeft)) *
      (palette.length - 1);
    const index = Math.min(Math.floor(position), Math.max(palette.length - 2, 0));
    const next = Math.min(index + 1, palette.length - 1);
    for (let channel = 0; channel < 3; channel++) {
      border[x * 3 + channel] =
        palette[index][channel] +
        (palette[next][channel] - palette[index][channel]) * (position - index);
    }
  }

  const pixels = new Uint8Array(width * height * 4);
  const color = new Float64Array(3);
  for (let y = 0; y < height; y++) {
    const pointY = (y + 0.5) / scale;
    const qy = Math.abs(pointY - centerY) - straightHalfHeight;
    const dotOffsetY = pointY - centerY;
    const inDotRows = Math.abs(dotOffsetY) < dotReach;
    for (let x = 0; x < width; x++) {
      const pointX = (x + 0.5) / scale;
      // Signed distance to the card's rounded rectangle.
      const qx = Math.abs(pointX - centerX) - straightHalfWidth;
      const cardDistance =
        Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
        Math.min(Math.max(qx, qy), 0) -
        cornerRadius;
      const cardCoverage = clamp(0.5 - cardDistance * scale);
      const glow =
        cardCoverage < 1
          ? GLOW_OPACITY *
            0.5 *
            erfc(Math.max(cardDistance, 0) / (GLOW_SIGMA * Math.SQRT2))
          : 0;
      let alpha = glow;
      for (let channel = 0; channel < 3; channel++) {
        color[channel] = accent[channel] * glow;
      }

      if (cardCoverage > 0) {
        // The inner surface is the card inset by the border, so its distance
        // is the card's plus the border width.
        const surfaceCoverage =
          SURFACE_OPACITY *
          clamp(0.5 - (cardDistance + BORDER_WIDTH) * scale);
        for (let channel = 0; channel < 3; channel++) {
          const edge = border[x * 3 + channel];
          const card = edge + (surface[channel] - edge) * surfaceCoverage;
          color[channel] = card * cardCoverage + color[channel] * (1 - cardCoverage);
        }

        for (let dot = 0; inDotRows && dot < palette.length; dot++) {
          if (Math.abs(pointX - dotX[dot]) >= dotReach) continue;
          const dotDistance =
            Math.hypot(pointX - dotX[dot], dotOffsetY) - dotRadius;
          const dotCoverage = clamp(0.5 - dotDistance * scale) * cardCoverage;
          if (dotCoverage === 0) continue;
          // A 1pt outline stroked just inside the dot's edge.
          const outlineCoverage =
            OUTLINE_OPACITY * clamp((dotDistance + outlineWidth) * scale + 0.5);
          for (let channel = 0; channel < 3; channel++) {
            const fill =
              palette[dot][channel] +
              (surface[channel] - palette[dot][channel]) * outlineCoverage;
            color[channel] += (fill - color[channel]) * dotCoverage;
          }
        }
        alpha = cardCoverage + alpha * (1 - cardCoverage);
      }

      const offset = (y * width + x) * 4;
      if (alpha > 0) {
        for (let channel = 0; channel < 3; channel++) {
          pixels[offset + channel] = Math.round(clamp(color[channel] / alpha) * 255);
        }
      }
      pixels[offset + 3] = Math.round(alpha * 255);
    }
  }
  return { width, height, pixels };
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array) {
  const chunk = new Uint8Array(data.length + 12);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set(new TextEncoder().encode(type), 4);
  chunk.set(data, 8);
  view.setUint32(data.length + 8, crc32(chunk.subarray(4, data.length + 8)));
  return chunk;
}

async function encodePNG({
  width,
  height,
  pixels,
}: ReturnType<typeof renderThemePreview>) {
  const stride = width * 4;
  const scanlines = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (stride + 1);
    scanlines[row] = 1; // Sub filter: smooth gradients compress well.
    for (let x = 0; x < stride; x++) {
      const index = y * stride + x;
      scanlines[row + 1 + x] = pixels[index] - (x >= 4 ? pixels[index - 4] : 0);
    }
  }
  const compressed = new Uint8Array(
    await new Response(
      new Blob([scanlines]).stream().pipeThrough(new CompressionStream("deflate")),
    ).arrayBuffer(),
  );
  const header = new Uint8Array(13);
  const headerView = new DataView(header.buffer);
  headerView.setUint32(0, width);
  headerView.setUint32(4, height);
  header.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA, no interlace.

  return new Blob([
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", new Uint8Array()),
  ]).arrayBuffer();
}

export async function themePreviewResponse(
  request: Request,
  ctx: ExecutionContext,
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }
  const reply = (response: Response) =>
    request.method === "HEAD" ? new Response(null, response) : response;

  const url = new URL(request.url);
  const token = url.pathname.match(
    /^\/theme-preview\/v1\/([A-Za-z0-9_-]+)\.png$/,
  )?.[1];
  const decoded = token ? decodeThemeToken(token) : null;
  const theme = decoded?.kind === "current" ? decoded.theme : decoded?.preview;
  if (!theme) return new Response("Unknown theme", { status: 404 });

  // Key on the path alone so query strings can't force fresh renders.
  const cacheKey = new Request(`${url.origin}${url.pathname}`);
  const cache = (caches as CacheStorage & { default: Cache }).default;
  const cached = await cache.match(cacheKey);
  if (cached) return reply(cached);

  const png = await encodePNG(renderThemePreview(theme));
  const init = {
    headers: {
      // The token is the whole theme, so a preview never changes.
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/png",
      "X-Content-Type-Options": "nosniff",
    },
  };
  ctx.waitUntil(cache.put(cacheKey, new Response(png, init)));
  return reply(new Response(png, init));
}
