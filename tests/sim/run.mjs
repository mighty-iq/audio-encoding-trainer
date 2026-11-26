// Engine verification: generator checks (independent solver + shortcut responders over `--seeds` trials per
// generator) and simulated learners (`--learners` × `--days` per mode) through the real planner, flow, controller,
// learner, path and plateau code. Most simulated trials use a synthetic spec with the fields the engine reads;
// every 25th trial, and every Voices trial, uses the real generator.
// Usage: node tests/sim/run.mjs [--seeds 10000] [--learners 200] [--days 60] [--modes edge,path,variety,focus]
//        [--skip-checks] [--skip-sim] [--json out.json]
import fs from 'node:fs';
import { loadEngine } from './load.mjs';
import { runChecks } from './checks.mjs';
import { makeLearner, respond, synthSpec, trueTheta } from './learners.mjs';

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes('--' + k);
const SEEDS = +opt('seeds', 10000), N = +opt('learners', 200), DAYS = +opt('days', 60);
const MODES = opt('modes', 'edge,path,variety,focus').split(',');
const DAY = 86400000, DAY0 = Date.UTC(2026, 0, 5, 17, 0, 0);
const q = (a, p) => { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(p * (b.length - 1)))]; };
const mean = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const r3 = (x) => x === null || x === undefined ? null : Math.round(x * 1000) / 1000;
function gauss(r) { let u = 0; while (u === 0) u = r.next(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r.next()); }

const report = { at: new Date().toISOString(), seeds: SEEDS, learners: N, days: DAYS };

// ---------- generator checks ----------
if (!flag('skip-checks')) {
  const ES = loadEngine(), t0 = Date.now();
  const res = runChecks(ES, { seeds: SEEDS });
  report.checks = { secs: (Date.now() - t0) / 1000, solver: res.solver, shortcuts: {} };
  for (const [ex, bins] of Object.entries(res.shortcuts)) {
    const flagged = Object.entries(bins).filter(([, v]) => v.flag.length).map(([b, v]) => ({ bin: b, n: v.n, flags: v.flag, dev: v.dev }));
    const worst = Math.max(...Object.values(bins).map((v) => Math.abs(v.worst)));
    report.checks.shortcuts[ex] = { all: bins.all, bins: Object.keys(bins).length, flagged, worstDev: r3(worst) };
  }
  console.log('checks done in', report.checks.secs, 's');
  for (const [ex, r] of Object.entries(res.solver)) console.log(`  solver ${ex}: ${r.n} trials, ${r.fail} failing`, JSON.stringify(r.errors));
  for (const [ex, s] of Object.entries(report.checks.shortcuts)) console.log(`  shortcuts ${ex}: worst |acc−chance| ${s.worstDev} over ${s.bins} bins; flagged ${s.flagged.length}`, JSON.stringify(s.all.dev));
}

// ---------- simulated learners ----------
function trueIdx(ES, S, ex, ck) {
  const E = ES.engine, meta = E.dialMeta[ex], ref = meta.primary ? E.dialDef(ex, meta.primary).slope : 0.25;
  const act = E.learner.active(ex, { ctxKey: ck, allFamilies: true });
  return act.reduce((a, d) => a + d.dir * d.slope * (trueTheta(S, ex, ck, d) - d.prior.m), 0) / act.length / ref;
}

