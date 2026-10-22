import {
  activeColors,
  clamp,
  decodeThemeToken,
  previewAppearance,
  renderedRGB,
  THEME_CARD,
  THEME_PREVIEW_SIZE,
  themePreviewPath,
  type SharedTheme,
} from "../app/lib/theme-link";

// AppKit's controlBackgroundColor in each appearance.
const CONTROL_BACKGROUND = {
  dark: [30 / 255, 30 / 255, 30 / 255],
  light: [1, 1, 1],
};
// sakuraCordDeepLinkCard and sakuraCordButton: the surface covers the
// gradient at 94% inside the border, dot outlines are 92%, and the idle
// button darkens its gradient by 12% under a 7% white outline.
const SURFACE_OPACITY = 0.94;
const OUTLINE_OPACITY = 0.92;
const BUTTON_SHADE = 0.12;
const BUTTON_OUTLINE_OPACITY = 0.07;

// Signed distance to a rounded rectangle, from per-axis offsets past its
// straight edges.
function roundedRectDistance(qx: number, qy: number, radius: number) {
  // Only the rounded corners need the Euclidean distance.
  return qx > 0 && qy > 0
    ? Math.hypot(qx, qy) - radius
    : Math.max(qx, qy) - radius;
}

// Evenly spaced stops across [left, right], like NSGradient(colors:) at
// angle 0, sampled for each pixel column.
function columnGradient(
  palette: number[][],
  width: number,
  left: number,
  right: number,
) {
  const colors = new Float64Array(width * 3);
  for (let x = 0; x < width; x++) {
    const position =
      clamp(
        ((x + 0.5) / THEME_CARD.scale - THEME_CARD.marginX - left) /
          (right - left),
      ) *
      (palette.length - 1);
    const index = Math.min(Math.floor(position), Math.max(palette.length - 2, 0));
    const next = Math.min(index + 1, palette.length - 1);
    for (let channel = 0; channel < 3; channel++) {
      colors[x * 3 + channel] =
        palette[index][channel] +
        (palette[next][channel] - palette[index][channel]) * (position - index);
    }
  }
  return colors;
}

