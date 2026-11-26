// Engine: dials and learner model (CONTRACTS §5). Run: node tests/unit/run.mjs engine
const T0 = 1764000000000;
function crowdTrial(ES, dials, focus, prop, extra = {}) {
  return { trial: { ex: 'crowd', setting: { dials, focus, ...extra }, question: { slots: [{ options: ['a', 'b', 'c', 'd'] }, { options: ['a', 'b', 'c', 'd'] }] }, meta: { ctxKey: 'crowd', cond: 'base' } }, result: { prop } };
}
function seasoned(lr) { lr.state.cond['crowd:base'] = { n: 50, acc: 0.7, at: 0 }; return lr; }

export const tests = [
  { name: 'dials: every dial is well formed and in range', fn(ES, assert) {
    for (const ex of ES.engine.exercises) for (const d of ES.engine.dials[ex]) {
      assert.ok(['cont', 'ord'].includes(d.kind), ex + '.' + d.id + ' kind');
      assert.ok(d.slope > 0 && d.prior && d.prior.s > 0 && d.drift > 0, ex + '.' + d.id + ' model fields');
      if (d.kind === 'ord') { assert.equal(d.min, 0); assert.equal(d.max, d.levels.length - 1); assert.equal(d.values.length, d.levels.length); assert.equal(d.dir, 1); }
      if (d.family) assert.equal(d.comfort, null, 'family dials have no comfort level');
      else assert.ok(d.comfort >= d.min && d.comfort <= d.max, ex + '.' + d.id + ' comfort in range');
      assert.ok(d.margin >= 0);
    }
  } },
  { name: 'learner: p at the threshold with the others at comfort is the target', fn(ES, assert) {
    const E = ES.engine, lr = E.learner.create(null, () => T0), ck = 'crowd';
    for (const d of E.dials.crowd.slice(0, 3)) lr.state.dials[ck + '.' + d.id] = { m: d.prior.m, s: 0.01, n: 50, at: T0 };
    const zs = lr.zStar('crowd', ck), dials = {};
    for (const d of E.dials.crowd.slice(1, 3)) dials[d.id] = lr.solve('crowd', d, E.model.fc, ck, zs);
    dials.tmr = E.dials.crowd[0].prior.m;
    const p = lr.predict('crowd', dials, 0, { ctxKey: ck });
    assert.ok(Math.abs(p - E.model.target) < 0.01, 'p ' + p);
  } },
  { name: 'learner: successes at the edge move the threshold harder, errors easier', fn(ES, assert) {
    const E = ES.engine;
    const up = seasoned(E.learner.create(null, () => T0)), down = seasoned(E.learner.create(null, () => T0));
    for (let i = 0; i < 10; i++) {
      let t = crowdTrial(ES, { tmr: -3, talkers: 0, similar: 0 }, 'tmr', 1); up.update(t.trial, t.result);
      t = crowdTrial(ES, { tmr: -3, talkers: 0, similar: 0 }, 'tmr', 0); down.update(t.trial, t.result);
    }
    const prior = E.dials.crowd[0].prior.m;
    assert.ok(up.est('crowd', 'tmr').m < prior, 'harder = lower TMR threshold');
    assert.ok(down.est('crowd', 'tmr').m > prior, 'easier = higher TMR threshold');
  } },
  { name: 'learner: warm-up, new-condition and tutorial trials do not move thresholds', fn(ES, assert) {
    const E = ES.engine, lr = E.learner.create(null, () => T0);
    let t = crowdTrial(ES, { tmr: -3, talkers: 0, similar: 0 }, 'tmr', 1);
    lr.update(t.trial, t.result); // first item of a new condition
    assert.equal(lr.est('crowd', 'tmr').n, 0);
    seasoned(lr);
    t = crowdTrial(ES, { tmr: -3, talkers: 0, similar: 0 }, 'tmr', 1, { warmup: true }); lr.update(t.trial, t.result);
    t = crowdTrial(ES, { tmr: -3, talkers: 0, similar: 0 }, 'tmr', 1, { tutorial: true }); lr.update(t.trial, t.result);
    assert.equal(lr.est('crowd', 'tmr').n, 0);
    t = crowdTrial(ES, { tmr: -3, talkers: 0, similar: 0 }, 'tmr', 1); lr.update(t.trial, t.result);
    assert.ok(lr.est('crowd', 'tmr').n > 0);
  } },
  { name: 'learner: only the focus dial learns from a trial', fn(ES, assert) {
    const E = ES.engine, lr = seasoned(E.learner.create(null, () => T0));
    for (let i = 0; i < 20; i++) { const t = crowdTrial(ES, { tmr: -3, talkers: 1, similar: 1 }, 'tmr', i % 2); lr.update(t.trial, t.result); }
    assert.equal(lr.est('crowd', 'talkers').n, 0);
    assert.equal(lr.est('crowd', 'similar').n, 0);
    assert.ok(lr.est('crowd', 'tmr').n >= 20);
  } },
  { name: 'learner: noteMet counts voices met outside trials, and Voices asks about them', fn(ES, assert) {
    const E = ES.engine, lr = E.learner.create(null, () => T0), cast = E.items.voices.cast();
    assert.deepEqual(lr.met(), []);
    lr.noteMet(cast[0]); lr.noteMet([cast[1], cast[2]]); lr.noteMet(cast[0]); lr.noteMet(null);
    assert.deepEqual(lr.met().sort(), cast.slice(0, 3).sort()); assert.equal(lr.state.cast[cast[0]], 2);
    const sp = E.items.voices.make(ES.core.rng('met'), { dials: { cast: 0, similar: 0, snr: 30, length: 0 } }, { learner: lr, task: 'who', playerSeed: 'm' });
    assert.equal(sp.meta.task, 'who');
    sp.question.slots[0].options.forEach((o) => assert.ok(cast.slice(0, 3).map(E.items.voices.nameOf).includes(o), o));
  } },
  { name: 'learner: state survives a JSON round trip', fn(ES, assert) {
    const E = ES.engine, lr = seasoned(E.learner.create(null, () => T0));
    for (let i = 0; i < 30; i++) { const t = crowdTrial(ES, { tmr: -2, talkers: 0, similar: 0 }, 'tmr', i % 3 ? 1 : 0); lr.update(t.trial, t.result); }
    const copy = E.learner.create(JSON.parse(JSON.stringify(lr.toJSON())), () => T0);
    assert.deepEqual(copy.est('crowd', 'tmr'), lr.est('crowd', 'tmr'));
    assert.deepEqual(copy.state.breadth, lr.state.breadth);
  } },
  { name: 'learner: tracks a simulated listener to within 2 dB', fn(ES, assert) {
    const E = ES.engine, lr = seasoned(E.learner.create(null, () => T0)), rng = ES.core.rng('track'), truth = -8;
    const zs = lr.zStar('crowd', 'crowd'), d = E.dials.crowd[0];
    // the other dials contribute what the model itself expects of them at level 0
    const others = lr.compE('crowd', E.dials.crowd[1], 0, 'crowd', zs) * lr.compE('crowd', E.dials.crowd[2], 0, 'crowd', zs);
    for (let i = 0; i < 300; i++) {
      const x = lr.snap(d, lr.solve('crowd', d, 0.77, 'crowd', zs));
      const p = 0.25 + 0.71 * others / (1 + Math.exp(-(zs + 0.18 * (x - truth))));
      const c = (rng.next() < p ? 1 : 0) + (rng.next() < p ? 1 : 0);
      const t = crowdTrial(ES, { tmr: x, talkers: 0, similar: 0 }, 'tmr', c / 2); lr.update(t.trial, t.result);
    }
    assert.ok(Math.abs(lr.est('crowd', 'tmr').m - truth) < 2, 'estimate ' + lr.est('crowd', 'tmr').m);
  } },
  { name: 'learner: days away widen the posterior, never past 1.5 × prior SD', fn(ES, assert) {
    const E = ES.engine; let now = T0;
    const lr = E.learner.create(null, () => now);
    lr.state.dials['crowd.tmr'] = { m: -6, s: 1, n: 100, at: T0 };
    const s0 = lr.est('crowd', 'tmr').s; now += 10 * 86400000;
    const s1 = lr.est('crowd', 'tmr').s; now += 400 * 86400000;
    assert.ok(s1 > s0 && lr.est('crowd', 'tmr').s <= E.dials.crowd[0].prior.s * 1.5 + 1e-9);
  } },
  { name: 'learner: summary gives values in real units', fn(ES, assert) {
    const E = ES.engine, lr = E.learner.create(null, () => T0), sm = lr.summary('far');
    assert.equal(sm.ex, 'far');
    const dist = sm.dials.find((x) => x.id === 'dist');
    assert.ok(typeof dist.value === 'number' && /m$/.test(dist.text));
  } }
];
