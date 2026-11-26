// Fix round 1 (docs/dev/reviews/FIX-ROUND-1.md): store-level findings M1, M9, M10, L5, L6, L8. Each test failed on
// the reviewed snapshot (e079caf) and passes after the fix.
export const scripts = ['js/core/ns.js', 'js/core/util.js', 'js/core/rng.js', 'js/core/store-schema.js', 'js/core/store-merge.js', 'js/core/store.js'];
const P = 'earshot.v1.';
const dial = (m, at) => ({ m, s: 1, n: 5, at });

export const tests = {
  async 'M1: a stale learner save keeps the other tab’s dial records (newer at wins per record)'(ES0, assert, env) {
    const shared = env.sharedStorage();
    const A = env.spawn({ storage: shared }).ES, B = env.spawn({ storage: shared }).ES;
    await A.core.store.init(); await B.core.store.init();
    A.core.store.set('learner', { v: 1, n: 12, dials: { 'crowd.tmr': dial(-3, 100), 'crowd.talkers': dial(1, 100) }, recent: { crowd: [1, 1, 0] } });
    shared.flush();                                   // B's store adopts A's record; B's engine state does not
    B.core.store.set('learner', { v: 1, n: 12, dials: { 'far.dist': dial(4, 200) }, recent: { far: [1] } });
    const rec = JSON.parse(shared.map.get(P + 'learner')).rec;
    assert.deepEqual(Object.keys(rec.dials).sort(), ['crowd.talkers', 'crowd.tmr', 'far.dist']);
    assert.deepEqual(rec.recent.crowd, [1, 1, 0], 'recent follows the side whose dials for that exercise are newer');
    assert.deepEqual(rec.recent.far, [1]);
    B.core.store.set('learner', { v: 1, n: 13, dials: { 'crowd.tmr': dial(-5, 300), 'far.dist': dial(4, 200) }, recent: { crowd: [0] } });
    const rec2 = JSON.parse(shared.map.get(P + 'learner')).rec;
    assert.equal(rec2.dials['crowd.tmr'].m, -5, 'a newer record replaces an older one');
    assert.deepEqual(rec2.recent.crowd, [0]);
  },
  'L8: merge rules do what they say (game pbs max, cast counts max, learner n as a counter)'(ES, assert) {
    const SC = ES.core.storeSchema;
    const g = SC.mergeRecord('game', { v: 1, pbs: { a: 1 } }, { v: 1, pbs: { a: 5 } }, { v: 1, pbs: { a: 3 } }, { oursNewer: false });
    assert.equal(g.pbs.a, 5, 'the better best survives whichever tab wrote last');
    const l = SC.mergeRecord('learner', { v: 1, n: 10, cast: { x: 1 } }, { v: 1, n: 14, cast: { x: 3 } }, { v: 1, n: 12, cast: { x: 2 } }, {});
    assert.equal(l.n, 16, 'two tabs’ trials add up (10 + 4 + 2)');
    assert.equal(l.cast.x, 3);
  },
  async 'M9: an import with wrong nested types is refused and nothing changes'(ES0, assert, env) {
    const st = env.makeStorage(), { ES } = env.spawn({ storage: st });
    await ES.core.store.init();
    ES.core.store.update('profile', (p) => { p.nickname = 'Keep'; });
    const before = JSON.stringify(Array.from(st._map.entries()));
    const bad = [
      { recent: { crowd: 'x' } }, { edge: { crowd: {} } }, { cond: { 'crowd:base': 5 } }, { path: { crowd: 'x' } },
      { dials: { 'crowd.tmr': 'x' } }, { recent: { crowd: [0.5, 'a'] } }
    ];
    for (const b of bad) {
      const rep = ES.core.store.importAll({ format: 'earshot-backup', records: { profile: { v: 1, nickname: 'New' }, learner: Object.assign({ v: 1 }, b) } });
      assert.equal(rep.ok, false, JSON.stringify(b));
      assert.equal(rep.error, 'damaged');
      assert.ok(rep.damaged.some((d) => d.key === 'learner'), JSON.stringify(rep.damaged));
      assert.equal(JSON.stringify(Array.from(st._map.entries())), before, 'nothing changed');
    }
    const logBad = ES.core.store.importAll({ records: { log: { v: 1, sessions: [{ id: 's', start: 1, sets: 'x' }] } } });
    assert.equal(logBad.ok, false, 'a session whose sets are not a list is damage');
    const good = ES.core.store.importAll({ records: { learner: { v: 1, recent: { crowd: [1, 0.5] }, cond: { 'crowd:base': { n: 3, acc: 0.7, at: 5 } } } } });
    assert.equal(good.ok, true);
  },
  async 'M9: damaged learner fields already in storage load as safe values'(ES0, assert, env) {
    const st = env.makeStorage();
    st.setItem(P + 'learner', JSON.stringify({ rev: 1, at: 1, by: 'x', rec: { v: 1, recent: { crowd: 'x', far: [1, 0] }, edge: { crowd: {} },
      cond: { a: 5, b: { n: 2, acc: 0.5, at: 1 } }, path: { crowd: 'x' } } }));
    const { ES } = env.spawn({ storage: st });
    await ES.core.store.init();
    const l = ES.core.store.get('learner');
    assert.ok(!('crowd' in l.recent) || Array.isArray(l.recent.crowd));
    assert.deepEqual(l.recent.far, [1, 0]);
    assert.ok(!('crowd' in l.edge) || Array.isArray(l.edge.crowd));
    assert.ok(!('a' in l.cond));
    assert.equal(l.cond.b.n, 2);
    assert.ok(!('crowd' in l.path) || typeof l.path.crowd === 'object');
  },
  async 'M10: 3,000 sessions stay under the near-full mark and fit a 2.5 M-character quota'(ES0, assert, env) {
    const st = env.makeStorage({ quota: 2500000 }), { ES } = env.spawn({ storage: st });
    await ES.core.store.init();
    const day = 864e5, t0 = Date.UTC(2026, 0, 1), sessions = [];
    const setEntry = (ex, i) => ({ ex, n: 20, correct: 14, acc: 0.71, focus: 'tmr', foci: { tmr: 12, talkers: 4 }, end: { tmr: -3.21, talkers: 1.4, similar: 1.1 },
      avg: { tmr: -2.9, talkers: 1.3 }, sd: { tmr: 1.2, talkers: 0.6 }, pb: false, pbs: [], idx: 1.23, startIdx: 1.1, mode: 'edge', ctxKey: ex,
      anchors: 4, warmups: 2, breadth: 0.35, voices: ['kokoro.af_heart', 'kokoro.am_adam', 'kokoro.bf_emma', 'kokoro.bm_george'], activeMs: 180000 + i });
    for (let i = 0; i < 3000; i++) {
      sessions.push({ id: 's_' + i.toString(36), start: t0 + i * day / 3, end: t0 + i * day / 3 + 9e5, activeMs: 9e5, mode: 'edge',
        sets: ['crowd', 'far', 'strange', 'repair', 'echo'].map((ex) => setEntry(ex, i)) });
    }
    const rows = []; for (let i = 0; i < 3000; i++) rows.push([t0 + i * 1000, 'crowd', 'tmr', -3.5, 1, 1, 0]);
    assert.equal(ES.core.store.set('trials', { v: 1, rows }), true);
    assert.equal(ES.core.store.set('log', { v: 1, sessions }), true, 'the log is saved');
    const log = ES.core.store.peek('log');
    assert.equal(log.sessions.length >= 2900, true, 'old sessions are compacted, not thrown away: ' + log.sessions.length);
    const last = log.sessions[log.sessions.length - 1], first = log.sessions[0];
    assert.ok(Array.isArray(last.sets[0].voices), 'recent sessions keep their full entries');
    assert.ok(first.c === 1 && !('voices' in first.sets[0]) && first.sets[0].idx === 1.23 && first.sets[0].fv === -3.21, 'old sessions keep a summary');
    const s = ES.core.store.status();
    assert.equal(s.saved, true);
    assert.ok(s.bytes / 2 < 3500000, 'under the near-full mark: ' + s.bytes / 2);
  },
  async 'L5: set() reports its own key, not another key that failed earlier'(ES0, assert, env) {
    const st = env.makeStorage({ quota: 60000 }), { ES } = env.spawn({ storage: st });
    await ES.core.store.init();
    const rows = []; for (let i = 0; i < 6000; i++) rows.push([i + 1, 'crowd', 'tmr', -3.5, 1, 1, 0]);
    assert.equal(ES.core.store.set('trials', { v: 1, rows }), false, 'too big for this storage');
    assert.equal(ES.core.store.update('profile', (p) => { p.nickname = 'small'; }), true, 'the small write itself succeeded');
    assert.equal(ES.core.store.status().saved, false, 'the status still says something is not saved');
  },
  async 'L6: a newer record is kept aside; readers get v1 defaults'(ES0, assert, env) {
    const st = env.makeStorage();
    st.setItem(P + 'profile', JSON.stringify({ rev: 3, at: 1, by: 't', rec: { v: 99, settings: 'new shape' } }));
    const { ES } = env.spawn({ storage: st });
    await ES.core.store.init();
    const p = ES.core.store.get('profile');
    assert.equal(p.v, 1);
    assert.equal(typeof p.settings, 'object');
    assert.equal(p.settings.mode, 'edge');
  }
};
