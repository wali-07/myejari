// One-shot script to recolor the original logo.jpg (white text on orange)
// into logo-black.png and logo-white.png with transparent backgrounds.
// Run with: node scripts/recolor-logo.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const INPUT = "public/logo.jpg";
const OUT_DIR = "public";

await mkdir(OUT_DIR, { recursive: true });

const img = sharp(INPUT);
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

// Map source luminance → alpha. White (lum 255) = opaque, orange (lum ~129) = transparent.
function makeColored(rTarget, gTarget, bTarget) {
  const out = Buffer.alloc(width * height * 4);
  const LUM_MIN = 130; // orange luminance ≈ 129
  const LUM_MAX = 255; // pure white
  for (let i = 0; i < width * height; i++) {
    const r = data[i * channels];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const t = Math.max(0, Math.min(1, (lum - LUM_MIN) / (LUM_MAX - LUM_MIN)));
    out[i * 4] = rTarget;
    out[i * 4 + 1] = gTarget;
    out[i * 4 + 2] = bTarget;
    out[i * 4 + 3] = Math.round(t * 255);
  }
  return out;
}

async function writeRecoloured(targetRgb, outName) {
  const rgba = makeColored(...targetRgb);
  await sharp(rgba, { raw: { width, height, channels: 4 } })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
    .png({ compressionLevel: 9, palette: false })
    .toFile(`${OUT_DIR}/${outName}`);
  console.log(`wrote ${OUT_DIR}/${outName}`);
}

await writeRecoloured([13, 19, 26], "logo-black.png"); // foreground color from brand
await writeRecoloured([255, 255, 255], "logo-white.png");
console.log("done");