function simMode(mode) {
  const ES = loadEngine(), E = ES.engine;
  if (opt('drift', null)) E.model.driftScale = +opt('drift', 1);
  const out = { mode, learners: [], times: [], plateau: [], path: [], variety: { diffVoice: 0, n: 0, diffFam: 0, nFam: 0 },
    focus: { dist: 0, farEdge: 0, farSets: 0, sets: 0 } };
  const lab = mode === 'focus' ? { weakest: 'rooms' } : null;
  const ctrlNext = E.controller.next;
  E.controller.next = function (ex, ctx) { const t = performance.now(); const r = ctrlNext(ex, ctx); out.times.push(performance.now() - t); return r; };
  for (let li = 0; li < N; li++) {
    const r = ES.core.rng('sim:' + mode + ':' + li), S = makeLearner(ES, li, r.fork('who'));
    let now = DAY0;
    const lr = E.learner.create(null, () => now);
    lr.state.seed = 'sim' + li;
    const log = { sessions: [] }, L = { type: S.type, trials: 0, days: [], acc7: [], edge7: [], anch: 0, warm: 0, floorPlanned: 0, predEdge: [], obsEdge: [], series: {}, sessionsWith: {} };
    let sid = 0, prevVoice = null, prevFam = null;
    const synth = (ex, setting, ctx, sc) => (ex === 'voices' || sc.i % 25 === 7) ? E.items[ex].make(sc.rng.fork('m' + sc.i), setting, ctx) : synthSpec(ES, ex, setting, ctx, sc.rng.fork('s' + sc.i));
    for (let day = 0; day < DAYS; day++) {
      if (r.next() > S.adherence) continue;
      const nSess = r.next() < 0.1 ? (r.next() < 0.3 ? 3 : 2) : 1;
      for (let k = 0; k < nSess; k++) {
        now = DAY0 + day * DAY + k * 3 * 3600000;
        const dayOff = 0.12 * gauss(r), plan = E.planner.session({ learner: lr, log, now, mode, lab, rng: r.fork('plan' + day + ':' + k) });
        const sess = { id: 's' + sid++, start: now, end: now, activeMs: 0, mode, sets: [] };
        for (const st of plan.sets) {
          out.focus.sets++; if (st.exId === 'far') out.focus.farSets++;
          const sc = E.flow.start(st.exId, { mode, learner: lr, seed: 'sim:' + li + ':' + sid + ':' + st.exId, headphones: S.headphones, kind: st.kind, hint: st.hint,
            avoidVoices: st.avoidVoices, lab, synth, daysAway: st.daysAway });
          let spec;
          while ((spec = E.flow.next(sc))) {
            const { picks } = respond(S, spec, dayOff);
            now += 7000;
            const res = E.flow.answer(sc, spec, { picks }).result, setg = spec.setting;
            L.trials++;
            if (setg.anchor) L.anch++;
            if (setg.warmup) L.warm++;
            if (!setg.warmup && spec.meta.decision.p < E.model.floor - 1e-9 && mode !== 'path') L.floorPlanned++;
            if (day >= 7) {
              L.acc7.push(res.prop);
              if (!setg.anchor && !setg.warmup && !spec.meta.decision.overnight) { L.edge7.push(res.prop); L.predEdge.push(spec.meta.decision.p); }
            }
            if (mode === 'focus' && st.exId === 'far' && !setg.anchor && !setg.warmup) { out.focus.farEdge++; if (setg.focus === 'dist') out.focus.dist++; }
            if (mode === 'variety' && spec.id !== 'syn') {
              const v = spec.meta.voices[0]; if (prevVoice) { out.variety.n++; if (v !== prevVoice) out.variety.diffVoice++; } prevVoice = v;
            }
            if (mode === 'variety' && spec.meta.family && !setg.warmup) {
              if (prevFam) { out.variety.nFam++; if (spec.meta.family !== prevFam) out.variety.diffFam++; } prevFam = spec.meta.family;
            }
          }
          const rec = E.flow.end(sc);
          sess.sets.push(rec);
          prevVoice = null; prevFam = null;
        }
        sess.end = now;
        log.sessions.push(sess);
        const exs = [...new Set(sess.sets.map((s) => s.ex))];
        for (const ex of exs) {
          const ck = lr.ctxKey(ex, S.headphones);
          L.sessionsWith[ex] = (L.sessionsWith[ex] || 0) + 1;
          (L.series[ex] = L.series[ex] || []).push({ n: L.sessionsWith[ex], est: sess.sets.filter((s) => s.ex === ex).pop().idx, tru: trueIdx(ES, S, ex, ck), practice: S.practice[ex] || 0 });
          const pr = flag('no-breakers') ? null : E.plateau.check(ex, { learner: lr, log, now, headphones: S.headphones });
          if (pr) {
            E.plateau.apply(ex, pr, { learner: lr, log });
            const ser = L.series[ex], w = ser.slice(-6), trueSlope = w.length >= 2 ? (w[w.length - 1].tru - w[0].tru) / (w.length - 1) : 0;
            out.plateau.push({ li, type: S.type, ex, at: L.sessionsWith[ex], kind: pr.breaker.kind, trueSlope, estSlope: pr.trend.slope });
          }
        }
      }
    }
    // end-of-run calibration: posterior mean vs true threshold, in logits
    const errs = [];
    for (const ex of E.exercises) {
      const ck = lr.ctxKey(ex, S.headphones);
      E.learner.active(ex, { ctxKey: ck, allFamilies: true }).forEach((d) => {
        const p = lr.post(ex, d, ck);
        if (p.n >= 20) errs.push(d.slope * Math.abs(p.m - trueTheta(S, ex, ck, d)));
      });
    }
    if (mode === 'path') for (const ex of E.exercises) { const ps = lr.state.path[ex]; if (ps) out.path.push({ li, ex, i: ps.i, best: ps.best, of: E.path.steps(ex).length }); }
    if (flag('dump')) (out.dump = out.dump || []).push({ li, type: S.type, headphones: S.headphones, log, series: L.series });
    out.learners.push({ type: L.type, trials: L.trials, acc7: mean(L.acc7), edge7: mean(L.edge7), pred7: mean(L.predEdge), anchors: L.anch / Math.max(1, L.trials),
      warm: L.warm / Math.max(1, L.trials), floorPlanned: L.floorPlanned, calibErr: errs, series: L.series, breadth: { ...lr.state.breadth } });
    if ((li + 1) % 50 === 0) console.log(`  ${mode}: ${li + 1}/${N} learners`);
  }
  return out;
}

