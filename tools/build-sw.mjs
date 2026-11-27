#!/usr/bin/env node
// Writes the precache block of sw.js (between `// precache:begin` and `// precache:end`): every file the app loads
// (index.html; its stylesheets and the files they use; every script of its script block; the manifest and its
// icons; the apple-touch-icon), each with the first 16 hex digits of its SHA-256, and VERSION, a hash of that list
// and of the worker's own code (sw.js outside the block), which names the cache. sw.js itself is not precached.
// Usage: node tools/build-sw.mjs                 rewrite sw.js from the files on disk
//        node tools/build-sw.mjs --check         exit 1 when sw.js is stale or a listed file is missing
//        node tools/build-sw.mjs --rev REV       read the files from commit REV (sw.js itself from the disk) and
//                                                rewrite sw.js: what the next commit of sw.js needs on top of REV
//        node tools/build-sw.mjs --check --rev REV   check commit REV as it is (the pre-push hook checks HEAD,
//                                                so other builders' uncommitted edits never decide the result)
//        node tools/build-sw.mjs --list          print the precache list
//        --root DIR                              another copy of the site (the browser test serves one)
// MIT licence.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BEGIN = '// precache:begin', END = '// precache:end';
const LINK_RELS = new Set(['stylesheet', 'manifest', 'apple-touch-icon', 'icon', 'shortcut icon', 'mask-icon']);

/** A reader of repository-relative paths from a folder: rel → Buffer, or null when missing. */
export function diskReader(root = ROOT) {
  const cache = new Map();
  return (rel) => {
    if (!cache.has(rel)) {
      const abs = path.join(root, rel);
      let buf = null;
      try { buf = fs.statSync(abs).isFile() ? fs.readFileSync(abs) : null; } catch (e) { buf = null; }
      cache.set(rel, buf);
    }
    return cache.get(rel);
  };
}
/** A reader of paths at a git revision (`git cat-file --batch`, prefetched in bulk with reader.prefetch). */
export function gitReader(rev, root = ROOT) {
  const cache = new Map();
  function batch(rels) {
    const want = rels.filter((r) => !cache.has(r));
    if (!want.length) return;
    const res = spawnSync('git', ['-C', root, 'cat-file', '--batch'], { input: want.map((r) => rev + ':' + r).join('\n') + '\n', maxBuffer: 1 << 30 });
    if (res.status !== 0) throw new Error('git cat-file failed: ' + String(res.stderr));
    const out = res.stdout;
    let at = 0;
    for (const rel of want) {
      const nl = out.indexOf(10, at);
      const head = out.slice(at, nl).toString('utf8');
      at = nl + 1;
      const m = /^[0-9a-f]+ (\w+) (\d+)$/.exec(head);
      if (!m) { cache.set(rel, null); continue; }        // "<rev>:<path> missing"
      const size = +m[2];
      cache.set(rel, m[1] === 'blob' ? out.slice(at, at + size) : null);
      at += size + 1;
    }
  }
  const read = (rel) => { batch([rel]); return cache.get(rel); };
  read.prefetch = batch;
  return read;
}

