// Calibration helper for the game layer (not a test; run by hand): simulated learners from tests/sim/learners.mjs go
// through the engine's real planner and flow (Edge mode); after each session the game layer computes every venue's
// earshot and openings. Prints, per venue, the share of learners for whom it is open after k sessions and the median
// session of opening, so unlock thresholds (js/game/data.js) give a beginner early openings and a long road.
// Also writes a long-term profile (learner + log) for the browser tests with --fixture.
// Usage: node tests/unit/game-calibrate.mjs [--learners 40] [--days 42] [--fixture]
import fs from 'node:fs';
import path from 'node:path';
import { loadEngine, ROOT } from '../sim/load.mjs';
import { engineFiles, gamePure } from './game-load.mjs';
import { makeLearner, respond, synthSpec, trueTheta } from '../sim/learners.mjs';

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const N = +opt('learners', 40), DAYS = +opt('days', 42), DAY = 86400000, DAY0 = Date.UTC(2026, 8, 7, 17, 0, 0);
const FILES = (await engineFiles()).concat(await gamePure());

export function simulate(opts = {}) {
  const { learners = N, days = DAYS, type = null, seed = 'cal', onSession = null, synthEvery = 25 } = opts;
  const ES = loadEngine({ files: FILES }), E = ES.engine, G = ES.game;
  globalThis.__G = G;
  const out = [];
  for (let li = 0; li < learners; li++) {
    const r = ES.core.rng(seed + ':' + li), S = makeLearner(ES, li, r.fork('who'), type);
    S.headphones = false;
    let now = DAY0;
    const lr = E.learner.create(null, () => now);
    lr.state.seed = 'cal' + li;
    G.core.setLearner(lr);
    const log = { sessions: [] }, opened = {}, openedDay = {}, rec = { v: 1, venues: {}, cast: {}, badges: {}, pbs: {}, weekly: {} }, series = [];
    const tested = {}, claims = [], trialRows = [];             // what the player was tested at (focus dial), as the shell logs it
    G.core.setTested((ex, id) => tested[ex + '.' + id]);
    const firstWith = {};
    const synth = (ex, setting, ctx, sc) => (ex === 'voices' || sc.i % synthEvery === 7) ? E.items[ex].make(sc.rng.fork('m' + sc.i), setting, ctx) : synthSpec(ES, ex, setting, ctx, sc.rng.fork('s' + sc.i));
    let sid = 0;
    for (let day = 0; day < days; day++) {
      if (r.next() > S.adherence) continue;
      now = DAY0 + day * DAY;
      const off = 0, plan = E.planner.session({ learner: lr, log, now, mode: 'edge', rng: r.fork('plan' + day) });
      const sess = { id: 's' + sid++, start: now, end: now, activeMs: 0, mode: 'edge', sets: [] };
      for (const st of plan.sets) {
        const sc = E.flow.start(st.exId, { mode: 'edge', learner: lr, seed: 'cal:' + li + ':' + sid + ':' + st.exId, headphones: false, kind: st.kind,
          hint: st.hint, avoidVoices: st.avoidVoices, synth, daysAway: st.daysAway });
        let spec;
        while ((spec = E.flow.next(sc))) {
          const { picks } = respond(S, spec, off); now += 7000; const res = E.flow.answer(sc, spec, { picks }).result;
          const f = spec.setting.focus, x = spec.setting.dials[f], d = E.dialDef(spec.ex, f), k = spec.ex + '.' + f;
          if (d && typeof x === 'number' && (tested[k] === undefined || d.dir * (x - tested[k]) > 0)) tested[k] = x;
          if (opts.rows) trialRows.push([now, spec.ex, f, x, res.correct ? 1 : 0, Math.round(res.prop * 1000) / 1000, res.intrusions | 0]);
        }
        sess.sets.push(E.flow.end(sc));
      }
      sess.end = now;
      log.sessions.push(sess);
      const states = G.venues.state({ rec });
      states.forEach((s) => {
        const sv = rec.venues[s.id] = rec.venues[s.id] || {};
        if (s.open && !sv.open) { sv.open = now; opened[s.id] = log.sessions.length; openedDay[s.id] = day; }
        const e = s.earshot;
        if (e && (e.status === 'in' || e.status === 'beyond')) {
          sv.h = (sv.h || []).concat([[now, e.x]]).slice(-80);
          if (G.milestones.venueBetter(s.venue, e, sv.best)) { sv.best = e.x; sv.bestAt = now; }
        }
      });
      const exs = [...new Set(sess.sets.map((x) => x.ex))];
      G.milestones.check(rec, { venues: G.venues.state({ rec }) }).forEach((m) => {
        rec.badges[m.id] = now;
        if (m.kind !== 'dial') return;
        // overclaim: the milestone's level is harder than the simulated learner's true threshold now
        const d = E.dialDef(m.ex, m.dial), at = +m.id.split('@')[1], th = trueTheta(S, m.ex, lr.ctxKey(m.ex, false), d);
        claims.push({ ex: m.ex, id: m.id, session: log.sessions.length, day, first: !firstWith[m.ex], over: d.dir * (at - th) > 1e-9, steps: d.dir * (at - th) * (d.kind === 'ord' ? 1 : 1 / 3) });
      });
      exs.forEach((ex) => { firstWith[ex] = (firstWith[ex] || 0) + 1; });
      series.push(Object.fromEntries(states.map((s) => [s.id, s.earshot.status === 'none' ? null : s.earshot.x])));
      if (onSession) onSession({ li, S, lr, log, now, states });
    }
    out.push({ li, type: S.type, sessions: log.sessions.length, opened, openedDay, series, lr, log, rec, claims, trialRows });
  }
  G.core.setLearner(null);
  G.core.setTested(null);
  return { ES, runs: out };
}

