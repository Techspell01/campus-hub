/**
 * Renders the app icon at every size the platforms ask for.
 *
 *   npm run icons
 *
 * Written as a build-time script rather than Next's runtime `ImageResponse`
 * so the icons are ordinary committed files: no per-request rendering, and
 * they can be inspected in a diff.
 *
 * The mark is the same sparkle the app uses as its brand, on the same deep
 * space it uses as a backdrop.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

/** A four-pointed sparkle with concave sides, centred in a 512 box. */
const SPARKLE =
  "M256 104 C270 190 322 242 408 256 C322 270 270 322 256 408 " +
  "C242 322 190 270 104 256 C190 242 242 190 256 104 Z";

/** Small stars scattered behind the mark: [x, y, radius, opacity]. */
const STARS = [
  [86, 132, 4, 0.9],
  [140, 392, 3, 0.65],
  [402, 130, 3.5, 0.75],
  [430, 386, 4.5, 0.85],
  [318, 78, 2.5, 0.5],
  [96, 268, 2.5, 0.45],
  [214, 452, 2.5, 0.5],
  [452, 240, 2.5, 0.4],
];

/**
 * @param {number} scale  1 fills the tile; 0.62 keeps the mark inside the
 *                        safe circle Android crops maskable icons to.
 */
function svg(scale = 1) {
  const offset = (512 - 512 * scale) / 2;

  const stars = STARS.map(
    ([x, y, r, o]) =>
      `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${o}"/>`,
  ).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="sky" cx="50%" cy="38%" r="78%">
      <stop offset="0%" stop-color="#101a33"/>
      <stop offset="55%" stop-color="#05070f"/>
      <stop offset="100%" stop-color="#000001"/>
    </radialGradient>
    <linearGradient id="mark" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#a5e5ff"/>
      <stop offset="45%" stop-color="#4aa8ff"/>
      <stop offset="100%" stop-color="#3b5bdb"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="26" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Full bleed: iOS and Android apply their own rounding and would show
       transparent corners as white. -->
  <rect width="512" height="512" fill="url(#sky)"/>
  ${stars}

  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <path d="${SPARKLE}" fill="#4aa8ff" opacity="0.5" filter="url(#glow)"/>
    <path d="${SPARKLE}" fill="url(#mark)"/>
  </g>
</svg>`;
}

const OUTPUTS = [
  // Next serves these two automatically from the app directory.
  { file: "src/app/icon.png", size: 256, scale: 1 },
  { file: "src/app/apple-icon.png", size: 180, scale: 1 },
  // Referenced by the web manifest.
  { file: "public/icon-192.png", size: 192, scale: 1 },
  { file: "public/icon-512.png", size: 512, scale: 1 },
  // Android crops maskable icons to a circle, so the mark is pulled inward.
  { file: "public/icon-maskable-512.png", size: 512, scale: 0.62 },
];

mkdirSync("public", { recursive: true });

for (const { file, size, scale } of OUTPUTS) {
  const png = await sharp(Buffer.from(svg(scale)))
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();

  writeFileSync(file, png);
  console.log(`  ${file.padEnd(34)} ${size}×${size}  ${png.length} bytes`);
}

console.log("Icons written.");
