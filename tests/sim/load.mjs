// Loads the engine (and its dependencies) into a fresh vm context with a minimal `window`, the way the browser
// loads classic scripts. Prefers the real js/core/rng.js and data/*.js when present, else the fixtures.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const ENGINE_FILES = [
  'js/engine/dials.js', 'js/engine/learner.js', 'js/engine/items/common.js', 'js/engine/items/data.js',
  'js/engine/items/crowd.js', 'js/engine/items/far.js', 'js/engine/items/strange.js', 'js/engine/items/repair.js',
  'js/engine/items/echo.js', 'js/engine/items/seek.js', 'js/engine/items/voices.js',
  'js/engine/score.js', 'js/engine/controller.js', 'js/engine/path.js', 'js/engine/plateau.js',
  'js/engine/planner.js', 'js/engine/flow.js'
];

function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }

export function loadEngine(opts = {}) {
  const ctx = { console, Math, Date, JSON, Object, Array, Number, String, Boolean, Error, Map, Set, Float64Array,
    Float32Array, Int32Array, Uint32Array, performance: globalThis.performance };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  const run = (rel) => vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
  const useRealData = opts.realData ?? (exists('data/manifest.js') && exists('data/vocab.js') && exists('data/voices.js'));
  if (exists('js/core/ns.js') && opts.realCore !== false) run('js/core/ns.js');
  if (exists('js/core/rng.js') && opts.realCore !== false) run('js/core/rng.js');
  run('tests/fixtures/rng.js'); // no-op when the real rng is present
  if (useRealData) { for (const f of ['data/voices.js', 'data/vocab.js', 'data/manifest.js']) run(f); }
  else run('tests/fixtures/data-fixture.js');
  for (const f of opts.files || ENGINE_FILES) if (exists(f)) run(f);
  return ctx.ES;
}
