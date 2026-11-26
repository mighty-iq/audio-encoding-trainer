// Engine on the stimulus data as built (data/*.js) and on small subsets of it: every ready generator makes valid
// trials for random settings and for tutorial-style settings, and never throws. Run: node tests/unit/run.mjs engine
import { loadEngine } from '../sim/load.mjs';
import { buildIndex, checkSpec, randomSetting } from '../sim/solver.mjs';

function real() { const ES = loadEngine({ realData: true }); return ES.data.__fixture ? null : ES; }
// Keep only `keep` voices (and their clips) — new objects, so the engine's data index rebuilds.
function subset(ES, keep) {
  const D = ES.data, voices = {}, clips = {};
  keep.forEach((v) => { voices[v] = D.voices[v]; });
  Object.entries(D.manifest.clips).forEach(([id, c]) => { if (!c.voice || voices[c.voice]) clips[id] = c; });
  D.voices = voices; D.manifest = Object.assign({}, D.manifest, { clips, version: D.manifest.version + ':' + keep.join(',') });
  ES.engine.items.data.reset();
  return ES;
}
function exercise(ES, assert, n, label) {
  const X = buildIndex(ES), cast = ES.engine.items.voices.cast(), E = ES.engine;
  for (const ex of E.exercises) {
    if (!E.items[ex].ready()) continue;
    for (let s = 0; s < n; s++) {
      const rng = ES.core.rng(label + ':' + ex + ':' + s), st = randomSetting(ES, ex, rng.fork('set'));
      const tut = s % 5 === 0, dials = {};
      if (tut) E.dials[ex].forEach((d) => { if (!d.requires) dials[d.id] = d.comfort; });
      if (tut && ex === 'strange') { Object.keys(dials).forEach((k) => delete dials[k]); dials[E.dials.strange[s % 6].id] = 0; }
      const setting = tut ? { dials, focus: null, anchor: true, warmup: true } : { dials: st.dials, focus: Object.keys(st.dials)[0] };
      const ctx = tut ? { tutorial: true, mode: 'tutorial' } : { breadth: st.breadth, headphones: st.hp, playerSeed: 'r', met: cast.slice(0, 8), task: ex === 'voices' ? ['who', 'find', 'meet'][s % 3] : undefined };
      let spec;
      try { spec = E.items[ex].make(rng.fork('make'), setting, ctx); }
      catch (e) { assert.fail(label + ' ' + ex + ' threw: ' + e.message); }
      const errs = checkSpec(ES, X, spec);
      assert.equal(errs.length, 0, label + ' ' + ex + ': ' + errs.join('; '));
    }
  }
}

export const tests = [
  { name: 'real data: every ready generator, random and tutorial settings', fn(ES, assert) {
    const R = real(); if (!R) return;
    assert.ok(R.engine.items.crowd.ready(), 'crowd is ready on the build');
    exercise(R, assert, 200, 'real');
  } },
  { name: 'real data, one voice per sex: still valid trials, never a throw', fn(ES, assert) {
    const R = real(); if (!R) return;
    const vs = Object.keys(R.data.voices).filter((v) => R.data.voices[v].set === 'train');
    const f = vs.find((v) => R.data.voices[v].sex === 'f'), m = vs.find((v) => R.data.voices[v].sex === 'm');
    exercise(subset(R, [f, m].filter(Boolean)), assert, 120, 'pair');
  } },
  { name: 'real data, a single voice: still valid trials, never a throw', fn(ES, assert) {
    const R = real(); if (!R) return;
    const v = Object.keys(R.data.voices).find((x) => R.data.voices[x].set === 'train');
    exercise(subset(R, [v]), assert, 80, 'one');
  } },
  { name: 'fixture: every generator, random and tutorial settings', fn(ES, assert) { exercise(ES, assert, 100, 'fixture'); } }
];
