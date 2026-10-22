// Port of SakuraCord's theme link codec and theme colour math. Keep this in
// step with the app's ThemeSharingServices.swift and ThemeServices.swift; the
// tests pin it to the app's own test vectors.

export type ThemeAppearance = "light" | "dark";
export type SharedThemeAppearance = "system" | ThemeAppearance;

export interface ThemeColor {
  hue: number;
  saturation: number;
}

export interface RGB {
  red: number;
  green: number;
  blue: number;
}

export interface SharedTheme {
  appearance: SharedThemeAppearance;
  colors: ThemeColor[];
  activeColorCount: number;
  intensity: number;
  brightness: number;
  windowOpacity: number;
}

export type ThemeDecodeResult =
  | { kind: "current"; theme: SharedTheme }
  | { kind: "requiresNewerClient"; preview: SharedTheme | null };

const TRANSPORT_VERSION = 1;
const READER_VERSION = 2;
const MAXIMUM_TOKEN_LENGTH = 256;
const MAXIMUM_COLOR_COUNT = 5;
const DEFAULT_WINDOW_OPACITY = 1;
const APPEARANCES: SharedThemeAppearance[] = ["system", "light", "dark"];

export const clamp = (value: number, lower = 0, upper = 1) =>
  Math.min(Math.max(value, lower), upper);

function crc16(bytes: Uint8Array): number {
  let checksum = 0xffff;
  for (const byte of bytes) {
    checksum ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) {
      checksum =
        checksum & 0x8000 ? ((checksum << 1) ^ 0x1021) & 0xffff : (checksum << 1) & 0xffff;
    }
  }
  return checksum;
}

