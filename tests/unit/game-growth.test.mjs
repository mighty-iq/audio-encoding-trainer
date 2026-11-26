// Game layer: cast cards, milestones, level-ups, returns and the set:done settlement (js/game/cast.js, milestones.js,
// returns.js, record.js), with real engine flow sets answered by a scripted player.
import { spawnGame, trainDial } from './game-env.mjs';
export { setup } from './game-env.mjs';

const DAY = 86400000;
/** Run one engine flow set; answer(spec, i) → true for a right answer. Returns the set:done-like payload. */
function runSet(ES, ex, answer, opts = {}) {
  const E = ES.engine, sc = E.flow.start(ex, Object.assign({ mode: 'edge', seed: 'test:' + ex + ':' + (opts.tag || 0), headphones: false }, opts.flow || {}));
  const results = [];
  let spec, i = 0;
  while ((spec = E.flow.next(sc))) {
    const ok = answer(spec, i++);
    const picks = spec.question.slots.map((s) => ok ? s.answer : s.options.find((o) => o !== s.answer));
    const out = E.flow.answer(sc, spec, { picks });
    results.push({ correct: out.result.correct, prop: out.result.prop });
    ES.hooks.emit('trial:done', { trial: spec, result: out.result, set: 0, index: i - 1, demo: false });
  }
  return { set: E.flow.end(sc), index: 0, session: 's', results, demo: false };
}

