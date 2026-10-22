import {
  activeColors,
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

const clampUnit = (value: number) => Math.min(Math.max(value, 0), 1);

// Signed distance from a point to a rounded rectangle.
function roundedRectDistance(
  x: number,
  y: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
  radius: number,
) {
  const qx = Math.abs(x - (left + right) / 2) - ((right - left) / 2 - radius);
  const qy = Math.abs(y - (top + bottom) / 2) - ((bottom - top) / 2 - radius);
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    radius
  );
}

// Complementary error function (Abramowitz–Stegun 7.1.26), for the glow.
function erfc(value: number) {
  const t = 1 / (1 + 0.3275911 * Math.abs(value));
  const tail =
    t *
    (0.254829592 +
      t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) *
    Math.exp(-value * value);
  return value >= 0 ? tail : 2 - tail;
}

// Draws the in-chat theme link card's palette: overlapping dots on the card
// surface, with its gradient border and accent glow, on a transparent canvas.
// Returns straight (non-premultiplied) RGBA.
export function renderThemePreview(theme: SharedTheme): Uint8Array {
  const {
    scale,
    padding,
    cornerRadius,
    dotDiameter,
    dotStep,
    outlineWidth,
    glowMargin,
  } = THEME_CARD;
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
  const dotRadius = dotDiameter / 2;
  const dotY = (cardTop + cardBottom) / 2;
  const firstDotX = cardLeft + padding + dotRadius;
  // NSShadow's blur radius is roughly two standard deviations. The shadow
  // comes from the card's 20% accent fill, tinted with 28% accent.
  const glowSigma = 13 / 2;
  const glowAlpha = 0.28 * 0.2;

  const pixels = new Uint8Array(width * height * 4);
  const card = [0, 0, 0];
  for (let y = 0; y < height; y++) {
    const pointY = (y + 0.5) / scale;
    for (let x = 0; x < width; x++) {
      const pointX = (x + 0.5) / scale;
      const cardDistance = roundedRectDistance(
        pointX, pointY, cardLeft, cardTop, cardRight, cardBottom, cornerRadius,
      );
      const cardCoverage = clampUnit(0.5 - cardDistance * scale);
      const glow =
        glowAlpha * 0.5 * erfc(Math.max(cardDistance, 0) / (glowSigma * Math.SQRT2));
      let red = accent[0] * glow;
      let green = accent[1] * glow;
      let blue = accent[2] * glow;
      let alpha = glow;

      if (cardCoverage > 0) {
        // NSGradient(colors:) at angle 0 spans the card's bounds.
        const position =
          clampUnit((pointX - cardLeft) / (cardRight - cardLeft)) *
          (palette.length - 1);
        const index = Math.min(Math.floor(position), Math.max(palette.length - 2, 0));
        const next = Math.min(index + 1, palette.length - 1);
        const fraction = position - index;
        // The surface covers the gradient at 94%, inset by the 1pt border.
        const innerCoverage =
          0.94 *
          clampUnit(
            0.5 -
              roundedRectDistance(
                pointX,
                pointY,
                cardLeft + 1,
                cardTop + 1,
                cardRight - 1,
                cardBottom - 1,
                cornerRadius - 1,
              ) *
                scale,
          );
        for (let channel = 0; channel < 3; channel++) {
          const border =
            palette[index][channel] +
            (palette[next][channel] - palette[index][channel]) * fraction;
          card[channel] = border + (surface[channel] - border) * innerCoverage;
        }

        for (let dot = 0; dot < palette.length; dot++) {
          const dotDistance =
            Math.hypot(pointX - (firstDotX + dot * dotStep), pointY - dotY) -
            dotRadius;
          const dotCoverage = clampUnit(0.5 - dotDistance * scale);
          if (dotCoverage === 0) continue;
          // A 1pt outline stroked just inside the dot's edge.
          const outlineCoverage =
            0.92 * clampUnit((dotDistance + outlineWidth) * scale + 0.5);
          for (let channel = 0; channel < 3; channel++) {
            const fill =
              palette[dot][channel] +
              (surface[channel] - palette[dot][channel]) * outlineCoverage;
            card[channel] += (fill - card[channel]) * dotCoverage;
          }
        }

        red = card[0] * cardCoverage + red * (1 - cardCoverage);
        green = card[1] * cardCoverage + green * (1 - cardCoverage);
        blue = card[2] * cardCoverage + blue * (1 - cardCoverage);
        alpha = cardCoverage + alpha * (1 - cardCoverage);
      }

      const offset = (y * width + x) * 4;
      if (alpha > 0) {
        pixels[offset] = Math.round(clampUnit(red / alpha) * 255);
        pixels[offset + 1] = Math.round(clampUnit(green / alpha) * 255);
        pixels[offset + 2] = Math.round(clampUnit(blue / alpha) * 255);
      }
      pixels[offset + 3] = Math.round(alpha * 255);
    }
  }
  return pixels;
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

export async function encodePNG(
  width: number,
  height: number,
  rgba: Uint8Array,
): Promise<Uint8Array<ArrayBuffer>> {
  const stride = width * 4;
  const scanlines = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (stride + 1);
    scanlines[row] = 1; // Sub filter: smooth gradients compress well.
    for (let x = 0; x < stride; x++) {
      const index = y * stride + x;
      scanlines[row + 1 + x] = rgba[index] - (x >= 4 ? rgba[index - 4] : 0);
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

  const parts = [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", new Uint8Array()),
  ];
  const png = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    png.set(part, offset);
    offset += part.length;
  }
  return png;
}

export async function themePreviewResponse(
  request: Request,
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const url = new URL(request.url);
  // Key on the path alone so query strings can't force fresh renders.
  const cacheKey = new Request(`${url.origin}${url.pathname}`);
  // Workers' default cache; absent when the tests run the worker in Node.
  const cache =
    typeof caches === "undefined"
      ? undefined
      : (caches as CacheStorage & { default: Cache }).default;
  const cached = await cache?.match(cacheKey);
  if (cached) return request.method === "HEAD" ? new Response(null, cached) : cached;

  const token = url.pathname.match(
    /^\/theme-preview\/v1\/([A-Za-z0-9_-]+)\.png$/,
  )?.[1];
  const decoded = token ? decodeThemeToken(token) : null;
  const theme = decoded?.kind === "current" ? decoded.theme : decoded?.preview;
  if (!theme) return new Response("Unknown theme", { status: 404 });

  const { width, height } = themePreviewSize(theme);
  const png = await encodePNG(width, height, renderThemePreview(theme));
  const response = new Response(png, {
    headers: {
      // The token is the whole theme, so a preview never changes.
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/png",
      "X-Content-Type-Options": "nosniff",
    },
  });
  await cache?.put(cacheKey, response.clone());
  return request.method === "HEAD" ? new Response(null, response) : response;
}
