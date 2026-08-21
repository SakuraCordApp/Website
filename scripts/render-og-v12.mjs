import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const publicDirectory = path.join(root, "public");
const mediaDirectory = path.join(publicDirectory, "media");

const desktopPath = path.join(mediaDirectory, "sakuracord-desktop-background.png");
const clientPath = path.join(mediaDirectory, "sakuracord-client-preview.webp");
const screenPath = path.join(mediaDirectory, "sakuracord-macbook-screen.png");
const hardwarePath = path.join(mediaDirectory, "macbook-shell", "hardware-dark-2x.avif");
const hardwareMaskPath = path.join(
  mediaDirectory,
  "macbook-shell",
  "hardware-shape-mask-2x.avif",
);
const screenMaskPath = path.join(
  mediaDirectory,
  "macbook-shell",
  "screen-mask-2x.avif",
);
const devicePath = path.join(mediaDirectory, "sakuracord-macbook-device-real.png");
const sourcePath = path.join(publicDirectory, "og-v12-source.svg");
const outputPath = path.join(
  publicDirectory,
  "discord-preview-macbook-20260821.png",
);

const screenWidth = 2560;
const screenHeight = 1600;
const clientWidth = 2400;
const clientLeft = Math.round((screenWidth - clientWidth) / 2);
// Match the app's side clearance to the gap below the physical notch tip.
// The 80px desktop side margin scales to 61.5px in Mythic's display slot;
// its notch ends at y=37px, yielding a desktop-space top of about 128px.
const clientTop = 128;

const desktop = await sharp(desktopPath)
  .resize(screenWidth, screenHeight, { fit: "fill" })
  .png()
  .toBuffer();

const client = await sharp(clientPath)
  .resize({ width: clientWidth })
  .png()
  .toBuffer();

await sharp(desktop)
  .composite([
    { input: client, left: clientLeft, top: clientTop },
  ])
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(screenPath);

// Mythic's display slot is 1968×1272. Width-fitting the complete 16:10 desktop
// produces a 1968×1230 image, so all 42 unused pixels belong at the bottom.
// The original screen mask then restores the physical notch and rounded panel.
const widthFittedDesktop = await sharp(screenPath)
  .resize(1968, 1230, { fit: "fill" })
  .png()
  .toBuffer();

const hardwareScreen = await sharp({
  create: {
    width: 1968,
    height: 1272,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 1 },
  },
})
  .composite([
    { input: widthFittedDesktop, left: 0, top: 0 },
    { input: screenMaskPath, blend: "dest-in" },
  ])
  .png()
  .toBuffer();

await sharp(hardwarePath)
  .composite([
    { input: hardwareScreen, left: 224, top: 34 },
    { input: hardwareMaskPath, blend: "dest-in" },
  ])
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(devicePath);

const [source, device, displayFont, textFont] = await Promise.all([
  fs.readFile(sourcePath, "utf8"),
  fs.readFile(devicePath),
  fs.readFile(path.join(publicDirectory, "fonts", "LADisplay-VF.ttf")),
  fs.readFile(path.join(publicDirectory, "fonts", "LAText-VF.ttf")),
]);

const inlinedSource = source
  .replaceAll(
    "media/sakuracord-macbook-device-real.png",
    `data:image/png;base64,${device.toString("base64")}`,
  )
  .replace(
    "fonts/LADisplay-VF.ttf",
    `data:font/ttf;base64,${displayFont.toString("base64")}`,
  )
  .replace(
    "fonts/LAText-VF.ttf",
    `data:font/ttf;base64,${textFont.toString("base64")}`,
  );

await sharp(Buffer.from(inlinedSource), { density: 192 })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(outputPath);

const outputMetadata = await sharp(outputPath).metadata();
console.log(
  `Rendered ${path.relative(root, outputPath)} at ${outputMetadata.width}×${outputMetadata.height}`,
);
