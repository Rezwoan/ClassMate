// Generates the PWA PNG icons (no native deps) matching public/icon.svg.
// Run: node scripts/generate-icons.mjs
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "public");

const BRAND = [91, 91, 214, 255];
const WHITE = [255, 255, 255, 255];
const CORAL = [255, 138, 91, 255];
const GRAY = [215, 211, 204, 255];

function canvas(size) {
  return { size, buf: Buffer.alloc(size * size * 4) }; // transparent
}

function setPx(c, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= c.size || y >= c.size) return;
  const i = (y * c.size + x) * 4;
  c.buf[i] = r;
  c.buf[i + 1] = g;
  c.buf[i + 2] = b;
  c.buf[i + 3] = a;
}

// Fill a rounded rectangle using fractional coords (0..1 of canvas size).
function rrect(c, fx, fy, fw, fh, fr, color) {
  const S = c.size;
  const x0 = fx * S,
    y0 = fy * S,
    x1 = (fx + fw) * S,
    y1 = (fy + fh) * S,
    r = fr * S;
  for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
    for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
      const cx = Math.min(Math.max(x + 0.5, x0 + r), x1 - r);
      const cy = Math.min(Math.max(y + 0.5, y0 + r), y1 - r);
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r * r + 0.5) setPx(c, x, y, color);
    }
  }
}

function drawIcon(size, { maskable }) {
  const c = canvas(size);
  if (maskable) rrect(c, 0, 0, 1, 1, 0, BRAND); // full bleed for the safe zone
  else rrect(c, 0, 0, 1, 1, 0.2266, BRAND); // rounded app icon
  // agenda card
  rrect(c, 0.2402, 0.2598, 0.5195, 0.4805, 0.0703, WHITE);
  rrect(c, 0.2949, 0.3242, 0.4102, 0.0781, 0.0391, CORAL);
  rrect(c, 0.2949, 0.4531, 0.332, 0.043, 0.0215, GRAY);
  rrect(c, 0.2949, 0.5391, 0.2734, 0.043, 0.0215, GRAY);
  rrect(c, 0.2949, 0.625, 0.3711, 0.043, 0.0215, GRAY);
  return c;
}

// ---- minimal PNG encoder (RGBA) ----
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(c) {
  const { size, buf } = c;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    buf.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const targets = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "icon-512-maskable.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: true },
];

for (const t of targets) {
  const png = encodePNG(drawIcon(t.size, { maskable: t.maskable }));
  fs.writeFileSync(path.join(OUT, t.file), png);
  console.log(`✓ ${t.file} (${t.size}×${t.size}, ${png.length} bytes)`);
}