function median(a) { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y); return b[Math.floor((b.length - 1) / 2)]; }

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const t0 = Date.now(), { ES, runs } = simulate({ rows: args.includes('--fixture') });
  const ids = ES.game.data.ids;
  console.log(`learners ${runs.length}, days ${DAYS}, ${((Date.now() - t0) / 1000).toFixed(1)} s; median sessions ${median(runs.map((r) => r.sessions))}`);
  for (const id of ids) {
    const at = runs.map((r) => r.opened[id]).filter((x) => x !== undefined);
    const by = (k) => runs.filter((r) => r.opened[id] !== undefined && r.opened[id] <= k).length / runs.length;
    const last = runs.map((r) => r.series[r.series.length - 1] && r.series[r.series.length - 1][id]).filter((x) => x !== null && x !== undefined);
    console.log(id.padEnd(11), 'open by s3', by(3).toFixed(2), 's6', by(6).toFixed(2), 's12', by(12).toFixed(2), 'end', (at.length / runs.length).toFixed(2),
      'median session', median(at), 'final earshot median', last.length ? median(last).toFixed(2) : '-');
  }
  // milestones: overclaim rate per exercise (milestones at a level harder than the learner's true threshold)
  const EXS = ['crowd', 'far', 'strange', 'repair', 'echo', 'seek', 'voices'];
  console.log('\nmilestones (dial), per exercise: learners with ≥1 overclaim after their first session with it · share of all awarded that overclaim · median awarded in that first session');
  for (const ex of EXS) {
    const firstOver = runs.filter((r) => r.claims.some((c) => c.ex === ex && c.first && c.over)).length / runs.length;
    const all = runs.flatMap((r) => r.claims.filter((c) => c.ex === ex)), over = all.filter((c) => c.over).length;
    const firstCount = runs.map((r) => r.claims.filter((c) => c.ex === ex && c.first).length);
    console.log(ex.padEnd(8), 'first-session overclaim', (100 * firstOver).toFixed(0) + ' %', '· all awarded', all.length, 'overclaimed', all.length ? (100 * over / all.length).toFixed(1) + ' %' : '-',
      '· median in first session', median(firstCount));
  }
  console.log('\nvenue openings by day (simulated days; a typical learner = median improver):');
  const imp = runs.filter((r) => r.type === 'improver');
  for (const id of ids) {
    const ds = runs.map((r) => r.openedDay[id]).filter((x) => x !== undefined);
    console.log(id.padEnd(11), 'opened for', (100 * ds.length / runs.length).toFixed(0).padStart(3) + ' %', '· median day', median(ds), '· improvers median day', median(imp.map((r) => r.openedDay[id]).filter((x) => x !== undefined)));
  }
  const after2 = imp.map((r) => Object.values(r.openedDay).filter((d) => d > 2).length);
  console.log('improvers: venues opened after day 2 — median', median(after2), '· share with ≥ 1:', (100 * after2.filter((x) => x > 0).length / Math.max(1, imp.length)).toFixed(0) + ' %');
  for (const t of ['improver', 'early', 'stalled', 'weak']) {
    const rs = runs.filter((r) => r.type === t);
    if (!rs.length) continue;
    console.log(t.padEnd(9), 'n', rs.length, 'venues open at end (median)', median(rs.map((r) => Object.keys(r.opened).length)));
  }
  if (args.includes('--fixture')) {
    const pick = runs.filter((r) => r.type === 'improver').sort((a, b) => b.sessions - a.sessions)[0] || runs[0];
    const file = path.join(ROOT, 'tests', 'fixtures', 'game-longterm.js');
    const body = { learner: pick.lr.toJSON(), log: pick.log, game: pick.rec, trials: { rows: pick.trialRows.slice(-3000) }, t0: DAY0, t1: pick.log.sessions[pick.log.sessions.length - 1].end };
    fs.writeFileSync(file, '/* Simulated long-term profile for the game layer\'s browser tests (tests/unit/game-calibrate.mjs --fixture):\n' +
      '   a simulated "improver" learner (tests/sim/learners.mjs) after ' + DAYS + ' days of Edge sessions through the engine\'s planner and\n' +
      '   flow. No real player data. Times are shifted at load so the last session ends one day before "now". */\n' +
      'window.GAME_LONGTERM = ' + JSON.stringify(body) + ';\n');
    console.log('fixture written:', path.relative(ROOT, file), (fs.statSync(file).size / 1024).toFixed(0), 'KB; sessions', pick.sessions, 'opened', Object.keys(pick.opened).join(','));
  }
}
