#!/usr/bin/env node
// Regenerates the script block of index.html (between <!-- scripts:begin --> and <!-- scripts:end -->) from the
// files on disk, in the load order of CONTRACTS §9: core → data → audio packs → audio → engine → lab → game →
// ex → ui → screens → app. Each area may pin its own order with `<area>/load-order.txt` (one path per line,
// relative to the area folder, `#` starts a comment, `*` alone = every remaining file in alphabetical order);
// otherwise the defaults below apply and unknown files follow in alphabetical order.
// Usage: node tools/build-index.mjs           rewrite index.html
//        node tools/build-index.mjs --check   exit 1 if index.html is out of date
//        node tools/build-index.mjs --list    print the order
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BEGIN = '<!-- scripts:begin -->', END = '<!-- scripts:end -->';

export const AREAS = [
  { dir: 'js/core', order: ['ns.js', 'util.js', 'rng.js', 'store-schema.js', 'store.js', 'clock.js', 'router.js', 'ui.js', 'field.js', 'answer.js', 'chimera.js', 'playtest.js'] },
  { dir: 'data', order: ['voices.js', 'vocab.js', 'manifest.js', 'packs.js'], shallow: true },
  { dir: 'audio', match: /^pack-[a-z0-9_-]+\.js$/i, shallow: true },
  { dir: 'js/audio', order: ['ctx.js', 'dsp/core.js', 'dsp/fft.js', 'dsp/filter.js', 'dsp/tsm.js', 'dsp/vocode.js', 'dsp/whisper.js', 'dsp/noise.js',
    'dsp/room.js', 'dsp/mix.js', 'dsp/*', 'assets.js', 'render-prep.js', 'render-native.js', 'render.js', 'live.js'] },
  { dir: 'js/engine', order: ['dials.js', 'learner.js', 'items/common.js', 'items/data.js', 'items/crowd.js', 'items/far.js', 'items/strange.js',
    'items/repair.js', 'items/echo.js', 'items/seek.js', 'items/voices.js', 'items/*', 'score.js', 'controller.js', 'path.js', 'plateau.js',
    'planner.js', 'flow.js'] },
  { dir: 'js/lab' },
  { dir: 'js/game' },
  { dir: 'js/ex' },
  { dir: 'js/ui', order: ['sound.js', 'demo.js', 'widgets.js', 'trialview.js', 'session.js', 'tutorial.js', '*', 'screens/*'] },
  { file: 'js/app.js' }
];

function walk(abs, rel, shallow, out) {
  if (!fs.existsSync(abs)) return out;
  for (const ent of fs.readdirSync(abs, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const r = rel ? rel + '/' + ent.name : ent.name;
    if (ent.isDirectory()) { if (!shallow && !ent.name.startsWith('.') && ent.name !== 'node_modules') walk(path.join(abs, ent.name), r, false, out); }
    else if (ent.name.endsWith('.js')) out.push(r);
  }
  return out;
}
function orderFile(dir) {
  const f = path.join(ROOT, dir, 'load-order.txt');
  if (!fs.existsSync(f)) return null;
  return fs.readFileSync(f, 'utf8').split(/\r?\n/).map((l) => l.replace(/#.*/, '').trim()).filter(Boolean);
}
function matches(pattern, rel) {
  if (pattern === '*') return !rel.includes('/');
  if (pattern.endsWith('/*')) { const pre = pattern.slice(0, -1); return rel.startsWith(pre) && !rel.slice(pre.length).includes('/'); }
  return pattern === rel;
}
/** Ordered, repository-relative script paths for one area. */
function areaFiles(area) {
  if (area.file) return fs.existsSync(path.join(ROOT, area.file)) ? [area.file] : [];
  let files = walk(path.join(ROOT, area.dir), '', area.shallow, []);
  if (area.match) files = files.filter((f) => area.match.test(f));
  const order = orderFile(area.dir) || area.order || ['*'];
  const placed = new Set(), out = [];
  const take = (f) => { if (!placed.has(f)) { placed.add(f); out.push(f); } };
  order.forEach((p, i) => {
    if (p === '*' || p.endsWith('/*')) {
      // A wildcard takes what no later explicit entry claims.
      const later = new Set(order.slice(i + 1).filter((q) => !q.includes('*')));
      files.filter((f) => matches(p, f) && !later.has(f)).forEach(take);
    } else if (files.includes(p)) take(p);
  });
  files.forEach(take);
  return out.map((f) => area.dir + '/' + f);
}
export function scriptList() { return AREAS.flatMap(areaFiles); }

export function render(list) {
  return [BEGIN, ...list.map((f) => '<script src="' + f + '"></script>'), END].join('\n');
}
function main() {
  const args = new Set(process.argv.slice(2));
  const list = scriptList();
  if (args.has('--list')) { console.log(list.join('\n')); return; }
  const file = path.join(ROOT, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const a = html.indexOf(BEGIN), b = html.indexOf(END);
  if (a < 0 || b < a) { console.error('index.html: script markers not found'); process.exit(2); }
  const next = html.slice(0, a) + render(list) + html.slice(b + END.length);
  if (args.has('--check')) {
    if (next !== html) { console.error('index.html is out of date: run node tools/build-index.mjs'); process.exit(1); }
    console.log('index.html script block is up to date (' + list.length + ' scripts)');
    return;
  }
  if (next !== html) fs.writeFileSync(file, next);
  console.log('index.html: ' + list.length + ' scripts' + (next === html ? ' (unchanged)' : ' (updated)'));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