export const tests = {
  'cast: every cast voice of the data, probe voices left out, synthetic voices labelled'(ES, assert) {
    const list = ES.game.cast.list(), V = ES.data.voices;
    const expected = Object.keys(V).filter((id) => V[id].cast && V[id].set !== 'probe');
    assert.equal(list.length, expected.length);
    assert.ok(list.length >= 20);
    list.forEach((c) => { assert.ok(c.name && c.id); assert.equal(c.synthetic, ['kokoro', 'piper-libritts'].includes(V[c.id].src)); });
    const counts = ES.game.cast.counts();
    assert.deepEqual(counts, { total: list.length, met: 0, known: 0 }, 'a fresh profile has met nobody');
  },
  async 'cast: a card fills in as the voice is met, then known after 3 right identifications'(ES0, assert, env) {
    const ES = await spawnGame(env), C = ES.game.cast, id = C.list()[0].id;
    const who = (ok) => ({ ex: 'voices', meta: { voices: [id, 'x'], task: 'who' } });
    let out = C.noteTrial({ ex: 'crowd', meta: { voices: [id] } }, { correct: false });
    assert.deepEqual(out.met, [id]);
    assert.equal(C.card(id).state, 'met');
    [1, 2].forEach(() => C.noteTrial(who(), { correct: true }));
    out = C.noteTrial(who(), { correct: true });
    assert.deepEqual(out.known, [id]);
    assert.equal(C.card(id).state, 'known');
    ES.game.core.update((r) => C.flush(r));
    assert.equal(C.pending(), 0);
    const rec = ES.core.store.get('game').cast[id];
    assert.equal(rec.n, 4); assert.equal(rec.id, 3); assert.ok(rec.met > 0);
    assert.equal(C.card(id).state, 'known', 'survives the flush');
    assert.equal(C.noteTrial({ ex: 'crowd', meta: { voices: [id], demo: true } }, {}).met.length, 0, 'demo trials do not count');
  },
  'milestones: generated from the dial definitions, numbers match the engine'(ES, assert) {
    const all = ES.game.milestones.all();
    assert.ok(all.length > 50);
    all.forEach((m) => {
      const d = ES.engine.dialDef(m.ex, m.dial);
      assert.equal(m.value, ES.game.core.levelText(m.ex, d, m.at));
      assert.ok(!/undefined|NaN/.test(m.name + m.text), m.id);
    });
    const eq = all.find((m) => m.id === 'crowd.tmr@0');
    assert.equal(eq.name, 'Equal footing');
    assert.ok(/as loud as each voice around it/.test(eq.text));
    assert.equal(ES.game.milestones.check().length, 0, 'nothing on a fresh profile');
  },
  async 'milestones need the player’s own data and are not for time spent'(ES0, assert, env) {
    const ES = await spawnGame(env), M = ES.game.milestones;
    trainDial(ES, 'crowd', 'tmr', { tmr: -4, talkers: 0, similar: 0 }, Array(5).fill(1));
    assert.equal(M.check().filter((m) => m.dial === 'tmr').length, 0, 'too few updates');
    trainDial(ES, 'crowd', 'tmr', { tmr: -4, talkers: 0, similar: 0 }, Array(30).fill(1));
    const got = M.check().filter((m) => m.dial === 'tmr').map((m) => m.id);
    assert.ok(got.includes('crowd.tmr@0'), got.join());
    const m = ES.game.core.est('crowd', 'tmr').m;
    got.forEach((id) => assert.ok(m <= +id.split('@')[1] + 1e-9, 'reached ' + id + ' at m=' + m));
  },
  'level-ups need a whole display step; first estimates say so'(ES, assert) {
    const M = ES.game.milestones;
    assert.deepEqual(M.levelUps('crowd', { tmr: { m: 2, n: 9 } }, { tmr: { m: 1.6, n: 12 } }), []);
    const up = M.levelUps('crowd', { tmr: { m: 2, n: 9 } }, { tmr: { m: 0.4, n: 12 } });
    assert.equal(up.length, 1);
    assert.equal(up[0].text, 'Your voice vs the others: +2 dB → +0.5 dB');
    assert.equal(M.levelUps('far', { dist: { m: 4.6, n: 9 } }, { dist: { m: 4.9, n: 12 } }).length, 0, 'same metre level');
    assert.equal(M.levelUps('far', { dist: { m: 4.6, n: 9 } }, { dist: { m: 5.1, n: 12 } })[0].text, 'Distance: 4 m → 6 m');
    assert.ok(/first estimate/.test(M.levelUps('far', null, { dist: { m: 3, n: 5 } })[0].text));
    assert.equal(M.levelUps('crowd', { tmr: { m: 0, n: 9 } }, { tmr: { m: 3, n: 12 } }).length, 0, 'no line for a drop');
  },
  'returns: fresh ears and overnight checks read as retained skill, never as loss of a streak'(ES, assert) {
    const R = ES.game.returns;
    assert.deepEqual(R.afterSet({ ex: 'crowd' }), []);
    const held = R.afterSet({ ex: 'crowd', fresh: { daysAway: 5, before: 1.2, after: 1.0 } })[0];
    assert.equal(held.kind, 'fresh'); assert.ok(/held after 5 days away/.test(held.text), held.text);
    const rust = R.afterSet({ ex: 'far', fresh: { daysAway: 9, before: 2, after: 0.5 } })[0];
    assert.ok(/little rust/.test(rust.text) && /comes back/.test(rust.text), rust.text);
    const on = R.afterSet({ ex: 'crowd', overnight: { n: 3, prop: 0.833, expected: 0.72, focus: 'similar' } })[0];
    assert.equal(on.text, 'Yesterday’s hardest (voice similarity), with voices new to you: 83 % of words right over 3 trials (the model expected about 72 %).');
    [held, rust, on].forEach((x) => assert.ok(!/streak|missed|lost your|penalt/i.test(x.text)));
  },
  async 'returns: the next session opens with fresh ears after ≥ 2 days, else the overnight check'(ES0, assert, env) {
    const ES = await spawnGame(env), now = Date.UTC(2026, 10, 26, 18);
    const log = (t, extra) => ({ sessions: [{ id: 'a', start: t, end: t + 6e5, sets: [Object.assign({ ex: 'crowd', n: 20, focus: 'tmr', end: { tmr: -2 } }, extra || {})] }] });
    assert.equal(ES.game.returns.upcoming({ log: { sessions: [] }, now }), null, 'nothing before the first session');
    const f = ES.game.returns.upcoming({ log: log(now - 3 * DAY), now });
    assert.equal(f.kind, 'fresh');
    assert.ok(!/missed|streak/i.test(f.text));
  },
  async 'settle: one set updates levels, venues, openings, milestones and cast in one write'(ES0, assert, env) {
    const ES = await spawnGame(env);
    let writes = 0;
    ES.hooks.on('store:changed', (e) => { if (e && e.key === 'game') writes++; });
    const p1 = runSet(ES, 'crowd', () => true, { tag: 1 });
    const n1 = ES.game.record.settle(p1, { plan: {} });
    const rec = ES.core.store.get('game');
    assert.ok(rec.last && rec.last.crowd && rec.last.crowd.tmr, 'snapshot stored');
    assert.ok(n1.lines.some((l) => /first estimate/.test(l.text)), JSON.stringify(n1.lines));
    assert.ok(rec.venues.cafe && rec.venues.cafe.h && rec.venues.cafe.h.length === 1, 'café earshot history');
    assert.ok(Object.keys(rec.cast).length >= 1, 'voices met');
    for (let k = 2; k < 6; k++) ES.game.record.settle(runSet(ES, 'crowd', () => true, { tag: k }), { plan: {} });
    const rec2 = ES.core.store.get('game');
    assert.ok(rec2.venues.restaurant && rec2.venues.restaurant.open, 'a run of right answers opens the restaurant');
    assert.ok(Object.keys(rec2.badges).length >= 1, 'milestones reached: ' + Object.keys(rec2.badges).join());
    assert.ok(writes >= 1);
  },
  async 'settle: demo sets change nothing; weekly stops are recorded with their marks'(ES0, assert, env) {
    const ES = await spawnGame(env);
    const before = JSON.stringify(ES.core.store.get('game'));
    ES.game.record.settle({ set: { ex: 'demo', n: 5 }, index: 0, results: [], demo: true });
    assert.equal(JSON.stringify(ES.core.store.get('game')), before);
    const news = ES.game.record.settle({ set: { ex: 'far', n: 6, kind: 'weekly' }, index: 1, results: [1, 1, 0, 1, 0, 0].map((c) => ({ correct: !!c })) },
      { plan: { kind: 'weekly', week: '2026-W48', stop: 2 } });
    assert.deepEqual(news.weekly, { week: '2026-W48', stop: 2, marks: '110100', practice: false, complete: false });
    assert.equal(ES.core.store.get('game').weekly['2026-W48'].stops[2].marks, '110100');
  }
};
