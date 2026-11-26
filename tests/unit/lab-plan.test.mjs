// Lab: schedule (baseline + weekly, never blocking), run records, the weakest probe, the headphone check maths.
export const scripts = ['js/core/ns.js', 'js/core/util.js', 'js/core/rng.js', 'js/core/store-schema.js', 'js/core/store.js', 'tests/fixtures/lab-data.js',
  'js/lab/stats.js', 'js/lab/materials.js', 'js/lab/procedures.js', 'js/lab/probes.js', 'js/lab/probes-more.js',
  'js/lab/schedule.js', 'js/lab/records.js', 'js/lab/hpcheck.js'];

const DAY = 864e5, T0 = Date.UTC(2026, 10, 2, 18, 0);   // a Monday evening (UTC keys in these tests)
let nid = 0;
function run(probe, at, kind, est = -6) { return { id: 'r' + (++nid), probe, at, end: at + 120000, kind, practice: false, est: { m: est, s: 0.5 }, n: 20 }; }
/** Do what the schedule asks on a given day (every due item, marked practice for first runs). */
function doDue(ES, state, day) {
  const sch = ES.lab.schedule(Object.assign({}, state, { now: T0 + day * DAY }));
  if (!sch.due) return sch;
  sch.due.items.forEach((it, i) => {
    if (it.probe === 'diary') state.diary.entries.push({ week: 'w' + day, at: T0 + day * DAY + i * 60000, items: [{ id: 'loud', v: 3 }, { id: 'far', v: 3 }, { id: 'memory', v: 4 }] });
    else { const r = run(it.probe, T0 + day * DAY + i * 60000, sch.due.kind); r.practice = it.role === 'practice'; state.runs.push(r); }
  });
  return sch;
}

