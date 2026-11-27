#!/usr/bin/env node
// Writes the app icons (icons/*.png) from the favicon mark in index.html: the target-like rings around "you" and
// the red dot of the voice to follow. The mark's own shapes and colours are read from the favicon's SVG (rect and
// circle elements), so the icons follow the favicon when it changes. No dependencies: shapes are drawn with
// analytic anti-aliasing (signed distances) and encoded as PNG with node:zlib. No text, no metadata chunks.
//   any       the favicon as it is: rounded square on a transparent canvas (RGBA)
//   maskable  full-bleed square in the background colour, the mark scaled into the central safe zone (RGB)
//   apple     full-bleed square for iOS home screens (iOS masks the corners itself; no transparency) (RGB)
// Usage: node tools/make-icons.mjs           write icons/
//        node tools/make-icons.mjs --check   exit 1 if a file in icons/ differs from what would be written
// MIT licence.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The icon set (the manifest and index.html refer to these files). scale: the mark's size re the favicon. */
export const ICONS = [
  { file: 'icons/icon-192.png', size: 192, variant: 'any' },
  { file: 'icons/icon-512.png', size: 512, variant: 'any' },
  { file: 'icons/icon-maskable-192.png', size: 192, variant: 'full', scale: 0.8 },
  { file: 'icons/icon-maskable-512.png', size: 512, variant: 'full', scale: 0.8 },
  { file: 'icons/apple-touch-icon.png', size: 180, variant: 'full', scale: 0.88 }
];

/** Shapes of the favicon in index.html: { view:[x,y,w,h], shapes:[{type:'rect'|'circle', …, fill, stroke, sw}] }. */
export function readMark(html) {
  const m = /<link rel="icon" href="data:image\/svg\+xml,([^"]+)"/.exec(html);
  if (!m) throw new Error('index.html: no SVG favicon (<link rel="icon" href="data:image/svg+xml,…">)');
  const svg = decodeURIComponent(m[1]);
  const vb = /viewBox=['"]([^'"]+)['"]/.exec(svg);
  const view = (vb ? vb[1] : '0 0 24 24').trim().split(/[\s,]+/).map(Number);
  const shapes = [];
  for (const el of svg.matchAll(/<(rect|circle)\b([^>]*?)\/?>/g)) {
    const a = {};
    for (const at of el[2].matchAll(/([a-zA-Z-]+)=['"]([^'"]*)['"]/g)) a[at[1]] = at[2];
    const paint = (v) => (!v || v === 'none' ? null : rgb(v));
    const base = { fill: a.fill === undefined ? rgb('#000') : paint(a.fill), stroke: paint(a.stroke), sw: +(a['stroke-width'] || 1) };
    if (el[1] === 'rect') shapes.push(Object.assign(base, { type: 'rect', x: +(a.x || 0), y: +(a.y || 0), w: +a.width, h: +a.height, rx: +(a.rx || a.ry || 0) }));
    else shapes.push(Object.assign(base, { type: 'circle', cx: +a.cx, cy: +a.cy, r: +a.r }));
  }
  if (!shapes.length) throw new Error('index.html: the favicon has no rect or circle');
  return { view, shapes };
}
function rgb(hex) {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (!/^[0-9a-f]{6}$/i.test(f)) throw new Error('unsupported colour ' + hex);
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
}

