/**
 * Extracts the official Seed Code logo from img/seedcode.ico into public/:
 *   - public/logo.ico  (verbatim copy of the official icon)
 *   - public/logo.png  (largest frame, decoded to PNG)
 *   - public/logo.svg  (SVG wrapper embedding the official PNG — never a redrawn logo)
 *
 * Pure Node — no external dependencies. Handles PNG-encoded and BMP-encoded
 * (32/24-bit and 8-bit palette) ICO entries.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const icoPath = join(root, "img", "seedcode.ico");
const publicDir = join(root, "public");
mkdirSync(publicDir, { recursive: true });

const ico = readFileSync(icoPath);
if (ico.readUInt16LE(0) !== 0 || ico.readUInt16LE(2) !== 1) {
  throw new Error("img/seedcode.ico is not a valid ICO file");
}

const count = ico.readUInt16LE(4);
const entries = [];
for (let i = 0; i < count; i++) {
  const off = 6 + i * 16;
  entries.push({
    width: ico[off] === 0 ? 256 : ico[off],
    height: ico[off + 1] === 0 ? 256 : ico[off + 1],
    size: ico.readUInt32LE(off + 8),
    offset: ico.readUInt32LE(off + 12),
  });
}
entries.sort((a, b) => b.width * b.height - a.width * a.height);
const best = entries[0];
const data = ico.subarray(best.offset, best.offset + best.size);

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Encode raw RGBA pixels as a PNG buffer. */
function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw, { level: 9 });

  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c >>> 0;
  }
  const crc32 = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, body) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(body.length);
    const typeBuf = Buffer.from(type, "ascii");
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, body])));
    return Buffer.concat([len, typeBuf, body, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  return Buffer.concat([
    PNG_SIG,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Decode a BMP-encoded ICO entry (DIB) to { width, height, rgba }. */
function decodeDib(buf) {
  const headerSize = buf.readUInt32LE(0);
  const width = buf.readInt32LE(4);
  const heightRaw = buf.readInt32LE(8); // includes AND mask (doubled)
  const height = Math.abs(heightRaw) / 2;
  const bpp = buf.readUInt16LE(14);
  const compression = buf.readUInt32LE(16);
  if (compression !== 0) throw new Error(`Unsupported DIB compression: ${compression}`);

  let pos = headerSize;
  let palette = null;
  if (bpp <= 8) {
    let colors = buf.readUInt32LE(32);
    if (colors === 0) colors = 1 << bpp;
    palette = [];
    for (let i = 0; i < colors; i++) {
      palette.push([buf[pos + 2], buf[pos + 1], buf[pos]]); // BGR → RGB
      pos += 4;
    }
  }

  const rowSize = Math.ceil((width * bpp) / 32) * 4;
  const xorSize = rowSize * height;
  const andRowSize = Math.ceil(width / 32) * 4;
  const andOffset = pos + xorSize;

  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const srcY = height - 1 - y; // DIB rows are bottom-up
    for (let x = 0; x < width; x++) {
      const di = (y * width + x) * 4;
      let r, g, b, a;
      if (bpp === 32) {
        const si = pos + srcY * rowSize + x * 4;
        b = buf[si]; g = buf[si + 1]; r = buf[si + 2]; a = buf[si + 3];
      } else if (bpp === 24) {
        const si = pos + srcY * rowSize + x * 3;
        b = buf[si]; g = buf[si + 1]; r = buf[si + 2]; a = 255;
      } else if (bpp === 8) {
        const idx = buf[pos + srcY * rowSize + x];
        [r, g, b] = palette[idx]; a = 255;
      } else if (bpp === 4) {
        const byte = buf[pos + srcY * rowSize + (x >> 1)];
        const idx = x % 2 === 0 ? byte >> 4 : byte & 0x0f;
        [r, g, b] = palette[idx]; a = 255;
      } else {
        throw new Error(`Unsupported bit depth: ${bpp}`);
      }
      if (bpp !== 32) {
        // Apply the AND (transparency) mask
        const maskByte = buf[andOffset + srcY * andRowSize + (x >> 3)];
        if ((maskByte >> (7 - (x % 8))) & 1) a = 0;
      }
      rgba[di] = r; rgba[di + 1] = g; rgba[di + 2] = b; rgba[di + 3] = a;
    }
  }
  return { width, height, rgba };
}

let png;
let pngWidth = best.width;
let pngHeight = best.height;
if (data.subarray(0, 8).equals(PNG_SIG)) {
  png = Buffer.from(data);
  pngWidth = data.readUInt32BE(16);
  pngHeight = data.readUInt32BE(20);
} else {
  const { width, height, rgba } = decodeDib(data);
  pngWidth = width;
  pngHeight = height;
  png = encodePng(width, height, rgba);
}

writeFileSync(join(publicDir, "logo.png"), png);
writeFileSync(join(publicDir, "logo.ico"), ico);

// SVG wrapper embedding the official raster — preserves the real logo exactly.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${pngWidth}" height="${pngHeight}" viewBox="0 0 ${pngWidth} ${pngHeight}" role="img" aria-label="Seed Code CLI logo">
  <title>Seed Code CLI</title>
  <image width="${pngWidth}" height="${pngHeight}" xlink:href="data:image/png;base64,${png.toString("base64")}"/>
</svg>
`;
writeFileSync(join(publicDir, "logo.svg"), svg);

console.log(`Extracted ${pngWidth}x${pngHeight} logo → public/logo.png, public/logo.svg, public/logo.ico`);
