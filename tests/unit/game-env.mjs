// Shared setup for the game layer's unit tests: a fresh window with the store (memory localStorage), core, the data
// fixture, the engine (files from tools/build-index.mjs) and the pure game scripts; the store is initialised.
import { gameScripts } from './game-load.mjs';

export async function spawnGame(env, opts = {}) {
  const s = env.spawn({ scripts: await gameScripts(opts), storage: opts.storage });
  if (s.errors.length) throw new Error('load: ' + s.errors.map((e) => e.file + ': ' + e.error.message).join('; '));
  await s.ES.core.store.init();
  return s.ES;
}
/** Log trials the way the shell does (store `trials` rows [t, ex, focus, level, correct, prop, intrusions]). */
export function logTrials(ES, rows) {
  ES.core.store.update('trials', (r) => { r.rows = (r.rows || []).concat(rows); });
}
/** Train the app learner with simulated answers at fixed settings so estimates exist (fast, deterministic); the
    trials are logged too (opts.log === false leaves them out: a dial never tested). */
let CLOCK = 0;                                       // trial rows are keyed by (time, exercise): times never repeat
export function trainDial(ES, ex, focus, dials, props, opts = {}) {
  const lr = ES.engine.learner, at0 = opts.at || Math.max(Date.now(), CLOCK + 1), rows = [];
  CLOCK = Math.max(CLOCK, at0 + props.length);
  props.forEach((prop, i) => {
    const slots = [{ options: ['a', 'b', 'c', 'd'] }, { options: ['a', 'b', 'c', 'd'] }];
    const ck = opts.ctxKey || ex;
    lr.update({ ex, setting: { dials: Object.assign({}, dials), focus, anchor: false, warmup: false }, question: { slots },
      meta: { ctxKey: ck, cond: 'base' + (opts.cond || '') } }, { prop, correct: prop === 1 });
    rows.push([at0 + i, ex, focus, dials[focus], prop === 1 ? 1 : 0, prop, 0]);
  });
  if (opts.log !== false) logTrials(ES, rows);
  return lr;
}
export async function setup(env) { return spawnGame(env); }