// Signed distance (view units) of point (x, y) to each shape's filled area and to its stroke band.
function sdRoundRect(x, y, s) {
  const hw = s.w / 2, hh = s.h / 2, r = Math.min(s.rx, hw, hh);
  const qx = Math.abs(x - (s.x + hw)) - (hw - r), qy = Math.abs(y - (s.y + hh)) - (hh - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}
function sdCircle(x, y, s) { return Math.hypot(x - s.cx, y - s.cy) - s.r; }

/** RGBA pixels (straight alpha) of one icon. */
export function render(mark, icon) {
  const N = icon.size, out = new Float64Array(N * N * 4);   // premultiplied while compositing
  const [vx, vy, vw, vh] = mark.view, cx = vx + vw / 2, cy = vy + vh / 2;
  const unit = vw / N;                       // view units per pixel (square view)
  let shapes = mark.shapes;
  if (icon.variant === 'full') {
    // The first full-size rect is the background: drawn edge to edge; the rest is the mark, scaled about the centre.
    const bg = shapes[0].type === 'rect' && shapes[0].w >= vw && shapes[0].h >= vh ? shapes[0] : null;
    if (!bg) throw new Error('the favicon has no full-size background rect');
    const k = icon.scale || 1;
    shapes = [{ type: 'rect', x: vx - vw, y: vy - vh, w: vw * 3, h: vh * 3, rx: 0, fill: bg.fill, stroke: null, sw: 0 }].concat(
      shapes.slice(1).map((s) => s.type === 'circle'
        ? Object.assign({}, s, { cx: cx + (s.cx - cx) * k, cy: cy + (s.cy - cy) * k, r: s.r * k, sw: s.sw * k })
        : Object.assign({}, s, { x: cx + (s.x - cx) * k, y: cy + (s.y - cy) * k, w: s.w * k, h: s.h * k, rx: s.rx * k, sw: s.sw * k })));
  }
  const over = (i, col, a) => {
    if (a <= 0) return;
    out[i] = col[0] * a + out[i] * (1 - a); out[i + 1] = col[1] * a + out[i + 1] * (1 - a);
    out[i + 2] = col[2] * a + out[i + 2] * (1 - a); out[i + 3] = a + out[i + 3] * (1 - a);
  };
  const cover = (d) => Math.min(1, Math.max(0, 0.5 - d / unit));   // pixel coverage from a signed distance
  for (let py = 0; py < N; py++) {
    for (let px = 0; px < N; px++) {
      const x = vx + (px + 0.5) * unit, y = vy + (py + 0.5) * unit, i = (py * N + px) * 4;
      for (const s of shapes) {
        const d = s.type === 'rect' ? sdRoundRect(x, y, s) : sdCircle(x, y, s);
        if (s.fill) over(i, s.fill, cover(d));
        if (s.stroke) over(i, s.stroke, cover(Math.abs(d) - s.sw / 2));
      }
    }
  }
  const px = new Uint8Array(N * N * 4);
  for (let i = 0; i < out.length; i += 4) {
    const a = out[i + 3];
    for (let c = 0; c < 3; c++) px[i + c] = a > 0 ? Math.round(Math.min(255, out[i + c] / a)) : 0;
    px[i + 3] = Math.round(a * 255);
  }
  return px;
}

// ---- PNG (8-bit RGBA or RGB, adaptive row filters, no ancillary chunks) ----
const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
export function encodePng(w, h, rgba, alpha) {
  const bpp = alpha ? 4 : 3, stride = w * bpp, raw = Buffer.alloc((stride + 1) * h);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(stride);
    for (let x = 0; x < w; x++) for (let c = 0; c < bpp; c++) row[x * bpp + c] = rgba[(y * w + x) * 4 + c];
    let best = null, bestSum = Infinity;
    for (let f = 0; f < 5; f++) {
      const r = Buffer.alloc(stride);
      for (let i = 0; i < stride; i++) {
        const a = i >= bpp ? row[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        const pred = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f];
        r[i] = (row[i] - pred) & 0xff;
      }
      let sum = 0; for (const v of r) sum += v < 128 ? v : 256 - v;
      if (sum < bestSum) { bestSum = sum; best = [f, r]; }
    }
    raw[y * (stride + 1)] = best[0];
    best[1].copy(raw, y * (stride + 1) + 1);
    prev = row;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = alpha ? 6 : 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
/** {width, height, colourType} from a PNG's IHDR (for tests). */
export function pngInfo(buf) {
  if (buf.length < 33 || buf.readUInt32BE(12) !== 0x49484452) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), colourType: buf[25] };
}

export function build(root = ROOT) {
  const mark = readMark(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
  return ICONS.map((icon) => ({ file: icon.file, bytes: encodePng(icon.size, icon.size, render(mark, icon), icon.variant === 'any') }));
}

function main() {
  const check = process.argv.includes('--check');
  let stale = 0;
  for (const { file, bytes } of build()) {
    const abs = path.join(ROOT, file);
    const same = fs.existsSync(abs) && fs.readFileSync(abs).equals(bytes);
    if (check) { if (!same) { stale++; console.error('stale: ' + file); } continue; }
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    if (!same) fs.writeFileSync(abs, bytes);
    console.log(file + ': ' + bytes.length + ' bytes' + (same ? ' (unchanged)' : ''));
  }
  if (check) {
    if (stale) { console.error('icons are stale: run node tools/make-icons.mjs'); process.exit(1); }
    console.log('icons are up to date (' + ICONS.length + ' files)');
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
