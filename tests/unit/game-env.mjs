// Shared setup for the game layer's unit tests: a fresh window with the store (memory localStorage), core, the data
// fixture, the engine (files from tools/build-index.mjs) and the pure game scripts; the store is initialised.
import { gameScripts } from './game-load.mjs';

export async function spawnGame(env, opts = {}) {
  const s = env.spawn({ scripts: await gameScripts(opts), storage: opts.storage });
  if (s.errors.length) throw new Error('load: ' + s.errors.map((e) => e.file + ': ' + e.error.message).join('; '));
  await s.ES.core.store.init();
  return s.ES;
}
/** Train the app learner with simulated answers at fixed settings so estimates exist (fast, deterministic). */
export function trainDial(ES, ex, focus, dials, props, opts = {}) {
  const lr = ES.engine.learner, at0 = opts.at || Date.now();
  props.forEach((prop, i) => {
    const slots = [{ options: ['a', 'b', 'c', 'd'] }, { options: ['a', 'b', 'c', 'd'] }];
    const ck = opts.ctxKey || ex;
    lr.update({ ex, setting: { dials: Object.assign({}, dials), focus, anchor: false, warmup: false }, question: { slots },
      meta: { ctxKey: ck, cond: 'base' + (opts.cond || '') } }, { prop, correct: prop === 1 });
  });
  return lr;
}
export async function setup(env) { return spawnGame(env); }
