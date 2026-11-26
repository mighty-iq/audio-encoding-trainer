#!/usr/bin/env node
// Unit test runner (CONTRACTS §0). Loads classic scripts into a node:vm context with a minimal `window`
// (events, localStorage shim, location/history stubs, timers) the way the browser loads them, then runs tests.
//
// A test file (tests/unit/*.test.mjs) exports:
//   export const scripts = ['js/core/ns.js', …]        scripts to load (repository-relative, in order), or
//   export function setup(env) { return ES; }          a custom loader (default for engine-*: tests/sim/load.mjs)
//   export const tests = { 'name': fn, … }  or  [{ name, fn }, …]      fn(ES, assert, env); may be async
// Without `scripts` or `setup`, the file gets the default for its prefix (core*, audio*, engine*).
// Tolerant loading: a script that throws while loading fails only the tests of the files that load it, and
// each test file gets a fresh context, so a half-written module never breaks other owners' tests.
// env: { ROOT, win, ES, errors, spawn({storage, scripts}) → {win, ES}, sharedStorage(opts), makeStorage(opts) }.
// Usage: node tests/unit/run.mjs [filter …]    (a filter matches part of a file name)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import nodeAssert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Objects made inside a vm context have that context's prototypes, so node's deep equality would call equal
// structures unequal. The assert given to tests compares deep values after a structured clone into this realm.
const realm = (x) => { try { return structuredClone(x); } catch (e) { return JSON.parse(JSON.stringify(x)); } };
export const assert = Object.assign(function (v, m) { return nodeAssert(v, m); }, nodeAssert, {
  deepEqual: (a, b, m) => nodeAssert.deepStrictEqual(realm(a), realm(b), m),
  deepStrictEqual: (a, b, m) => nodeAssert.deepStrictEqual(realm(a), realm(b), m),
  notDeepEqual: (a, b, m) => nodeAssert.notDeepStrictEqual(realm(a), realm(b), m),
  notDeepStrictEqual: (a, b, m) => nodeAssert.notDeepStrictEqual(realm(a), realm(b), m)
});
const CORE = ['js/core/ns.js', 'js/core/util.js', 'js/core/rng.js', 'js/core/store-schema.js', 'js/core/store.js', 'js/core/clock.js', 'js/core/router.js'];

/** A Storage-like object over a Map; quota in characters (keys + values), like browsers count. */
export function makeStorage(opts = {}) {
  const map = opts.map || new Map();
  const used = () => { let n = 0; for (const [k, v] of map) n += k.length + v.length; return n; };
  const st = {
    _map: map, quota: opts.quota || Infinity, onWrite: null,
    get length() { return map.size; },
    key(i) { return Array.from(map.keys())[i] ?? null; },
    getItem(k) { k = String(k); return map.has(k) ? map.get(k) : null; },
    setItem(k, v) {
      k = String(k); v = String(v);
      const old = map.has(k) ? map.get(k) : null;
      if (used() - (old === null ? 0 : k.length + old.length) + k.length + v.length > st.quota) {
        const e = new Error('The quota has been exceeded.'); e.name = 'QuotaExceededError'; e.code = 22; throw e;
      }
      map.set(k, v);
      if (st.onWrite) st.onWrite(k, old, v);
    },
    removeItem(k) { k = String(k); const old = map.has(k) ? map.get(k) : null; map.delete(k); if (st.onWrite && old !== null) st.onWrite(k, old, null); },
    clear() { map.clear(); if (st.onWrite) st.onWrite(null, null, null); }
  };
  return st;
}
/** One storage shared by several windows: each gets a facade, and writes queue `storage` events for the
    others (delivered by flush(), like a browser delivers them to other tabs). */
export function sharedStorage(opts = {}) {
  const map = new Map(), queue = [], facades = [];
  return {
    map, queue,
    facade(win) {
      const f = makeStorage({ map, quota: opts.quota });
      f.onWrite = (key, oldValue, newValue) => {
        facades.forEach((o) => { if (o.f !== f) queue.push({ win: o.win, ev: { type: 'storage', key, oldValue, newValue, storageArea: o.f } }); });
      };
      facades.push({ f, win });
      return f;
    },
    flush() { while (queue.length) { const { win, ev } = queue.shift(); win.dispatchEvent(ev); } }
  };
}

