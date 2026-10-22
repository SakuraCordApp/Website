import assert from "node:assert/strict";
import test from "node:test";
import {
  activeColors,
  decodeThemeToken,
  previewAppearance,
  renderedRGB,
  rgbHex,
  themeName,
} from "../app/lib/theme-link.ts";

// Vectors from the app's AppearanceSettingsTests and
// MessagePresentationSettingsTests. Expected colours were computed
// independently with Python's colorsys from the app's formulas.
const GOLDEN = "AQJKz_VpjwzNszNAALhRczO9cP__yjw";
const tolerance = 1 / 65_535;

function current(token) {
  const decoded = decodeThemeToken(token);
  assert.equal(decoded?.kind, "current");
  return decoded.theme;
}

function palette(theme, appearance = previewAppearance(theme)) {
  return activeColors(theme).map((color) =>
    rgbHex(renderedRGB(theme, color, appearance)),
  );
}

test("decodes the app's golden theme link", () => {
  const theme = current(GOLDEN);
  assert.equal(theme.appearance, "dark");
  assert.equal(theme.activeColorCount, 3);
  assert.equal(theme.colors.length, 3);
  assert.equal(theme.windowOpacity, 1);
  assert.ok(Math.abs(theme.intensity - 0.812345) <= tolerance);
  assert.ok(Math.abs(theme.brightness - 0.412345) <= tolerance);
  const expected = [
    [0.05, 0.7],
    [0.25, 0.72],
    [0.45, 0.74],
  ];
  theme.colors.forEach((color, index) => {
    assert.ok(Math.abs(color.hue - expected[index][0]) <= tolerance);
    assert.ok(Math.abs(color.saturation - expected[index][1]) <= tolerance);
  });
});

test("older theme links decode to the same theme", () => {
  const golden = current(GOLDEN);
  assert.deepEqual(current("AQFKz_VpjwzNszNAALhRczO9cEn9"), golden);

  const withInactive = current("AQGKz_VpjwzNszNAALhRczO9cKZmwo_Zmcet62c");
  assert.equal(withInactive.activeColorCount, 3);
  assert.equal(withInactive.colors.length, 5);
  assert.equal(withInactive.windowOpacity, 1);
  assert.deepEqual(activeColors(withInactive), activeColors(golden));
});

test("rejects corrupted and malformed theme links", () => {
  const corrupted = `${GOLDEN.slice(0, 8)}A${GOLDEN.slice(9)}`;
  for (const token of [
    corrupted,
    "",
    "A",
    "AQJKz_VpjwzNszNAALhRczO9cP__yjw=",
    "AQJKz+VpjwzNszNAALhRczO9cP__yjw",
    `${GOLDEN}AA`,
    "A".repeat(257),
  ]) {
    assert.equal(decodeThemeToken(token), null, token);
  }
});

test("future theme links keep a preview or ask for an update", () => {
  const future = decodeThemeToken("AQMBAAD__-vvrh7__5qp");
  assert.equal(future?.kind, "requiresNewerClient");
  assert.equal(future.preview.appearance, "light");
  assert.equal(future.preview.activeColorCount, 1);
  assert.deepEqual(palette(future.preview), ["#ff9aca"]);

  assert.deepEqual(decodeThemeToken("AgICAAD__-vvrh7__y6D"), {
    kind: "requiresNewerClient",
    preview: null,
  });
});

test("palette colors match SakuraCord's rendered theme colors", () => {
  const golden = current(GOLDEN);
  assert.deepEqual(palette(golden, "dark"), ["#8d543c", "#638d3a", "#378d73"]);
  assert.deepEqual(palette(golden, "light"), [
    "#d1957c",
    "#a5d17a",
    "#77d1b6",
  ]);
  assert.deepEqual(palette(current("AQJK1wnCjwUfszNXCrhRq4S9cP__dHY")), [
    "#d76a5b",
    "#58d75d",
    "#5754d7",
  ]);

  const light = current("AQIluFHhRx64v_-UetHra4WlLw");
  assert.equal(previewAppearance(light), "light");
  assert.ok(Math.abs(light.windowOpacity - 0.42) <= tolerance);
  assert.deepEqual(palette(light), ["#f5d78b", "#81bdf5"]);

  // Brightness zero is a real black endpoint in dark mode.
  assert.deepEqual(palette(current("AQIm__8AAF640eteuNHr__-l4w")), [
    "#000000",
    "#000000",
  ]);
  // A stored hue of 1.0 wraps to red, like SakuraCordThemeColor.
  const wrapped = current("AQICAAD_____gAD__zQv");
  assert.equal(wrapped.colors[0].hue, 0);
  assert.deepEqual(palette(wrapped), ["#ff9696"]);
});

test("names themes by their colors", () => {
  assert.equal(themeName(current(GOLDEN)), "Orange, Green & Teal");
  assert.equal(themeName(decodeThemeToken("AQMBAAD__-vvrh7__5qp").preview), "Pink");
});
