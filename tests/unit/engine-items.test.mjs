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
  { name: 'foil types: number foils are never sound-alikes; similar voices are typed similar', fn(ES, assert) {
    const num = (w) => ES.engine.items.common.isNum(w);
    for (const ex of ['crowd', 'far', 'strange', 'echo']) for (const sp of specs(ES, ex, 200)) sp.question.slots.forEach((sl) => {
      const fs = Object.entries(sl.foils || {});
      if (num(sl.answer) && fs.every(([f]) => num(f))) fs.forEach(([f, t]) => assert.ok(['masker', 'context', 'number'].includes(t), ex + ' ' + f + ' typed ' + t));
    });
    const crowd = specs(ES, 'crowd', 100).filter((sp) => sp.question.slots[1]);
    assert.ok(crowd.length > 20 && crowd.every((sp) => Object.values(sp.question.slots[1].foils).every((t) => t === 'masker' || t === 'number')));
    specs(ES, 'voices', 150).filter((sp) => sp.meta.task === 'who').forEach((sp) => Object.values(sp.question.slots[0].foils).forEach((t) => assert.ok(t === 'similar' || t === 'random', t)));
  } },
  { name: 'seek: live scene fields (found, spatial, seed) and a preview clip by the target voice', fn(ES, assert) {
    const C = ES.data.manifest.clips, words = (id) => (C[id].words && C[id].words.length ? C[id].words : C[id].text.toLowerCase().split(/[^a-z']+/)).filter(Boolean);
    let withPreview = 0;
    for (const sp of specs(ES, 'seek', 120)) {
      const L = sp.audio.live, loc = sp.question.slots[0], ws = sp.question.slots[1];
      assert.equal(L.radius, undefined); assert.equal(L.found, loc.answer.r);
      assert.equal(L.spatial, sp.audio.spatial); assert.ok(typeof L.seed === 'string' && L.seed.length > 0);
      if (!sp.meta.preview) { assert.ok(sp.meta.relaxed.includes('no preview')); continue; }
      withPreview++;
      const pv = sp.meta.preview, scene = [L.target.clip].concat(L.decoys.map((d) => d.clip));
      assert.equal(C[pv].voice, C[L.target.clip].voice); assert.ok(!scene.includes(pv));
      const pw = new Set(words(pv));
      [sp.meta.items[0]].concat(sp.meta.decoyWords).forEach((w) => assert.ok(!pw.has(String(w).toLowerCase()), 'preview says ' + w));
      ws.options.forEach((o) => assert.ok(!pw.has(String(o).toLowerCase()), 'option ' + o + ' is in the preview'));
    }
    assert.ok(withPreview > 100, 'previews ' + withPreview);
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
  { name: 'planner (M4, C04, C19, L9): overnight only in a day\'s first session; truthful texts; focusEx flag', fn(ES, assert) {
    const E = ES.engine, lr = E.learner.create(null, () => T0), L = log('crowd', 1, 0, T0 - DAY);
    let p = E.planner.session({ learner: lr, log: L, now: T0 + 3600000 });
    assert.equal(p.sets[0].kind, 'overnight');
    assert.ok(/^Yesterday's hardest: .*now with a voice that was not in that set\.$/.test(p.sets[0].text), p.sets[0].text);
    const L2 = { sessions: L.sessions.concat([{ id: 'today', start: T0, end: T0 + 900000, sets: [] }]) };
    assert.equal(E.planner.overnight({ learner: lr, log: L2, now: T0 + 3600000 }), null);
    assert.notEqual(E.planner.session({ learner: lr, log: L2, now: T0 + 3600000 }).sets[0].kind, 'overnight');
    const now = new Date(T0); now.setHours(1, 0, 0, 0); const last = new Date(now.getTime()); last.setDate(last.getDate() - 2); last.setHours(23, 0, 0, 0);
    const o = E.planner.overnight({ learner: lr, log: log('crowd', 1, 0, last.getTime()), now: now.getTime() });
    assert.ok(o && /^Your last day's hardest: /.test(o.text), o && o.text);
    const L3 = log('crowd', 1, 0, T0 - DAY); L3.sessions[0].sets[0].partial = true;
    assert.equal(E.planner.overnight({ learner: lr, log: L3, now: T0 + 3600000 }), null, 'a partial set is never the hardest');
    const mk = (k) => ({ sessions: Array.from({ length: k }, (_, i) => ({ id: 't' + i, start: T0 + i * 3600000, end: T0 + i * 3600000 + 600000, sets: [] })) });
    assert.ok(!E.planner.session({ learner: lr, log: mk(2), now: T0 + 3 * 3600000 }).notes.some((n) => n.kind === 'sleep'));
    const sl = E.planner.session({ learner: lr, log: mk(3), now: T0 + 4 * 3600000 }).notes.find((n) => n.kind === 'sleep');
    assert.ok(sl && /^You have trained three times today\. Sleep consolidates practice, so tomorrow is a good time/.test(sl.text), sl && sl.text);
    const pf = E.planner.session({ learner: lr, log: { sessions: [] }, mode: 'focus', lab: { weakest: 'rooms' }, rng: ES.core.rng('fx') });
    assert.ok(pf.sets.some((x) => x.focusEx === true) && pf.sets.every((x) => x.focus === undefined));
  } },
  { name: 'planner: focus mode gives the weakest probe\'s exercise 60 % of sets', fn(ES, assert) {
    const E = ES.engine, lr = E.learner.create(null, () => T0); let far = 0, all = 0;
    for (let i = 0; i < 100; i++) { const p = E.planner.session({ learner: lr, log: { sessions: [] }, mode: 'focus', lab: { weakest: 'rooms' }, rng: ES.core.rng('f' + i) }); all += p.sets.length; far += p.sets.filter((s) => s.exId === 'far').length; }
    assert.ok(Math.abs(far / all - 0.6) < 0.05, 'share ' + far / all);
  } },
  { name: 'plateau: silent without enough sessions; fires on a flat log; quiet on a climbing one', fn(ES, assert) {
    const E = ES.engine, lr = E.learner.create(null, () => T0);
    assert.equal(E.plateau.check('crowd', { learner: lr, log: log('crowd', 4, 0) }), null);
    const D = E.plateau.DEFAULTS, need = D.window + D.persist - 1; // earliest call: persist full windows, one session apart
    assert.equal(E.plateau.check('crowd', { learner: lr, log: log('crowd', need - 1, 0) }), null);
    const flat = E.plateau.check('crowd', { learner: lr, log: log('crowd', need, 0) });
    assert.ok(flat && flat.breaker.kind === 'variety' && flat.breaker.text.length > 20);
    assert.equal(flat.reason, 'Crowd has set no new best in 4 sessions, and its level moved less than 0.15 dB a session over the last 10.');
    assert.equal(E.plateau.check('crowd', { learner: lr, log: log('crowd', need + 4, 0.6) }), null);
  } },
  { name: 'plateau texts (C03, C04, C05, C10, C24, C33); partial and learn:false sets stay out of the windows', fn(ES, assert) {
    const E = ES.engine, P = E.plateau, need = P.DEFAULTS.window + P.DEFAULTS.persist - 1, lr = () => E.learner.create(null, () => T0);
    const fall = P.check('crowd', { learner: lr(), log: log('crowd', need, -0.4) });
    assert.ok(fall && /has slipped a little over the last \d+ sessions\.$/.test(fall.reason), fall && fall.reason);
    const st = log('repair', need, 0); st.sessions.forEach((s) => { s.sets[0].end = { gap: 2 }; s.sets[0].foci = { gap: 20 }; s.sets[0].focus = 'gap'; });
    const rp = P.check('repair', { learner: lr(), log: st });
    assert.ok(rp && /its level has barely moved over the last \d+ sessions\.$/.test(rp.reason) && !/points/.test(rp.reason), rp && rp.reason);
    assert.ok(/about 30° to one side/.test(P.STRATEGY.seek) && !/straight ahead/.test(P.STRATEGY.seek));
    assert.ok(/listen for the sounds this voice changes/.test(P.STRATEGY.strange) && !/rhythm/.test(P.STRATEGY.strange));
    // breaker texts in order (variety, focus, anchors, strategy, sleep, switch): no promises the code does not keep
    const L = lr(), seen = {};
    for (let k = need; k < need + 40 && Object.keys(seen).length < 6; k++) {
      const g = log('crowd', k, 0); g.sessions.push({ id: 'x', start: T0 + (k - 1) * DAY + 3600000, end: T0 + (k - 1) * DAY + 4000000, sets: [] });
      const r = P.check('crowd', { learner: L, log: g, now: T0 + (k - 1) * DAY + 4000000 });
      if (r) { seen[r.breaker.kind] = r.breaker.text; P.apply('crowd', r, { learner: L, log: g }); }
    }
    assert.ok(/fresh mix gives the skill something new to work on/.test(seen.variety) && !/often breaks/.test(seen.variety));
    assert.equal(seen.anchors, 'More easy trials go in between the hard ones for a while, so the hard trials have something to build on.');
    assert.ok(/^This is your second session today\./.test(seen.sleep) && /tomorrow is a good time for the next session/.test(seen.sleep), seen.sleep);
    assert.ok(/trains other situations for a while, then comes back to it\./.test(seen.switch), seen.switch);
    const pl = log('crowd', need, 0); pl.sessions.forEach((s) => { s.sets[0].partial = true; });
    assert.equal(P.check('crowd', { learner: lr(), log: pl }), null, 'partial sets are not plateau evidence');
    const nl = log('crowd', need, 0); nl.sessions.forEach((s) => { s.sets[0].learn = false; });
    assert.equal(P.check('crowd', { learner: lr(), log: nl }), null, 'learn:false sets are not plateau evidence');
  } },
  { name: 'plateau: breakers go in order and wait 3 sessions', fn(ES, assert) {
    const E = ES.engine, lr = E.learner.create(null, () => T0), kinds = [];
    for (let k = 9; k <= 30; k++) {
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
