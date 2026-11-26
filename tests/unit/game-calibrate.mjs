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
import { makeLearner, respond, synthSpec } from '../sim/learners.mjs';

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const N = +opt('learners', 40), DAYS = +opt('days', 42), DAY = 86400000, DAY0 = Date.UTC(2026, 8, 7, 17, 0, 0);
const FILES = (await engineFiles()).concat(await gamePure());

export function simulate({ learners = N, days = DAYS, type = null, seed = 'cal', onSession = null, synthEvery = 25 } = {}) {
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
    const log = { sessions: [] }, opened = {}, rec = { v: 1, venues: {}, cast: {}, badges: {}, pbs: {}, weekly: {} }, series = [];
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
        while ((spec = E.flow.next(sc))) { const { picks } = respond(S, spec, off); now += 7000; E.flow.answer(sc, spec, { picks }); }
        sess.sets.push(E.flow.end(sc));
      }
      sess.end = now;
      log.sessions.push(sess);
      const states = G.venues.state({ rec });
      states.forEach((s) => {
        const sv = rec.venues[s.id] = rec.venues[s.id] || {};
        if (s.open && !sv.open) { sv.open = now; opened[s.id] = log.sessions.length; }
        const e = s.earshot;
        if (e && (e.status === 'in' || e.status === 'beyond')) {
          sv.h = (sv.h || []).concat([[now, e.x]]).slice(-80);
          if (G.milestones.venueBetter(s.venue, e, sv.best)) { sv.best = e.x; sv.bestAt = now; }
        }
      });
      G.milestones.check(rec, { venues: G.venues.state({ rec }) }).forEach((m) => { rec.badges[m.id] = now; });
      series.push(Object.fromEntries(states.map((s) => [s.id, s.earshot.status === 'none' ? null : s.earshot.x])));
      if (onSession) onSession({ li, S, lr, log, now, states });
    }
    out.push({ li, type: S.type, sessions: log.sessions.length, opened, series, lr, log, rec });
  }
  G.core.setLearner(null);
  return { ES, runs: out };
}

function median(a) { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y); return b[Math.floor((b.length - 1) / 2)]; }

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const t0 = Date.now(), { ES, runs } = simulate();
  const ids = ES.game.data.ids;
  console.log(`learners ${runs.length}, days ${DAYS}, ${((Date.now() - t0) / 1000).toFixed(1)} s; median sessions ${median(runs.map((r) => r.sessions))}`);
  for (const id of ids) {
    const at = runs.map((r) => r.opened[id]).filter((x) => x !== undefined);
    const by = (k) => runs.filter((r) => r.opened[id] !== undefined && r.opened[id] <= k).length / runs.length;
    const last = runs.map((r) => r.series[r.series.length - 1] && r.series[r.series.length - 1][id]).filter((x) => x !== null && x !== undefined);
    console.log(id.padEnd(11), 'open by s3', by(3).toFixed(2), 's6', by(6).toFixed(2), 's12', by(12).toFixed(2), 'end', (at.length / runs.length).toFixed(2),
      'median session', median(at), 'final earshot median', last.length ? median(last).toFixed(2) : '-');
  }
  for (const t of ['improver', 'early', 'stalled', 'weak']) {
    const rs = runs.filter((r) => r.type === t);
    if (!rs.length) continue;
    console.log(t.padEnd(9), 'n', rs.length, 'venues open at end (median)', median(rs.map((r) => Object.keys(r.opened).length)));
  }
  if (args.includes('--fixture')) {
    const pick = runs.filter((r) => r.type === 'improver').sort((a, b) => b.sessions - a.sessions)[0] || runs[0];
    const file = path.join(ROOT, 'tests', 'fixtures', 'game-longterm.js');
    const body = { learner: pick.lr.toJSON(), log: pick.log, game: pick.rec, t0: DAY0, t1: pick.log.sessions[pick.log.sessions.length - 1].end };
    fs.writeFileSync(file, '/* Simulated long-term profile for the game layer\'s browser tests (tests/unit/game-calibrate.mjs --fixture):\n' +
      '   a simulated "improver" learner (tests/sim/learners.mjs) after ' + DAYS + ' days of Edge sessions through the engine\'s planner and\n' +
      '   flow. No real player data. Times are shifted at load so the last session ends one day before "now". */\n' +
      'window.GAME_LONGTERM = ' + JSON.stringify(body) + ';\n');
    console.log('fixture written:', path.relative(ROOT, file), (fs.statSync(file).size / 1024).toFixed(0), 'KB; sessions', pick.sessions, 'opened', Object.keys(pick.opened).join(','));
  }
}
