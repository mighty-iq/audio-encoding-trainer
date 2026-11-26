// Engine: item generators against the independent solver, determinism, planner, plateau, path.
// Run: node tests/unit/run.mjs engine
import { buildIndex, checkSpec, randomSetting } from '../sim/solver.mjs';
import { loadEngine } from '../sim/load.mjs';
const T0 = 1764000000000, DAY = 86400000;

function specs(ES, ex, n) {
  const out = [], cast = ES.engine.items.voices.cast();
  for (let s = 0; s < n; s++) {
    const rng = ES.core.rng('unit:' + ex + ':' + s), st = randomSetting(ES, ex, rng.fork('set'));
    out.push(ES.engine.items[ex].make(rng.fork('make'), { dials: st.dials, focus: Object.keys(st.dials)[0] },
      { breadth: st.breadth, headphones: st.hp, playerSeed: 'u', met: cast.slice(0, 8), task: ex === 'voices' ? ['who', 'find', 'meet'][s % 3] : undefined }));
  }
  return out;
}
// A log of `k` sessions of one exercise whose index moves by `slope` dB-eq per session.
function log(ex, k, slope, start = T0) {
  const sessions = [];
  for (let i = 0; i < k; i++) sessions.push({ id: 's' + i, start: start + i * DAY, end: start + i * DAY + 900000,
    sets: [{ ex, n: 24, warmups: 2, idx: i * slope, end: { tmr: -2 - i * slope }, foci: { tmr: 20 }, pb: false, focus: 'tmr' }] });
  return { sessions };
}

export const tests = [
  { name: 'every generator passes the independent solver on 300 seeds', fn(ES, assert) {
    const X = buildIndex(ES);
    for (const ex of ES.engine.exercises) for (const sp of specs(ES, ex, 300)) {
      const errs = checkSpec(ES, X, sp);
      assert.equal(errs.length, 0, errs.join('; '));
    }
  } },
  { name: 'generators are deterministic by seed', fn(ES, assert) {
    for (const ex of ES.engine.exercises) assert.deepEqual(specs(ES, ex, 3), specs(ES, ex, 3));
  } },
  { name: 'real data when present: ready exercises pass the solver', fn(ES, assert) {
    const R = loadEngine({ realData: true });
    if (!R.data.manifest || R.data.__fixture) return;
    const X = buildIndex(R);
    for (const ex of R.engine.exercises) {
      if (!R.engine.items[ex].ready()) continue;
      for (const sp of specs(R, ex, 150)) { const errs = checkSpec(R, X, sp); assert.equal(errs.length, 0, ex + ': ' + errs.join('; ')); }
    }
  } },
  { name: 'planner: 15 minutes → 5 sets, no exercise twice in a row, priorities weigh in', fn(ES, assert) {
    const E = ES.engine, lr = E.learner.create(null, () => T0), cnt = {};
    for (let i = 0; i < 300; i++) {
      const p = E.planner.session({ learner: lr, log: { sessions: [] }, minutes: 15, rng: ES.core.rng('pl' + i) });
      assert.equal(p.sets.length, 5);
      p.sets.forEach((s, k) => { cnt[s.exId] = (cnt[s.exId] || 0) + 1; if (k) assert.notEqual(s.exId, p.sets[k - 1].exId); });
      assert.ok(p.sets.filter((s) => s.interlude).length <= 2);
    }
    assert.ok(cnt.crowd > cnt.voices && cnt.far > cnt.echo, JSON.stringify(cnt));
  } },
  { name: 'planner: overnight re-test, fresh ears after 2 days, sleep note after 3 sessions', fn(ES, assert) {
    const E = ES.engine, lr = E.learner.create(null, () => T0), L = log('crowd', 1, 0, T0 - DAY);
    L.sessions[0].sets[0].voices = ['v1'];
    let p = E.planner.session({ learner: lr, log: L, now: T0 + 3600000 });
    assert.equal(p.sets[0].kind, 'overnight'); assert.equal(p.sets[0].hint.focus, 'tmr'); assert.deepEqual(p.sets[0].avoidVoices, ['v1']);
    p = E.planner.session({ learner: lr, log: log('crowd', 1, 0, T0 - 3 * DAY), now: T0 });
    assert.equal(p.sets[0].kind, 'fresh');
    const today = { sessions: [0, 1, 2].map((i) => ({ id: 't' + i, start: T0 + i * 3600000, end: T0 + i * 3600000 + 600000, sets: [] })) };
    p = E.planner.session({ learner: lr, log: today, now: T0 + 4 * 3600000 });
    assert.ok(p.notes.some((n) => n.kind === 'sleep'));
  } },
  { name: 'planner: focus mode gives the weakest probe\'s exercise 60 % of sets', fn(ES, assert) {
    const E = ES.engine, lr = E.learner.create(null, () => T0); let far = 0, all = 0;
    for (let i = 0; i < 100; i++) { const p = E.planner.session({ learner: lr, log: { sessions: [] }, mode: 'focus', lab: { weakest: 'rooms' }, rng: ES.core.rng('f' + i) }); all += p.sets.length; far += p.sets.filter((s) => s.exId === 'far').length; }
    assert.ok(Math.abs(far / all - 0.6) < 0.05, 'share ' + far / all);
  } },
  { name: 'plateau: silent without enough sessions; fires on a flat log; quiet on a climbing one', fn(ES, assert) {
    const E = ES.engine, lr = E.learner.create(null, () => T0);
    assert.equal(E.plateau.check('crowd', { learner: lr, log: log('crowd', 4, 0) }), null);
    const flat = E.plateau.check('crowd', { learner: lr, log: log('crowd', 10, 0) });
    assert.ok(flat && flat.breaker.kind === 'variety' && /held/.test(flat.reason) && flat.breaker.text.length > 20);
    assert.equal(E.plateau.check('crowd', { learner: lr, log: log('crowd', 10, 0.6) }), null);
  } },
  { name: 'plateau: breakers go in order and wait 3 sessions', fn(ES, assert) {
    const E = ES.engine, lr = E.learner.create(null, () => T0), kinds = [];
    for (let k = 9; k <= 24; k++) {
      const L = log('crowd', k, 0), r = E.plateau.check('crowd', { learner: lr, log: L, now: T0 + k * DAY });
      if (r) { kinds.push(r.breaker.kind); E.plateau.apply('crowd', r, { learner: lr, log: L }); }
    }
    assert.deepEqual(kinds.slice(0, 3), ['variety', 'focus', 'anchors']);
    assert.ok(lr.state.plat.crowd.anchorBoost > 0 || kinds.length > 3);
  } },
  { name: 'path: five in a row advances; fifteen under 50 % steps back', fn(ES, assert) {
    const E = ES.engine, lr = E.learner.create(null, () => T0);
    const t = { setting: { warmup: false } };
    for (let i = 0; i < 5; i++) E.path.record('crowd', t, { prop: 1 }, lr);
    assert.equal(lr.state.path.crowd.i, 1);
    for (let i = 0; i < 15; i++) E.path.record('crowd', t, { prop: 0 }, lr);
    assert.equal(lr.state.path.crowd.i, 0);
    const steps = E.path.steps('strange');
    assert.ok(steps.every((s) => !s.mix || s.mix.every((j) => steps[j] && !steps[j].mix)));
  } }
];