/** A local reference resolved against the folder of `from`; null for data:, other schemes, // and #. */
function local(ref, from) {
  if (!ref || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref.trim())) return null;
  let p = ref.trim().replace(/[?#].*$/, '');
  try { p = decodeURI(p); } catch (e) { /* keep as written */ }
  const out = path.posix.normalize(path.posix.join(path.posix.dirname(from), p));
  if (out.startsWith('../') || out === '..' || path.posix.isAbsolute(out)) throw new Error(from + ': ' + ref + ' leaves the site folder');
  return out;
}
function attrs(tag) {
  const a = {};
  for (const m of tag.matchAll(/([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) a[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4];
  return a;
}
/** Every file the app loads, in discovery order (index.html first). Throws when a listed file is missing. */
export function precacheList(read) {
  const list = [], seen = new Set(), missing = [];
  const add = (rel, by) => {
    if (!rel || seen.has(rel)) return false;
    seen.add(rel);
    if (read(rel) == null) { missing.push(rel + (by ? ' (from ' + by + ')' : '')); return false; }
    list.push(rel);
    return true;
  };
  if (!add('index.html')) throw new Error('index.html is missing');
  const html = read('index.html').toString('utf8').replace(/<!--[\s\S]*?-->/g, '');
  const refs = [];
  for (const m of html.matchAll(/<(link|script)\b[^>]*>/gi)) {
    const a = attrs(m[0]);
    if (m[1].toLowerCase() === 'script') { if (a.src) refs.push(a.src); continue; }
    const rel = String(a.rel || '').toLowerCase().trim().replace(/\s+/g, ' ');
    if (LINK_RELS.has(rel) && a.href) refs.push(a.href);
  }
  if (read.prefetch) read.prefetch(refs.map((r) => local(r, 'index.html')).filter(Boolean));
  for (const ref of refs) {
    const rel = local(ref, 'index.html');
    if (!add(rel, 'index.html')) continue;
    const text = () => read(rel).toString('utf8');
    if (rel.endsWith('.css')) {
      for (const u of text().matchAll(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/g)) add(local(u[2], rel), rel);
    } else if (rel.endsWith('.webmanifest') || rel.endsWith('manifest.json')) {
      let man;
      try { man = JSON.parse(text()); } catch (e) { throw new Error(rel + ': not valid JSON (' + e.message + ')'); }
      const icons = [].concat(man.icons || [], man.screenshots || [], ...(man.shortcuts || []).map((s) => s.icons || []));
      icons.forEach((i) => add(local(i && i.src, rel), rel));
    }
  }
  if (missing.length) throw new Error('files the app loads are missing: ' + missing.join(', '));
  return list;
}

/** Split sw.js into the code outside the generated block and the block itself. */
export function splitWorker(text) {
  const a = text.indexOf(BEGIN), b = text.indexOf(END);
  if (a < 0 || b < a) throw new Error('sw.js: precache markers not found');
  const eol = text.indexOf('\n', b);
  const end = eol < 0 ? text.length : eol + 1;
  return { before: text.slice(0, a), block: text.slice(a, end), after: text.slice(end) };
}
/** {version, files:[[path, hash]]} from the block of a sw.js text. */
export function parseBlock(text) {
  const { block } = splitWorker(text);
  const v = /var VERSION = '([^']*)';/.exec(block);
  const files = [...block.matchAll(/\['([^']+)', '([0-9a-f]+)'\]/g)].map((m) => [m[1], m[2]]);
  return { version: v ? v[1] : null, files };
}
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

/** The sw.js text for the files `read` gives, with the worker code of `worker` (a sw.js text). */
export function generate(read, worker) {
  const list = precacheList(read);
  if (read.prefetch) read.prefetch(list);
  const files = list.map((rel) => [rel, sha(read(rel)).slice(0, 16)]);
  const parts = splitWorker(worker);
  const version = sha('earshot-sw\n' + parts.before + parts.after + '\n' + files.map((f) => f[0] + ' ' + f[1]).join('\n')).slice(0, 12);
  const block = BEGIN + ' (generated by tools/build-sw.mjs; do not edit by hand)\n' +
    "var VERSION = '" + version + "';\n" +
    'var FILES = [\n' + files.map((f) => "  ['" + f[0].replace(/'/g, "\\'") + "', '" + f[1] + "']").join(',\n') + '\n];\n' +
    END + '\n';
  return { list, files, version, text: parts.before + block + parts.after };
}

function main() {
  const argv = process.argv.slice(2);
  const opt = (name) => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null; };
  const root = path.resolve(opt('--root') || ROOT), rev = opt('--rev'), check = argv.includes('--check');
  const where = rev ? 'commit ' + rev : 'the files on disk';
  try {
    const read = rev ? gitReader(rev, root) : diskReader(root);
    if (argv.includes('--list')) { console.log(precacheList(read).join('\n')); return; }
    const current = (check && rev ? read('sw.js') : diskReader(root)('sw.js'));
    if (!current) throw new Error('sw.js is missing' + (check && rev ? ' in ' + where : ''));
    const out = generate(read, current.toString('utf8'));
    if (check) {
      if (out.text !== current.toString('utf8')) {
        console.error('sw.js is stale for ' + where + ': run node tools/build-sw.mjs' + (rev ? ' --rev ' + rev : '') + ' and commit sw.js');
        process.exit(1);
      }
      console.log('sw.js is up to date for ' + where + ' (' + out.files.length + ' files, version ' + out.version + ')');
      return;
    }
    const file = path.join(root, 'sw.js');
    const changed = out.text !== current.toString('utf8');
    if (changed) fs.writeFileSync(file, out.text);
    console.log('sw.js: ' + out.files.length + ' files from ' + where + ', version ' + out.version + (changed ? ' (updated)' : ' (unchanged)'));
  } catch (e) {
    console.error('build-sw: ' + e.message);
    process.exit(e.message.includes('missing') ? 1 : 2);
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
