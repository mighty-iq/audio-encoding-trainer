// Script lists for the Lab's unit tests. The core part follows tools/build-index.mjs (the shell's load order), so new
// store modules (e.g. js/core/store-merge.js) load automatically; only DOM-free core files are taken.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { scriptList } = await import(new URL('../../tools/build-index.mjs', import.meta.url).href);
const CORE_OK = /^js\/core\/(ns|util|rng|store[\w-]*)\.js$/;
export const CORE = scriptList().filter((f) => CORE_OK.test(f));
export const LAB_PURE = ['js/lab/stats.js', 'js/lab/materials.js', 'js/lab/procedures.js', 'js/lab/probes.js', 'js/lab/probes-more.js'];
export function labScripts(extra = []) {
  return CORE.concat(['tests/fixtures/lab-data.js'], LAB_PURE, extra).filter((f) => fs.existsSync(path.join(ROOT, f)));
}
