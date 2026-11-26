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
    for (const ex of R.engine.exercises) assert.ok(R.engine.items[ex].ready(), ex + ' is ready on the build (own material or the call-sign fallback)');
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
  { name: 'Echo never asks for or offers a Lab matrix word (token match), 2,000 seeds; every message stays askable', fn(ES, assert) {
    const R = real(); if (!R) return;
    const E = R.engine, V = R.data.vocab, X = buildIndex(R);
    const norm = (t) => String(t).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
    const MX = new Set(['name', 'verb', 'num', 'adj', 'obj'].flatMap((k) => (V.matrix && V.matrix[k]) || []).map(norm));
    const hasMx = (v) => norm(v).split(' ').some((t) => MX.has(t));
    assert.ok(MX.size >= 40, 'matrix words loaded');
    (V.echo || []).forEach((it) => assert.ok(E.items.echo.askable(it).length >= 1, it.id + ' has an askable detail'));
    const used = new Set();
    for (let s = 0; s < 2000; s++) {
      const rng = R.core.rng('mx:' + s), st = randomSetting(R, 'echo', rng.fork('set'));
      const sp = E.items.echo.make(rng.fork('make'), { dials: st.dials, focus: Object.keys(st.dials)[0] }, { breadth: st.breadth, playerSeed: 'm' + (s % 7) });
      assert.ok(sp.question.slots.length >= 1, 'at least one question');
      sp.question.slots.forEach((sl) => {
        assert.ok(!hasMx(sl.answer), 'asked a matrix word: ' + sl.answer);
        sl.options.forEach((o) => assert.ok(!hasMx(o), 'offered a matrix word: ' + o));
      });
      assert.deepEqual(checkSpec(R, X, sp), []);
      used.add(norm(sp.meta.text));
    }
    const withMx = (V.echo || []).filter((it) => it.facts.some((f) => hasMx(f.value)) && used.has(norm(it.text)));
    assert.ok(withMx.length >= 5, 'messages with a matrix word are still played (others asked): ' + withMx.length);
  } },
  { name: 'M3: babble beds carry one talker clip per voice (never a recorded bed id the renderer cannot split)', fn(ES, assert) {
    const R = real(); if (!R) return;
    const E = R.engine, C = R.data.manifest.clips; let babble = 0;
    for (const ex of ['crowd', 'echo', 'strange', 'voices', 'seek']) for (let s = 0; s < 120; s++) {
      const rng = R.core.rng('m3:' + ex + ':' + s), st = randomSetting(R, ex, rng.fork('set'));
      const breadth = s % 2 ? 0.2 : st.breadth, dials = ex === 'strange' ? { accent: s % 4 } : st.dials;
      const sp = E.items[ex].make(rng.fork('make'), { dials, focus: Object.keys(dials)[0] }, { breadth, headphones: st.hp, playerSeed: 'b', met: E.items.voices.cast().slice(0, 6), task: ex === 'voices' ? 'who' : undefined });
      const beds = (sp.audio.beds || []).concat(sp.audio.live ? [sp.audio.live.bed] : []);
      beds.forEach((b) => {
        if (b.bed !== undefined) assert.equal(b.kind, 'ambience', ex + ': bed id on ' + b.kind);
        if (b.kind === 'babble') { babble++; assert.ok(b.clips.length >= 3 && b.clips.every((id) => C[id] && C[id].kind === 'sentence'), ex + ' babble clips'); }
      });
    }
    assert.ok(babble > 200, 'babble beds made from talker clips: ' + babble);
  } },
  { name: 'M2: never a Voices find trial for a voice without call-sign phrases (who or meet instead)', fn(ES, assert) {
    const R = real(); if (!R) return;
    const E = R.engine, D = R.data, cast0 = E.items.voices.cast(), two = cast0.slice(0, 2), clips = {};
    // the two first cast voices lose their call-sign phrases (as 8 of 20 cast voices had in the reviewed build)
    Object.entries(D.manifest.clips).forEach(([id, c]) => { if (!(two.includes(c.voice) && c.kind === 'phrase')) clips[id] = c; });
    D.manifest = Object.assign({}, D.manifest, { clips, version: D.manifest.version + ':m2' });
    E.items.data.reset();
    const X = buildIndex(R), dials = { cast: 0, similar: 0, snr: 12, length: 0 };
    for (let s = 0; s < 40; s++) {
      const sp = E.items.voices.make(R.core.rng('find' + s), { dials, focus: 'snr' }, { met: two, task: 'find', playerSeed: 'p' });
      assert.equal(sp.meta.task, 'who'); assert.ok(sp.meta.relaxed.includes('find → who'));
      assert.ok(sp.audio.parts.every((p) => p.clip), 'no null clip'); assert.deepEqual(checkSpec(R, X, sp), []);
      const one = E.items.voices.make(R.core.rng('one' + s), { dials, focus: 'snr' }, { met: two.slice(0, 1), task: 'find', playerSeed: 'p' });
      assert.equal(one.meta.task, 'meet'); assert.deepEqual(checkSpec(R, X, one), []);
    }
    const lr = E.learner.create(null, () => 0); lr.noteMet(two);
    const sc = E.flow.start('voices', { learner: lr, mode: 'variety', seed: 'm2', trials: 60 });
    let sp, finds = 0;
    while ((sp = E.flow.next(sc))) {
      assert.ok(sp.audio.parts.every((p) => p.clip) && sp.question.slots[0].answer, 'trial with a target and an answer');
      if (sp.meta.task === 'find') { finds++; assert.ok(!two.includes(sp.meta.voices[0])); }
      E.flow.answer(sc, sp, { picks: [sp.question.slots[0].answer] });
    }
    assert.ok(sc.i === 60);
  } },
  { name: 'fixture: every generator, random and tutorial settings', fn(ES, assert) { exercise(ES, assert, 100, 'fixture'); } }
];
