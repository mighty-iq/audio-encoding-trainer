// Engine: controller modes, flow runner, score (CONTRACTS §5). Run: node tests/unit/run.mjs engine
const T0 = 1764000000000;
function runSet(ES, ex, opts = {}, answer = () => true) {
  const E = ES.engine, lr = opts.learner || E.learner.create(null, () => T0);
  const sc = E.flow.start(ex, { learner: lr, seed: opts.seed || 'u:' + ex, trials: opts.trials || 40, ...opts });
  const out = []; let spec;
  while ((spec = E.flow.next(sc))) {
    const picks = spec.question.slots.map((sl, i) => sl.kind === 'locate' ? { x: sl.answer.x, y: sl.answer.y } : answer(spec, i, out.length) ? sl.answer : sl.options.find((o) => o !== sl.answer));
    E.flow.answer(sc, spec, { picks }); out.push(spec);
  }
  return { out, rec: E.flow.end(sc), lr };
}

export const tests = [
  { name: 'edge: warm-ups first, anchors every 4th–5th trial, edge trials planned near p = 0.72', fn(ES, assert) {
    const { out } = runSet(ES, 'crowd', { trials: 60 }, (s, i, k) => k % 4 !== 1);
    assert.ok(out[0].setting.warmup && out[1].setting.warmup, 'first two trials are warm-ups');
    const edge = out.filter((s) => !s.setting.warmup && !s.setting.anchor), anchors = out.filter((s) => s.setting.anchor);
    const pm = edge.reduce((a, s) => a + s.meta.decision.p, 0) / edge.length;
    assert.ok(Math.abs(pm - 0.72) < 0.03, 'mean planned p ' + pm);
    const share = anchors.length / out.filter((s) => !s.setting.warmup).length;
    assert.ok(share > 0.15 && share < 0.3, 'anchor share ' + share);
  } },
  { name: 'edge: two misses in a row bring an anchor', fn(ES, assert) {
    const { out } = runSet(ES, 'far', { trials: 30 }, () => false);
    const idx = out.findIndex((s, k) => k >= 4 && s.setting.anchor);
    assert.ok(idx > 0 && idx <= 6, 'anchor at ' + idx);
  } },
  { name: 'no trial is planned below p = 0.65 unless flagged as the floor', fn(ES, assert) {
    for (const ex of ES.engine.exercises) {
      const { out } = runSet(ES, ex, { trials: 30, headphones: ex === 'crowd' }, () => false);
      out.forEach((s) => { if (!s.setting.warmup && s.meta.decision.p < 0.65 - 1e-9) assert.ok(s.meta.decision.floor, ex + ' p ' + s.meta.decision.p); });
    }
  } },
  { name: 'headphones add the spatial dial in their own context', fn(ES, assert) {
    const a = runSet(ES, 'crowd', { trials: 5 }).out[4], b = runSet(ES, 'crowd', { trials: 5, headphones: true }).out[4];
    assert.equal(a.setting.dials.space, undefined);
    assert.ok(typeof b.setting.dials.space === 'number' && b.meta.ctxKey === 'crowd@hp');
  } },
  { name: 'strange: exactly one family per trial; new families start in a block', fn(ES, assert) {
    const { out } = runSet(ES, 'strange', { trials: 24 });
    out.forEach((s) => assert.equal(Object.keys(s.setting.dials).length, 1));
    assert.equal(new Set(out.slice(0, 8).map((s) => s.meta.family)).size, 1, 'first family blocked');
  } },
  { name: 'free mode keeps the caller’s dials and suggests a level', fn(ES, assert) {
    const { out } = runSet(ES, 'crowd', { trials: 3, mode: 'free', overrides: { tmr: -9, talkers: 2 } });
    assert.equal(out[2].setting.dials.tmr, -9); assert.equal(out[2].setting.dials.talkers, 2);
    assert.ok(out[2].meta.decision.coach && typeof out[2].meta.decision.coach.value === 'number');
  } },
  { name: 'pinned dials hold and the focus dial adapts', fn(ES, assert) {
    const { out } = runSet(ES, 'crowd', { trials: 12, pin: { talkers: 1, similar: 1 }, focus: 'tmr' });
    out.forEach((s) => { assert.equal(s.setting.dials.talkers, 1); assert.equal(s.setting.dials.similar, 1); });
    assert.ok(new Set(out.map((s) => s.setting.dials.tmr)).size > 2);
    assert.equal(ES.engine.controller.supports.pin, true);
  } },
  { name: 'a venue set on Strange voices keeps its family (focus dial or family), in Edge and Path', fn(ES, assert) {
    const E = ES.engine;
    for (const mode of ['edge', 'path', 'variety']) {
      const { out } = runSet(ES, 'strange', { trials: 24, mode, focus: 'phone', pin: {}, kind: 'venue' });
      assert.ok(out.every((s) => s.meta.family === 'phone' && Object.keys(s.setting.dials).join() === 'phone'), mode + ': ' + out.map((s) => s.meta.family).join(','));
      const r2 = runSet(ES, 'strange', { trials: 12, mode, family: 'muffled', seed: 'fam' });
      assert.ok(r2.out.every((s) => s.meta.family === 'muffled'), mode + ' family: ' + r2.out.map((s) => s.meta.family).join(','));
    }
    const lr = E.learner.create(null, () => T0), set = { exId: 'strange', kind: 'venue', focus: 'whisper' };
    for (let i = 0; i < 6; i++) assert.equal(E.controller.next('strange', { learner: lr, rng: ES.core.rng('d' + i), set, index: i, prev: [] }).family, 'whisper');
  } },
  { name: 'direct calls with a plain set object, index and prev work (shell style)', fn(ES, assert) {
    const E = ES.engine, lr = E.learner.create(null, () => T0), set = { exId: 'crowd', trials: 20, kind: 'normal' }, prev = [], res = [];
    lr.state.cond['crowd:base'] = { n: 50, acc: 0.7, at: 0 }; // a condition the player knows
    for (let i = 0; i < 20; i++) {
      const dec = E.controller.next('crowd', { mode: 'edge', rng: ES.core.rng('d' + i), learner: lr, set, index: i, prev: prev.slice(-5) });
      res.push(dec); prev.push({ prop: 1, correct: true });
    }
    assert.ok(res[0].warmup && res[1].warmup && !res[5].warmup);
    assert.ok(res.some((d) => d.anchor));
    assert.ok(!Object.keys(set).includes('__es'), 'memo is not enumerable');
  } },
  { name: 'flow (M8): learn:false changes nothing in the learner, also on a replay of the same set', fn(ES, assert) {
    const E = ES.engine, lr = E.learner.create(null, () => T0);
    runSet(ES, 'crowd', { learner: lr, trials: 30, seed: 'warm' });
    const before = JSON.stringify(lr.state);
    for (const seed of ['wk', 'wk']) {
      const { out, rec } = runSet(ES, 'crowd', { learner: lr, trials: 24, seed, learn: false }, (s, i, k) => k % 3 !== 0);
      assert.equal(out.length, 24); assert.ok(out.every((t) => t.setting.learn === false));
      assert.equal(rec.learn, false); assert.equal(rec.pb, false); assert.deepEqual(rec.pbs, []);
    }
    assert.equal(JSON.stringify(lr.state), before, 'learner untouched');
    const t = runSet(ES, 'crowd', { trials: 1 }).out[0]; t.setting.learn = false;
    const lr2 = E.learner.create(null, () => T0), b2 = JSON.stringify(lr2.state);
    lr2.update(t, E.score(t, { picks: t.question.slots.map((x) => x.answer) })); assert.equal(JSON.stringify(lr2.state), b2);
  } },
  { name: 'flow (M6): a skipped trial is replaced by a NEW trial at the same level; 3 replacements, then a partial end', fn(ES, assert) {
    const E = ES.engine, lr = E.learner.create(null, () => T0), sc = E.flow.start('crowd', { learner: lr, seed: 'sk', trials: 20 });
    for (let i = 0; i < 3; i++) { const t = E.flow.next(sc); E.flow.answer(sc, t, { picks: t.question.slots.map((x) => x.answer) }); }
    const a = E.flow.next(sc), r1 = E.flow.skip(sc, { reason: 'error' }), b = E.flow.next(sc);
    assert.ok(r1.replaced && r1.left === 2);
    assert.notEqual(a.id, b.id); assert.deepEqual(b.setting.dials, a.setting.dials); assert.equal(b.setting.focus, a.setting.focus);
    const bad = new Set(E.flow.clipsOf(a)), tclip = (t) => t.audio.parts.find((p) => p.role === 'target').clip;
    assert.ok(!bad.has(tclip(b)), 'the failing target clip is not drawn again');
    const stale = E.flow.answer(sc, a, { picks: a.question.slots.map((x) => x.answer) });
    assert.ok(stale.stale && sc.i === 3, 'a late answer to the skipped trial changes nothing');
    E.flow.skip(sc, { reason: 'void' }); E.flow.next(sc); E.flow.skip(sc, { reason: 'skip' }); E.flow.next(sc);
    const r4 = E.flow.skip(sc, { reason: 'error' });
    assert.ok(r4.ended && r4.partial); assert.equal(E.flow.next(sc), null);
    const rec = E.flow.end(sc);
    assert.ok(rec.partial && rec.why === 'replacements' && rec.n === 3 && rec.planned === 20 && rec.pb === false);
  } },
  { name: 'flow (M11): End set before half is partial; a stored set resumes after a reload with a new trial', fn(ES, assert) {
    const E = ES.engine, mk = (n, seed) => { const lr = E.learner.create(null, () => T0), sc = E.flow.start('far', { learner: lr, seed, trials: 20 });
      for (let i = 0; i < n; i++) { const t = E.flow.next(sc); E.flow.answer(sc, t, { picks: t.question.slots.map((x) => x.answer) }); } return { lr, sc }; };
    let r = mk(5, 'e5'); const p5 = E.flow.end(r.sc, { early: true }); assert.ok(p5.partial && p5.why === 'ended early' && !p5.pb);
    r = mk(10, 'e10'); const p10 = E.flow.end(r.sc, { early: true }); assert.ok(!p10.partial && p10.n === 10);
    r = mk(6, 'rs'); const pend = E.flow.next(r.sc), snap = JSON.parse(JSON.stringify(E.flow.snapshot(r.sc)));
    const sc2 = E.flow.resume(snap, { learner: r.lr });
    assert.ok(sc2 && sc2.i === 6 && sc2.results.length === 6);
    const t2 = E.flow.next(sc2);
    assert.notEqual(t2.id, pend.id); assert.deepEqual(t2.setting.dials, pend.setting.dials, 'same level after the reload');
    let t = t2; while (t) { E.flow.answer(sc2, t, { picks: t.question.slots.map((x) => x.answer) }); t = E.flow.next(sc2); }
    const rec = E.flow.end(sc2); assert.equal(rec.n, 20); assert.ok(!rec.partial && !rec.replaced, 'a reload is not charged');
    assert.equal(E.flow.resume({ v: 2 }), null);
  } },
  { name: 'flow: an unanswered trial is offered again', fn(ES, assert) {
    const E = ES.engine, sc = E.flow.start('far', { learner: E.learner.create(null, () => T0), seed: 'p' });
    assert.equal(E.flow.next(sc), E.flow.next(sc));
  } },
  { name: 'flow: set record has levels, foci and personal bests', fn(ES, assert) {
    const { rec } = runSet(ES, 'echo', { trials: 12 });
    assert.equal(rec.ex, 'echo'); assert.equal(rec.n, 12);
    assert.ok(rec.end && rec.foci && Array.isArray(rec.pbs) && typeof rec.idx === 'number');
  } },
  { name: 'score: picks or option indices; locate slots; intrusions', fn(ES, assert) {
    const trial = { question: { slots: [{ options: ['cup', 'bag', 'cap', 'rag'], answer: 'cup', foils: { bag: 'masker', cap: 'neighbour', rag: 'neighbour' } },
      { kind: 'locate', answer: { x: 0.2, y: 0.3, r: 0.1 }, options: [], foils: {} }] } };
    const a = ES.engine.score(trial, { picks: ['bag', { x: 0.25, y: 0.31 }] });
    assert.equal(a.slots[0].foil, 'masker'); assert.equal(a.intrusions, 1); assert.equal(a.slots[1].correct, true); assert.equal(a.prop, 0.5);
    const b = ES.engine.score(trial, { idx: [0, null] });
    assert.equal(b.slots[0].correct, true); assert.equal(b.correct, false);
  } },
  { name: 'controller.next stays well under 5 ms', fn(ES, assert) {
    const E = ES.engine, lr = E.learner.create(null, () => T0), t = [];
    for (let i = 0; i < 400; i++) {
      const ex = E.exercises[i % 7], t0 = performance.now();
      E.controller.next(ex, { mode: 'edge', rng: ES.core.rng('t' + i), learner: lr, set: { exId: ex }, index: 3 + (i % 9), prev: [] });
      t.push(performance.now() - t0);
    }
    t.sort((a, b) => a - b);
    assert.ok(t[Math.floor(t.length * 0.99)] < 5, 'p99 ' + t[Math.floor(t.length * 0.99)]);
  } }
];
