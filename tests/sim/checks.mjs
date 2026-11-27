// Generator checks in one pass: for each generator, `seeds` trials with random settings across every dial range
// go through the independent solver and the shortcut responders.
// Mixed players (default): 11 player seeds and random variety per trial. Single players (solo: {breadth, players}):
// each player keeps one voice pool (fixed player seed) at one variety level and the responders remember that
// player's own history only — the early-weeks case the mixed run dilutes (review ST-03).
import { buildIndex, checkSpec, randomSetting } from './solver.mjs';
import { makeShortcutState, scoreSpec, summarise, binsOf } from './shortcuts.mjs';

export function runChecks(ES, { seeds = 10000, gens = ES.engine.exercises, solo = null } = {}) {
  gens = gens.filter((ex) => !ES.engine.items[ex].ready || ES.engine.items[ex].ready());
  const X = buildIndex(ES), solver = {}, st = makeShortcutState(), cast = ES.engine.items.voices.cast();
  const rr = ES.core.rng('shortcut-responders');
  for (const ex of gens) {
    const r = { n: 0, fail: 0, errors: {}, examples: [], msPerMake: 0 };
    let tMake = 0;
    const players = solo ? solo.players || ['soloA', 'soloB'] : [null], per = Math.ceil(seeds / players.length);
    for (let s = 0; s < seeds; s++) {
      const pl = players[Math.floor(s / per)];
      st.player = pl ? pl + ':' : '';
      const rng = ES.core.rng('check:' + (pl || '') + ex + ':' + s), set = randomSetting(ES, ex, rng.fork('set'));
      const ctx = { breadth: solo ? solo.breadth : set.breadth, headphones: set.hp, playerSeed: pl || 'check' + (s % 11), learner: ES.engine.learner,
        met: ex === 'voices' ? cast.slice(0, solo ? 8 : 6 + (s % 20)) : undefined, task: ex === 'voices' ? ['who', 'who', 'find', 'meet'][s % 4] : undefined };
      let spec;
      const t0 = performance.now();
      try { spec = ES.engine.items[ex].make(rng.fork('make'), { dials: set.dials, focus: Object.keys(set.dials)[0] }, ctx); }
      catch (e) { r.fail++; const k = 'throw: ' + e.message; r.errors[k] = (r.errors[k] || 0) + 1; continue; }
      tMake += performance.now() - t0;
      r.n++;
      const errs = checkSpec(ES, X, spec);
      if (errs.length) {
        r.fail++;
        errs.forEach((m) => { const k = m.replace(/[0-9.-]+/g, '#'); r.errors[k] = (r.errors[k] || 0) + 1; });
        if (r.examples.length < 3) r.examples.push({ seed: s, errs: errs.slice(0, 3) });
      }
      if (!(ex === 'voices' && spec.meta.task === 'meet')) scoreSpec(ES, st, spec, binsOf(ES, spec), rr);
    }
    r.msPerMake = +(tMake / Math.max(1, r.n)).toFixed(3);
    solver[ex] = r;
  }
  return { solver, shortcuts: summarise(st) };
}
