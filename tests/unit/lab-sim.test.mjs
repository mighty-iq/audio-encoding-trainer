// Lab: simulated players check the change statistics end to end (real probe code, real schedule, real trend):
// with the default schedule (the Matrix runs twice at a check-in while its verdict is not clear, for at most 8
// check-ins) a true 1.5 dB Matrix gain reads "clear" within 4 weekly check-ins for most players, a zero gain rarely does,
// and the 90 % interval covers the true gain. Small n here (fast); the full rates come from
// `node tests/unit/lab-simreport.mjs` (n = 500) and are recorded in docs/dev/progress/lab.md.
import { loadLab, runSim } from './lab-simlib.mjs';

export function setup() { return loadLab(); }
const N = +(process.env.LAB_SIM_N || 60);

export const tests = {
  'Matrix (default schedule): a true 1.5 dB gain is flagged clear by check-in 4 in most simulated players'(ES, assert) {
    const r = runSim(ES, 'matrix', { n: N, gain: 1.5, seed: 11 });
    console.log('    matrix gain 1.5: ever clear by check-in 1–4', r.everClearBy.map((x) => Math.round(100 * x) + '%').join(' '),
      '· likely or clear at 4', Math.round(100 * r.likelyOrClear[3]) + '%', '· 90 % coverage', Math.round(100 * r.coverage90) + '%');
    assert.ok(r.everClearBy[3] >= (N >= 200 ? 0.7 : 0.6), 'clear by check-in 4: ' + r.everClearBy[3]);
    assert.ok(r.coverage90 >= 0.8, 'coverage ' + r.coverage90);
    assert.ok(Math.abs(r.meanGainEst - 1.5) < 0.35, 'mean gain estimate ' + r.meanGainEst);
    assert.ok(Math.abs(r.meanReportedRunSd - r.runErrorSd) < 0.2, 'reported run SD ' + r.meanReportedRunSd + ' vs true ' + r.runErrorSd);
  },
  'Matrix (default schedule): a zero gain is rarely flagged clear (false clear verdicts by check-in 4)'(ES, assert) {
    const r = runSim(ES, 'matrix', { n: N, gain: 0, seed: 12 });
    console.log('    matrix gain 0: ever clear by check-in 1–4', r.everClearBy.map((x) => Math.round(100 * x) + '%').join(' '),
      '· ever below baseline', Math.round(100 * r.everLowerBy[3]) + '%');
    assert.ok(r.everClearBy[3] <= 0.12, 'false clear rate ' + r.everClearBy[3]);
    assert.ok(r.coverage90 >= 0.8, 'coverage ' + r.coverage90);
  }
};