function base64URLDecode(token: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(token)) return null;
  const base64 = token.replaceAll("-", "+").replaceAll("_", "/");
  try {
    const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

export function decodeThemeToken(token: string): ThemeDecodeResult | null {
  if (!token || token.length > MAXIMUM_TOKEN_LENGTH) return null;
  const bytes = base64URLDecode(token);
  if (!bytes?.length) return null;

  const version = bytes[0];
  if (version > TRANSPORT_VERSION) {
    return { kind: "requiresNewerClient", preview: null };
  }
  if (version !== TRANSPORT_VERSION || bytes.length < 3 + 2 * 4 + 2) {
    return null;
  }

  const minimumReaderVersion = bytes[1];
  const flags = bytes[2];
  const storedColorCount = ((flags >> 5) & 0b111) + 1;
  const activeColorCount = ((flags >> 2) & 0b111) + 1;
  const appearance = APPEARANCES[flags & 0b11];
  if (
    minimumReaderVersion === 0 ||
    !appearance ||
    storedColorCount > MAXIMUM_COLOR_COUNT ||
    activeColorCount > storedColorCount
  ) {
    return null;
  }

  const knownPayloadEnd =
    3 + 2 * 2 + storedColorCount * 4 + (minimumReaderVersion >= 2 ? 2 : 0);
  if (bytes.length < knownPayloadEnd + 2) return null;
  const checksumIndex = bytes.length - 2;
  if (
    minimumReaderVersion <= READER_VERSION &&
    checksumIndex !== knownPayloadEnd
  ) {
    return null;
  }
  const checksum = (bytes[checksumIndex] << 8) | bytes[checksumIndex + 1];
  if (checksum !== crc16(bytes.subarray(0, checksumIndex))) return null;

  let offset = 3;
  const scalar = () => {
    const value = ((bytes[offset] << 8) | bytes[offset + 1]) / 65_535;
    offset += 2;
    return value;
  };
  const intensity = scalar();
  const brightness = scalar();
  const colors: ThemeColor[] = [];
  for (let index = 0; index < storedColorCount; index++) {
    // SakuraCordThemeColor normalises the hue, so a stored 1.0 becomes 0.
    colors.push({ hue: scalar() % 1, saturation: scalar() });
  }
  // Version 1 predates window opacity and represents the original opaque theme.
  const windowOpacity =
    minimumReaderVersion >= 2 ? scalar() : DEFAULT_WINDOW_OPACITY;

  const theme = {
    appearance,
    colors,
    activeColorCount,
    intensity,
    brightness,
    windowOpacity,
  };
  return minimumReaderVersion > READER_VERSION
    ? { kind: "requiresNewerClient", preview: theme }
    : { kind: "current", theme };
}

// A compact version of the in-chat theme link card (SakuraCordDeepLinkSupport
// .swift, NativeTimelineRowPainterMessage.swift), in points at 4px per point.
// Dots overlap by a third with an outline of 1/15 their size, like the app's.
// Discord's media gallery fills a box whose ratio differs slightly from the
// image's, cropping a few percent off either axis, so a transparent margin
// keeps the card itself whole.
export const THEME_CARD = {
  scale: 4,
  width: 360,
  height: 44,
  marginX: 20,
  marginY: 4,
  inset: 10,
  cornerRadius: 11,
  borderWidth: 1,
  dotDiameter: 24,
  dotStep: 16,
  outlineWidth: 1.6,
  buttonWidth: 150,
  buttonHeight: 28,
};

export const THEME_PREVIEW_SIZE = {
  width: (THEME_CARD.width + THEME_CARD.marginX * 2) * THEME_CARD.scale,
  height: (THEME_CARD.height + THEME_CARD.marginY * 2) * THEME_CARD.scale,
};

export function themePreviewPath(token: string) {
  return `/theme-preview/v5/${token}.png`;
}

export function activeColors(theme: SharedTheme): ThemeColor[] {
  return theme.colors.slice(0, theme.activeColorCount);
}

// The appearance the theme applies when opened. System themes have no fixed
// appearance, so previews use dark, Discord's default.
export function previewAppearance(theme: SharedTheme): ThemeAppearance {
  return theme.appearance === "light" ? "light" : "dark";
}

function hsbToRGB(
  hue: number,
  saturation: number,
  brightness: number,
): RGB {
  const normalizedHue = ((hue % 1) + 1) % 1;
  saturation = clamp(saturation);
  brightness = clamp(brightness);
  const sector = normalizedHue * 6;
  const fraction = sector - Math.floor(sector);
  const minimum = brightness * (1 - saturation);
  const descending = brightness * (1 - fraction * saturation);
  const ascending = brightness * (1 - (1 - fraction) * saturation);
  const rgb = (red: number, green: number, blue: number) => ({
    red,
    green,
    blue,
  });
  switch (Math.floor(sector) % 6) {
    case 0:
      return rgb(brightness, ascending, minimum);
    case 1:
      return rgb(descending, brightness, minimum);
    case 2:
      return rgb(minimum, brightness, ascending);
    case 3:
      return rgb(minimum, descending, brightness);
    case 4:
      return rgb(ascending, minimum, brightness);
    default:
      return rgb(brightness, minimum, descending);
  }
}

function renderedBrightness(
  theme: SharedTheme,
  appearance: ThemeAppearance,
): number {
  const { brightness } = theme;
  if (appearance === "dark") {
    const midpoint = 0.67;
    return brightness <= 0.5
      ? (midpoint * brightness) / 0.5
      : midpoint + ((1 - midpoint) * (brightness - 0.5)) / 0.5;
  }
  const minimum = 0.72;
  const midpoint = 0.84;
  return brightness <= 0.5
    ? minimum + ((midpoint - minimum) * brightness) / 0.5
    : midpoint + ((1 - midpoint) * (brightness - 0.5)) / 0.5;
}

// The palette colour SakuraCord draws for theme link cards and gradients.
export function renderedRGB(
  theme: SharedTheme,
  color: ThemeColor,
  appearance: ThemeAppearance,
): RGB {
  return hsbToRGB(
    color.hue,
    color.saturation * (appearance === "dark" ? 0.82 : 0.58),
    renderedBrightness(theme, appearance),
  );
}

export function rgbHex({ red, green, blue }: RGB): string {
  return `#${[red, green, blue]
    .map((component) =>
      Math.round(clamp(component) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

const HUE_NAMES: Array<[number, string]> = [
  [15, "Red"],
  [40, "Orange"],
  [55, "Amber"],
  [70, "Yellow"],
  [90, "Lime"],
  [150, "Green"],
  [175, "Teal"],
  [195, "Cyan"],
  [220, "Sky"],
  [245, "Blue"],
  [265, "Indigo"],
  [290, "Violet"],
  [320, "Magenta"],
  [345, "Pink"],
];

function colorName(color: ThemeColor): string {
  if (color.saturation < 0.12) return "Gray";
  const degrees = color.hue * 360;
  return HUE_NAMES.find(([limit]) => degrees < limit)?.[1] ?? "Red";
}

// SakuraCord themes carry no name, so describe them by their colours.
export function themeName(theme: SharedTheme): string {
  const names = activeColors(theme)
    .map(colorName)
    .filter((name, index, all) => name !== all[index - 1]);
  return names.length > 1
    ? `${names.slice(0, -1).join(", ")} & ${names.at(-1)}`
    : names[0];
}