// Draws the in-chat theme link card as a bar: the overlapping palette dots on
// the left and the gradient button on the right, without their labels.
// Returns straight (non-premultiplied) RGBA; the pixel loop stays
// allocation-free.
function renderThemePreview(theme: SharedTheme) {
  const {
    scale,
    width: cardWidth,
    height: cardHeight,
    marginX,
    marginY,
    inset,
    cornerRadius,
    borderWidth,
    dotDiameter,
    dotStep,
    outlineWidth,
    buttonWidth,
    buttonHeight,
  } = THEME_CARD;
  const { width, height } = THEME_PREVIEW_SIZE;
  const appearance = previewAppearance(theme);
  const palette = activeColors(theme).map((color) => {
    const rgb = renderedRGB(theme, color, appearance);
    return [rgb.red, rgb.green, rgb.blue];
  });
  const surface = CONTROL_BACKGROUND[appearance];
  const centerX = cardWidth / 2;
  const centerY = cardHeight / 2;
  const dotRadius = dotDiameter / 2;
  const dotReach = dotRadius + 1 / scale;
  const dotX = palette.map(
    (_, index) => inset + dotRadius + index * dotStep,
  );
  const dotsRight = dotX[dotX.length - 1] + dotReach;
  const buttonRight = cardWidth - inset;
  const buttonLeft = buttonRight - buttonWidth;
  const buttonRadius = buttonHeight / 2;
  const buttonCenterX = (buttonLeft + buttonRight) / 2;
  const edgeReach = 1 / scale;
  const cardColors = columnGradient(palette, width, 0, cardWidth);
  const buttonColors = columnGradient(palette, width, buttonLeft, buttonRight);

  const pixels = new Uint8Array(width * height * 4);
  const color = new Float64Array(3);
  for (let y = 0; y < height; y++) {
    const offsetY = (y + 0.5) / scale - marginY - centerY;
    const cardQY = Math.abs(offsetY) - (cardHeight / 2 - cornerRadius);
    const inButtonRows = Math.abs(offsetY) < buttonRadius + edgeReach;
    const inDotRows = Math.abs(offsetY) < dotReach;
    for (let x = 0; x < width; x++) {
      const pointX = (x + 0.5) / scale - marginX;
      const cardDistance = roundedRectDistance(
        Math.abs(pointX - centerX) - (centerX - cornerRadius),
        cardQY,
        cornerRadius,
      );
      const cardCoverage = clamp(0.5 - cardDistance * scale);
      if (cardCoverage === 0) continue;

      // The gradient shows as the border around the 94% surface.
      const surfaceCoverage =
        SURFACE_OPACITY * clamp(0.5 - (cardDistance + borderWidth) * scale);
      for (let channel = 0; channel < 3; channel++) {
        const edge = cardColors[x * 3 + channel];
        color[channel] = edge + (surface[channel] - edge) * surfaceCoverage;
      }

      if (
        inButtonRows &&
        pointX > buttonLeft - edgeReach &&
        pointX < buttonRight + edgeReach
      ) {
        // The button is a capsule, so it has no straight vertical edge.
        const buttonDistance = roundedRectDistance(
          Math.abs(pointX - buttonCenterX) - (buttonWidth / 2 - buttonRadius),
          Math.abs(offsetY),
          buttonRadius,
        );
        const buttonCoverage = clamp(0.5 - buttonDistance * scale);
        const buttonOutline =
          BUTTON_OUTLINE_OPACITY *
          clamp((buttonDistance + borderWidth) * scale + 0.5);
        for (let channel = 0; channel < 3; channel++) {
          const shaded = buttonColors[x * 3 + channel] * (1 - BUTTON_SHADE);
          const fill = shaded + (1 - shaded) * buttonOutline;
          color[channel] += (fill - color[channel]) * buttonCoverage;
        }
      }

      // Later dots overlap earlier ones; each has a 1pt outline stroked just
      // inside its edge.
      if (inDotRows && pointX < dotsRight) {
        for (let dot = 0; dot < palette.length; dot++) {
          if (Math.abs(pointX - dotX[dot]) >= dotReach) continue;
          const dotDistance =
            Math.hypot(pointX - dotX[dot], offsetY) - dotRadius;
          const dotCoverage = clamp(0.5 - dotDistance * scale);
          if (dotCoverage === 0) continue;
          const outlineCoverage =
            OUTLINE_OPACITY * clamp((dotDistance + outlineWidth) * scale + 0.5);
          for (let channel = 0; channel < 3; channel++) {
            const fill =
              palette[dot][channel] +
              (surface[channel] - palette[dot][channel]) * outlineCoverage;
            color[channel] += (fill - color[channel]) * dotCoverage;
          }
        }
      }

      const offset = (y * width + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        pixels[offset + channel] = Math.round(clamp(color[channel]) * 255);
      }
      pixels[offset + 3] = Math.round(cardCoverage * 255);
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
  // URLs from earlier embeds still resolve, to the current design.
  const token = url.pathname.match(
    /^\/theme-preview\/v[1-6]\/([A-Za-z0-9_-]+)\.png$/,
  )?.[1];
  const decoded = token ? decodeThemeToken(token) : null;
  const theme = decoded?.kind === "current" ? decoded.theme : decoded?.preview;
  if (!token || !theme) return new Response("Unknown theme", { status: 404 });

  // Key on the current path alone, so aliases share one entry and query
  // strings can't force fresh renders.
  const cacheKey = new Request(`${url.origin}${themePreviewPath(token)}`);
  const cache = (caches as CacheStorage & { default: Cache }).default;
  const cached = await cache.match(cacheKey);
  if (cached) return reply(cached);

  const png = await encodePNG(renderThemePreview(theme));
  const init = {
    headers: {
      // The token is the whole theme, so a versioned preview never changes.
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/png",
      "X-Content-Type-Options": "nosniff",
    },
  };
  ctx.waitUntil(cache.put(cacheKey, new Response(png, init)));
  return reply(new Response(png, init));
}
