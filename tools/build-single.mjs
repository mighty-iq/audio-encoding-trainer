#!/usr/bin/env node
// Builds dist/earshot.html: one self-contained file that runs offline from disk, on GitHub Pages, on phones and
// inside a sandboxed srcdoc preview. Stylesheets are inlined with fonts as data URIs; every script that
// index.html lists (core, data, audio packs, audio, engine, lab, game, exercises, screens, app) is inlined in
// order. Nothing is fetched at run time.
// Usage: node tools/build-single.mjs [--test] [--out dist/earshot.html] [--srcdoc]
//   --test    playtest build (window.ES_CONFIG = { testBuild: true })
//   --srcdoc  also write <out>.srcdoc.html: a host page that runs the build in a sandboxed srcdoc iframe
//             (allow-scripts only: opaque origin, storage blocked) for previews and tests
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIMIT_WARN = 12e6, LIMIT_FAIL = 16 * 1024 * 1024;
const MIME = { '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg' };

function arg(name, dflt) {
  const i = process.argv.indexOf(name);
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : dflt;
}
const has = (name) => process.argv.includes(name);
const warnings = [];

function inlineCss(href) {
  const abs = path.join(ROOT, href);
  if (!fs.existsSync(abs)) { warnings.push('missing stylesheet ' + href); return ''; }
  return fs.readFileSync(abs, 'utf8').replace(/url\((['"]?)([^)'"]+)\1\)/g, (m, q, u) => {
    if (/^(data:|https?:|#)/.test(u)) return m;
    const file = path.resolve(path.dirname(abs), u);
    if (!fs.existsSync(file)) { warnings.push('missing asset ' + path.relative(ROOT, file)); return m; }
    const mime = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    return 'url(data:' + mime + ';base64,' + fs.readFileSync(file).toString('base64') + ')';
  });
}
/** Keep inline script text from ending the <script> element or opening an HTML comment. */
function safeScript(code) { return code.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--'); }

export function build(opts = {}) {
  let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  let scripts = 0, bytesJs = 0;
  // The single file is never installed as an app (js/core/pwa.js registers no worker for inline scripts): no manifest
  // or home-screen icon link, which would point at files it does not carry.
  html = html.replace(/<link rel="(?:manifest|apple-touch-icon)"[^>]*>\n?/g, '');
  html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => '<style>\n' + inlineCss(href) + '\n</style>');
  html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
    const abs = path.join(ROOT, src);
    if (!fs.existsSync(abs)) { warnings.push('missing script ' + src); return ''; }
    const code = fs.readFileSync(abs, 'utf8');
    scripts++; bytesJs += code.length;
    return '<script>/* ' + src + ' */\n' + safeScript(code) + '\n</script>';
  });
  if (opts.test) html = html.replace('<!-- scripts:begin -->', '<!-- scripts:begin -->\n<script>window.ES_CONFIG = Object.assign(window.ES_CONFIG || {}, { testBuild: true });</script>');
  html = html.replace(/<!-- scripts:(begin|end) -->\n?/g, '');
  return { html, scripts, bytesJs };
}
function srcdocHost(html) {
  const esc = html.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Earshot (sandboxed preview)</title><style>html,body{margin:0;height:100%;background:#111}iframe{border:0;width:100%;height:100%;display:block}</style></head>' +
    '<body><iframe sandbox="allow-scripts" title="Earshot" srcdoc="' + esc + '"></iframe></body></html>';
}

function main() {
  const out = path.resolve(ROOT, arg('--out', 'dist/earshot.html'));
  const res = build({ test: has('--test') });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, res.html);
  const size = Buffer.byteLength(res.html);
  console.log(path.relative(ROOT, out) + ': ' + (size / 1e6).toFixed(2) + ' MB, ' + res.scripts + ' scripts' + (has('--test') ? ', test build' : ''));
  if (has('--srcdoc')) {
    const host = out.replace(/\.html$/, '') + '.srcdoc.html';
    fs.writeFileSync(host, srcdocHost(res.html));
    console.log(path.relative(ROOT, host) + ': sandboxed srcdoc host');
  }
  warnings.forEach((w) => console.warn('warning: ' + w));
  if (size > LIMIT_FAIL) { console.error('error: larger than 16 MiB (the artifact limit)'); process.exitCode = 1; }
  else if (size > LIMIT_WARN) console.warn('warning: larger than the 12 MB budget');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
