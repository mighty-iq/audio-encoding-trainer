// Simulated players for the Lab's change statistics (used by lab-sim.test.mjs and for the rates reported in
// docs/dev/progress/lab.md). Each simulated player runs the real probe code (js/lab/probes*.js) trial by trial,
// answering from a psychometric listener model, on the real schedule (practice run, two baseline runs, then
// weekly check-ins), and the real trend model gives the verdict after every check-in.
// Listener model (assumptions, from docs/research/R4): word-level logistic with slope 0.11–0.20 per dB, lapse 2 %,
// closed-set guessing; fixed word difficulty offsets (SD 1 dB after homogenisation) and a sentence-level random
// effect (SD 0.6 dB) so words of one sentence co-vary; day-to-day variation 0.3 dB; practice deficit 1.77 × 0.35^(r−1) dB
// (≈ +1.15 dB from run 1 to 2 and +0.4 dB from run 2 to 3, like matrix tests); a training gain that grows linearly
// from the end of the baseline to the fourth weekly check-in (shape 'ramp'; also 'exp' with a 10-day time constant,
// and 'step': present from the first weekly check-in on). MIT licence.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const LAB_PURE = ['js/lab/stats.js', 'js/lab/materials.js', 'js/lab/procedures.js', 'js/lab/probes.js', 'js/lab/probes-more.js'];
export const SCHEDULE_DAYS = [0, 1, 2, 9, 16, 23, 30];   // practice, baseline 1, baseline 2, weekly check-ins 1–4

export function loadLab(extra = []) {
  const ctx = { console, Math, Date, JSON, Object, Array, Number, String, Boolean, Error, Map, Set, Float64Array, Float32Array, Uint32Array };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of ['js/core/ns.js', 'js/core/util.js', 'js/core/rng.js', 'tests/fixtures/lab-data.js', ...LAB_PURE, ...extra]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  }
  return ctx.ES;
}

