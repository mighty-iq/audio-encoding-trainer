// Script lists for the game layer's Node tests and tools. Engine files come from the shell's tools/build-index.mjs
// (the order index.html uses), so new engine files are picked up without edits here; game files from
// js/game/load-order.txt (pure files only: those that touch no DOM at load or in their logic).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CORE = ['js/core/ns.js', 'js/core/util.js', 'js/core/rng.js', 'js/core/store-schema.js', 'js/core/store.js', 'js/core/clock.js', 'js/core/router.js'];
// DOM modules of the game layer (never loaded in Node)
export const GAME_DOM = new Set(['js/game/style.js', 'js/game/ui.js', 'js/game/share.js', 'js/game/screen-map.js', 'js/game/screen-venue.js',
  'js/game/screen-cast.js', 'js/game/screen-weekly.js', 'js/game/screen-progress.js']);

export async function scriptList() {
  const { scriptList: list } = await import(pathToFileURL(path.join(ROOT, 'tools', 'build-index.mjs')).href);
  return list();
}
export async function engineFiles() { return (await scriptList()).filter((f) => f.startsWith('js/engine/')); }
export async function gamePure() { return (await scriptList()).filter((f) => f.startsWith('js/game/') && !GAME_DOM.has(f)); }
/** Core + data (fixture unless realData) + engine + pure game scripts, in load order. */
export async function gameScripts({ realData = false, extra = [] } = {}) {
  const data = realData && fs.existsSync(path.join(ROOT, 'data', 'manifest.js'))
    ? ['data/voices.js', 'data/vocab.js', 'data/manifest.js'] : ['tests/fixtures/data-fixture.js'];
  return CORE.concat(data, await engineFiles(), await gamePure(), extra);
}