function summarise(o) {
  const Ls = o.learners, acc = Ls.map((l) => l.acc7).filter((x) => x !== null), edge = Ls.map((l) => l.edge7).filter((x) => x !== null);
  const calib = Ls.flatMap((l) => l.calibErr), times = o.times;
  const s = { mode: o.mode, learners: Ls.length, trialsPerLearner: r3(mean(Ls.map((l) => l.trials))),
    accAll: { mean: r3(mean(acc)), p5: r3(q(acc, 0.05)), p50: r3(q(acc, 0.5)), p95: r3(q(acc, 0.95)) },
    accEdge: { mean: r3(mean(edge)), p5: r3(q(edge, 0.05)), p95: r3(q(edge, 0.95)), predicted: r3(mean(Ls.map((l) => l.pred7).filter((x) => x !== null))) },
    anchors: r3(mean(Ls.map((l) => l.anchors))), warmups: r3(mean(Ls.map((l) => l.warm))), floorPlannedTrials: Ls.reduce((a, l) => a + l.floorPlanned, 0),
    calibration: { dials: calib.length, medianLogitErr: r3(q(calib, 0.5)), p95LogitErr: r3(q(calib, 0.95)), over1_5: calib.filter((e) => e > 1.5).length },
    controllerMs: { median: r3(q(times, 0.5)), p99: r3(q(times, 0.99)), p999: r3(q(times, 0.999)), max: r3(times.reduce((a, b) => (b > a ? b : a), 0)), calls: times.length } };
  // plateau: stalled = true trailing-6 slope < 0.05 dB-eq/session; improving = ≥ 0.15
  const pairs = [];
  Ls.forEach((l, li) => Object.entries(l.series).forEach(([ex, ser]) => { if (ser.length >= 6) pairs.push({ li, ex, ser, type: l.type }); }));
  const fired = {}; o.plateau.forEach((p) => { (fired[p.li + ':' + p.ex] = fired[p.li + ':' + p.ex] || []).push(p); });
  const slopeAt = (ser, k) => { const w = ser.slice(Math.max(0, k - 6), k); return w.length >= 2 ? (w[w.length - 1].tru - w[0].tru) / (w.length - 1) : null; };
  let stalledPairs = 0, stalledDetected = 0, latencies = [], improvPairs = 0, improvFalse = 0, firings = o.plateau.length, falseFirings = 0;
  pairs.forEach((p) => {
    const f = fired[p.li + ':' + p.ex] || [];
    f.forEach((x) => { const sl = slopeAt(p.ser, x.at); if (sl !== null && sl >= 0.15) falseFirings++; });
    // first session index from which the true trend stays flat to the end
    let flatFrom = null;
    for (let k = 6; k <= p.ser.length; k++) { const sl = slopeAt(p.ser, k); if (sl !== null && sl < 0.05) { if (flatFrom === null) flatFrom = k; } else flatFrom = null; }
    if (flatFrom !== null && p.ser.length - flatFrom >= 4) {
      stalledPairs++;
      const hit = f.find((x) => x.at >= flatFrom);
      if (hit) { stalledDetected++; latencies.push(hit.at - flatFrom); }
    }
    const improving = p.ser.some((_, k) => k >= 6 && slopeAt(p.ser, k) >= 0.15);
    if (improving) { improvPairs++; if (f.some((x) => { const sl = slopeAt(p.ser, x.at); return sl !== null && sl >= 0.15; })) improvFalse++; }
  });
  s.plateau = { firings, falseFirings, stalledPairs, stalledDetected, detectRate: r3(stalledDetected / Math.max(1, stalledPairs)),
    latencyMedian: q(latencies, 0.5), latencyP90: q(latencies, 0.9), improvingPairs: improvPairs, improvingWithFalseAlarm: improvFalse,
    falseAlarmRate: r3(improvFalse / Math.max(1, improvPairs)), byKind: o.plateau.reduce((a, p) => { a[p.kind] = (a[p.kind] || 0) + 1; return a; }, {}) };
  if (o.mode === 'path') {
    const byEx = {};
    o.path.forEach((p) => { (byEx[p.ex] = byEx[p.ex] || []).push(p); });
    s.path = Object.fromEntries(Object.entries(byEx).map(([ex, a]) => [ex, { learners: a.length, meanStep: r3(mean(a.map((p) => p.i))), of: a[0].of,
      advanced3plus: r3(a.filter((p) => p.best >= 3).length / a.length), stuckAt0: a.filter((p) => p.best === 0).length }]));
  }
  if (o.mode === 'variety') s.variety = { newVoiceShare: r3(o.variety.diffVoice / Math.max(1, o.variety.n)), newFamilyShare: r3(o.variety.diffFam / Math.max(1, o.variety.nFam)),
    breadthMean: r3(mean(Ls.flatMap((l) => Object.values(l.breadth)))) };
  else s.breadthMean = r3(mean(Ls.flatMap((l) => Object.values(l.breadth))));
  if (o.mode === 'focus') s.focus = { farShareOfSets: r3(o.focus.farSets / Math.max(1, o.focus.sets)), distShareOfFarEdge: r3(o.focus.dist / Math.max(1, o.focus.farEdge)) };
  return s;
}

if (!flag('skip-sim')) {
  report.sim = {};
  for (const m of MODES) {
    const t0 = Date.now(), o = simMode(m), s = summarise(o);
    s.secs = (Date.now() - t0) / 1000;
    report.sim[m] = s;
    if (o.dump) fs.writeFileSync(opt('dump-file', '/tmp/earshot-dump.json'), JSON.stringify(o.dump));
    console.log(JSON.stringify(s));
  }
}
const jf = opt('json', null);
if (jf) fs.writeFileSync(jf, JSON.stringify(report, null, 1));