function gauss(r) { let u = 0, v = 0; while (u === 0) u = r.next(); v = r.next(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const F = (x, th, s) => 1 / (1 + Math.exp(-4 * s * (x - th)));

/** One simulated player through the schedule; returns the verdict after each weekly check-in (and the runs). */
export function simulatePlayer(ES, probeId, cfg) {
  const L = ES.lab, P = L.probes[probeId], S = L.stats, rng = ES.core.rng('sim:' + probeId + ':' + cfg.seed + ':' + cfg.player);
  const base = { matrix: -6, digits: -10, twovoices: -2 }[probeId];
  const between = { matrix: 1.5, digits: 1.5, twovoices: 3 }[probeId];
  const th0 = base + between * gauss(rng), s = { matrix: 0.11 + 0.09 * rng.next(), digits: 0.11 + 0.09 * rng.next(), twovoices: 0.05 + 0.05 * rng.next() }[probeId];
  const wordOff = {};
  const offOf = (w) => { if (wordOff[w] === undefined) wordOff[w] = (cfg.wordSd ?? 1.0) * gauss(ES.core.rng('word:' + w)); return wordOff[w]; };
  const days = cfg.days || SCHEDULE_DAYS, gainEnd = days[days.length - 1], gainStart = days[2];
  const runs = [], verdicts = [];
  let prevEst;
  days.forEach((day, r) => {
    const deficit = (cfg.practice ?? 1.77) * Math.pow(0.35, r);
    const frac = Math.max(0, Math.min(1, (day - gainStart) / (gainEnd - gainStart)));
    const g = cfg.gain * (cfg.shape === 'step' ? (day > gainStart ? 1 : 0) : cfg.shape === 'exp' ? (day > gainStart ? (1 - Math.exp(-(day - gainStart) / 10)) / (1 - Math.exp(-(gainEnd - gainStart) / 10)) : 0) : frac);
    const thDay = th0 + deficit - g + (cfg.daySd ?? 0.3) * gauss(rng);
    const run = P.make(r, rng.fork('run' + r), { prevEst, playerSeed: 'p' + cfg.player });
    let t;
    while ((t = run.next())) {
      const sent = (cfg.sentSd ?? 0.6) * gauss(rng);
      let resp;
      if (t.ui.kind === 'matrix') {
        resp = { picks: t.answer.map((w, i) => {
          const know = rng.next() < 0.98 * F(t.level - offOf(w) - sent, thDay, s);
          return know ? w : t.ui.columns[i].options[Math.floor(rng.next() * t.ui.columns[i].options.length)];
        }) };
      } else if (t.ui.kind === 'keypad') {
        resp = { digits: t.answer.map((d) => (rng.next() < 0.98 * F(t.level - sent, thDay - 2.5, s) ? d : String(Math.floor(rng.next() * 10)))) };
      } else if (t.ui.kind === 'choice') {
        const know = rng.next() < 0.97 * F(t.level - sent, thDay, s);
        resp = { pick: know ? t.answer : t.ui.options[Math.floor(rng.next() * t.ui.options.length)] };
      }
      run.record(t, resp);
    }
    const f = run.finish();
    prevEst = f.est.m;
    runs.push({ t: day, y: f.est.m, s: f.est.s, r: r + 1, practice: r === 0, truth: thDay });
    if (r >= 3) {
      const tr = S.trend(runs, { better: P.better, sigmaX: P.sigmaX, practice: P.practice });
      verdicts.push({ week: r - 2, verdict: tr.verdict, gain: tr.gain, sd: tr.sd, lo90: tr.lo90, hi90: tr.hi90, sdc: tr.sdc });
    }
  });
  return { runs, verdicts, th0 };
}

/** Rates over n players: share with "clear" at check-in k, ever "clear" by check-in k, and the interval's coverage. */
export const DOUBLE_DAYS = [0, 1, 2, 9, 9.02, 16, 16.02, 23, 23.02, 30, 30.02];   // with the optional second Matrix run
export function runSim(ES, probeId, { n = 200, gain = 1.5, seed = 1, double = false, ...rest } = {}) {
  const weeks = 4, clearAt = Array(weeks).fill(0), everBy = Array(weeks).fill(0), likelyOrClear = Array(weeks).fill(0), lowerBy = Array(weeks).fill(0);
  let cover = 0, gains = [], runErr = [], runSd = [];
  if (double) rest.days = DOUBLE_DAYS;
  for (let p = 0; p < n; p++) {
    const sim = simulatePlayer(ES, probeId, { ...rest, gain, seed, player: p });
    if (double) sim.verdicts = sim.verdicts.filter((v, k) => k % 2 === 1);   // after the second run of each check-in
    let ever = false, low = false;
    sim.verdicts.forEach((v, k) => {
      if (v.verdict === 'clear') clearAt[k]++;
      if (v.verdict === 'clear' || v.verdict === 'likely') likelyOrClear[k]++;
      if (v.verdict === 'clear') ever = true;
      if (v.verdict === 'lower') low = true;
      if (ever) everBy[k]++;
      if (low) lowerBy[k]++;
    });
    const last = sim.verdicts[weeks - 1];
    if (last.lo90 <= gain && gain <= last.hi90) cover++;
    gains.push(last.gain);
    // within-player error of each run estimate around that run's true threshold (player offsets removed)
    const errs = sim.runs.map((r) => r.y - r.truth), me = errs.reduce((x, y) => x + y, 0) / errs.length;
    errs.forEach((e) => runErr.push(e - me));
    sim.runs.forEach((r) => runSd.push(r.s));
  }
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const k = (double ? DOUBLE_DAYS : SCHEDULE_DAYS).length;
  const pooledSd = Math.sqrt(runErr.reduce((x, y) => x + y * y, 0) / (runErr.length * (k - 1) / k));
  return { probe: probeId, n, gain, clearAt: clearAt.map((c) => c / n), everClearBy: everBy.map((c) => c / n),
    likelyOrClear: likelyOrClear.map((c) => c / n), everLowerBy: lowerBy.map((c) => c / n), coverage90: cover / n,
    meanGainEst: mean(gains), runErrorSd: pooledSd, meanReportedRunSd: mean(runSd) };
}