/** A fresh vm global that looks enough like a browser window for classic scripts without DOM work at load. */
export function makeWindow(opts = {}) {
  const listeners = {};
  const win = {
    console, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, performance: globalThis.performance,
    navigator: { userAgent: 'node', language: 'en', hardwareConcurrency: 2, maxTouchPoints: 0 },
    location: { search: opts.search || '', hash: '', protocol: 'file:', href: 'file:///index.html' },
    history: { replaceState(s, t, url) { if (typeof url === 'string' && url.startsWith('#')) win.location.hash = url; } },
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    removeEventListener(type, fn) { const l = listeners[type] || []; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); },
    dispatchEvent(ev) { (listeners[ev.type] || []).slice().forEach((fn) => fn(ev)); return true; },
    _listeners: listeners
  };
  win.window = win; win.self = win; win.top = win; win.globalThis = win;
  if (opts.config) win.ES_CONFIG = opts.config;
  let storage = opts.storage;
  if (storage === undefined) storage = makeStorage();
  if (storage && typeof storage.facade === 'function') storage = storage.facade(win);
  Object.defineProperty(win, 'localStorage', {
    get() { if (storage === null) { const e = new Error('The document is sandboxed.'); e.name = 'SecurityError'; throw e; } return storage; },
    configurable: true
  });
  vm.createContext(win);
  return win;
}
/** Load scripts into win. Returns the load errors ([{file, error}]); never throws. */
export function loadScripts(win, scripts) {
  const errors = [];
  for (const rel of scripts) {
    try {
      const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      vm.runInContext(code, win, { filename: rel });
    } catch (error) { errors.push({ file: rel, error }); }
  }
  return errors;
}
async function defaultScripts(name) {
  if (name.startsWith('core')) return CORE;
  if (name.startsWith('audio')) {
    const { scriptList } = await import(pathToFileURL(path.join(ROOT, 'tools', 'build-index.mjs')).href);
    return ['js/core/ns.js', 'js/core/util.js', 'js/core/rng.js'].concat(scriptList().filter((f) => f.startsWith('js/audio/')));
  }
  return null;
}

async function prepare(file, mod) {
  const name = path.basename(file);
  const env = { ROOT, makeStorage, sharedStorage, errors: [] };
  env.spawn = (o = {}) => {
    const win = makeWindow(o);
    const errs = loadScripts(win, o.scripts || env.scripts || CORE);
    env.errors.push(...errs);
    return { win, ES: win.ES, errors: errs };
  };
  if (typeof mod.setup === 'function') {
    env.ES = await mod.setup(env);
    return env;
  }
  let scripts = mod.scripts || await defaultScripts(name);
  if (!scripts && name.startsWith('engine') && fs.existsSync(path.join(ROOT, 'tests', 'sim', 'load.mjs'))) {
    const { loadEngine } = await import(pathToFileURL(path.join(ROOT, 'tests', 'sim', 'load.mjs')).href);
    env.ES = loadEngine();
    return env;
  }
  env.scripts = scripts || CORE;
  const s = env.spawn({ config: mod.config });
  env.win = s.win; env.ES = s.ES;
  return env;
}
function list(tests) {
  if (Array.isArray(tests)) return tests.map((t) => [t.name, t.fn]);
  return Object.entries(tests || {});
}

async function main() {
  const filters = process.argv.slice(2);
  const dir = path.join(ROOT, 'tests', 'unit');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.test.mjs') && (!filters.length || filters.some((x) => f.includes(x)))).sort();
  let pass = 0, fail = 0;
  const failures = [];
  for (const f of files) {
    let mod;
    try { mod = await import(pathToFileURL(path.join(dir, f)).href); }
    catch (e) { fail++; failures.push([f, '(import)', e]); console.log('✗ ' + f + ': cannot import: ' + e.message); continue; }
    let env;
    try { env = await prepare(f, mod); }
    catch (e) { fail++; failures.push([f, '(setup)', e]); console.log('✗ ' + f + ': setup failed: ' + e.message); continue; }
    const loadErr = env.errors.slice();
    for (const [name, fn] of list(mod.tests)) {
      try {
        if (loadErr.length) throw new Error('script failed to load: ' + loadErr.map((x) => x.file + ': ' + x.error.message).join('; '));
        await fn(env.ES, assert, env);
        pass++;
      } catch (e) {
        fail++;
        failures.push([f, name, e]);
      }
    }
    const mine = failures.filter((x) => x[0] === f).length;
    console.log((mine ? '✗ ' : '✓ ') + f + ' (' + list(mod.tests).length + ' tests' + (mine ? ', ' + mine + ' failed' : '') + ')');
  }
  failures.forEach(([f, n, e]) => console.log('\n✗ ' + f + ' › ' + n + '\n  ' + String(e && e.stack || e).split('\n').slice(0, 6).join('\n  ')));
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exitCode = fail ? 1 : 0;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