export const tests = {
  'before any training the baseline waits; it never blocks a session'(ES, assert) {
    const s = ES.lab.schedule({ runs: [], diary: { entries: [] }, sessions: [], now: T0 });
    assert.equal(s.phase, 'start');
    assert.equal(s.due, null);
    assert.ok(/first training session/.test(s.next.text));
  },
  'baseline: five blocks on five days, one a day; practice first, then two measured runs for core probes'(ES, assert) {
    const st = { runs: [], diary: { entries: [] }, sessions: [{ start: T0 - 3600e3, end: T0 - 1800e3, activeMs: 900e3 }] };
    const kinds = [];
    for (let d = 0; d < 5; d++) {
      const sch = doDue(ES, st, d);
      assert.ok(sch.due, 'block due on day ' + d);
      assert.equal(sch.due.kind, 'baseline');
      kinds.push(sch.due.items.map((i) => i.probe + ':' + i.role).join(' '));
      const again = ES.lab.schedule(Object.assign({}, st, { now: T0 + d * DAY + 3 * 3600e3 }));
      assert.equal(again.due, null, 'one block a day');
      assert.ok(again.todayDone);
    }
    assert.deepEqual(kinds, ['matrix:practice digits:practice', 'matrix:measured digits:measured twovoices:practice',
      'matrix:measured digits:measured twovoices:measured', 'twovoices:measured rooms:practice newvoice:practice',
      'rooms:measured newvoice:measured story:practice diary:measured']);
    const done = ES.lab.schedule(Object.assign({}, st, { now: T0 + 5 * DAY }));
    assert.ok(done.baseline.complete);
    assert.equal(done.phase, 'weekly');
    const minutes = kinds.map((k, i) => ES.lab.schedule.BLOCKS[i].reduce((a, s) => a + ES.lab.probes[s[0]].minutes, 0));
    assert.ok(minutes.every((m) => m <= 9), 'blocks stay short: ' + minutes.join(', '));
  },
  'weekly check-in after 6.5 days: Matrix and Two voices every week, one rotating probe, the Diary'(ES, assert) {
    const st = { runs: [], diary: { entries: [] }, sessions: [{ start: T0, end: T0 + 900e3, activeMs: 900e3 }] };
    for (let d = 0; d < 5; d++) doDue(ES, st, d);
    assert.equal(ES.lab.schedule(Object.assign({}, st, { now: T0 + 10 * DAY })).due, null, 'not yet: 6 days after the last block');
    const rot = [];
    let day = 11;
    for (let w = 0; w < 5; w++) {
      st.sessions.push({ start: T0 + day * DAY - 3600e3, end: T0 + day * DAY - 1800e3, activeMs: 900e3 });
      const sch = doDue(ES, st, day);
      assert.ok(sch.due && sch.due.kind === 'weekly', 'weekly due on day ' + day);
      const ids = sch.due.items.map((i) => i.probe);
      assert.deepEqual(ids.slice(0, 2), ['matrix', 'twovoices']);
      assert.ok(ids.indexOf('diary') >= 0);
      rot.push(ids[2]);
      assert.ok(sch.due.minutes <= 10, 'about 8–9 minutes: ' + sch.due.minutes);
      day += 7;
    }
    assert.deepEqual(rot, ['digits', 'rooms', 'newvoice', 'story', 'digits']);
  },
  'after 14 days away the check-in is a retention check, never a penalty'(ES, assert) {
    const st = { runs: [], diary: { entries: [] }, sessions: [{ start: T0, end: T0 + 900e3, activeMs: 900e3 }] };
    for (let d = 0; d < 5; d++) doDue(ES, st, d);
    const sch = ES.lab.schedule(Object.assign({}, st, { now: T0 + 30 * DAY }));
    assert.equal(sch.due.kind, 'retention');
    assert.ok(/nothing to catch up/i.test(sch.due.note));
  },
  'records: older run shapes normalise; diary weeks become runs; points count practice runs'(ES, assert) {
    const R = ES.lab.records;
    const old = R.normalize({ id: 'x', probe: 'matrix', at: 5, m: -6.5, sd: 0.6 });
    assert.deepEqual([old.est.m, old.est.s, old.unit, old.rv, old.kind], [-6.5, 0.6, 'dB', 1, 'extra']);
    const runs = [run('matrix', T0, 'baseline', -5), run('matrix', T0 + DAY, 'baseline', -6), run('matrix', T0 + 2 * DAY, 'baseline', -6.2)];
    runs[0].practice = true;
    const pts = R.points(R.runsOf(runs, 'matrix'));
    assert.deepEqual(pts.map((p) => [p.t, p.r, p.practice]), [[0, 1, true], [1, 2, false], [2, 3, false]]);
    const d = R.runsOf([], 'diary', { entries: [{ week: '2026-W45', at: T0, items: [{ id: 'loud', v: 2 }, { id: 'far', v: 4 }, { id: 'memory', v: 3 }] }] });
    assert.equal(d.length, 1); assert.equal(d[0].est.m, 3);
  },
  'weakest probe for Focus mode: the player pick wins, else the lowest against provisional references'(ES, assert) {
    const R = ES.lab.records;
    const runs = [run('matrix', T0, 'baseline', -6), run('matrix', T0 + DAY, 'baseline', -6.5), run('digits', T0, 'baseline', -9), run('digits', T0 + DAY, 'baseline', -4)];
    runs[0].practice = runs[2].practice = true;
    const sum = R.summarize(runs, { entries: [] });
    assert.equal(R.weakestFrom(sum, null).weakest, 'digits');   // −4 dB is far worse than the digits reference
    assert.equal(R.weakestFrom(sum, 'twovoices').weakest, 'twovoices');
  },
  'store-backed records: add, summary, pooling id kept'(ES, assert) {
    return ES.core.store.init({ force: true }).then(() => {
      const R = ES.lab.records;
      R.add(Object.assign(run('matrix', T0, 'baseline', -5), { practice: true }));
      R.add(run('matrix', T0 + DAY, 'baseline', -6));
      assert.equal(R.all().length, 2);
      assert.equal(R.summary().matrix.measured, 1);
      const p = R.pid();
      assert.ok(/^p[a-z0-9]{4,}$/i.test(p));
      assert.equal(R.pid(), p);
      assert.notEqual(R.pid(true), p);
      assert.equal(ES.lab.context().weakest, 'matrix');
    });
  },
  'headphone check: anti-phase tone cancels when summed, the quiet tone is 6 dB down, pass at 5 of 6'(ES, assert) {
    const H = ES.lab.hpcheck, tr = H.trial(ES.core.rng('hp'), 0), sm = H.samples(tr, 16000);
    const seg = (i) => { const a = Math.round((H.LEAD + i * (H.TONE + H.GAP)) * 16000); return [a, a + Math.round(H.TONE * 16000)]; };
    const rms = (x, a, b) => { let s = 0; for (let i = a; i < b; i++) s += x[i] * x[i]; return Math.sqrt(s / (b - a)); };
    const lev = tr.order.map((k, i) => { const [a, b] = seg(i); return { k, L: rms(sm.L, a, b), sum: rms(sm.L.map((v, j) => (v + sm.R[j]) / 2), a, b) }; });
    const std = lev.find((x) => x.k === 'std'), anti = lev.find((x) => x.k === 'anti'), quiet = lev.find((x) => x.k === 'quiet');
    assert.ok(Math.abs(20 * Math.log10(quiet.L / std.L) + 6) < 0.05);
    assert.ok(Math.abs(anti.L - std.L) < 1e-6, 'each ear hears the anti-phase tone at full level');
    assert.ok(anti.sum < 1e-6, 'summed to one channel it cancels');
    const [a0, b0] = seg(tr.order.indexOf('std')), mid = rms(sm.L, a0 + 3200, b0 - 3200);
    assert.ok(Math.abs(20 * Math.log10(mid) + 20) < 0.1, 'steady part at −20 dBFS RMS: ' + 20 * Math.log10(mid));
    assert.equal(tr.answer, tr.order.indexOf('quiet') + 1);
    assert.ok(Math.abs(H.chance() - 13 / 729) < 1e-9);
    assert.equal(H.score([1, 1, 1, 1, 1, 2], [1, 1, 1, 1, 1, 1].map((a) => ({ answer: a }))).pass, true);
    assert.equal(H.score([1, 1, 1, 1, 2, 2], [1, 1, 1, 1, 1, 1].map((a) => ({ answer: a }))).pass, false);
  }
};
