// Prints the simulation rates for docs/dev/progress/lab.md: node tests/unit/lab-simreport.mjs [n] [probes]
import { loadLab, runSim } from './lab-simlib.mjs';
const ES = loadLab(), n = +(process.argv[2] || 500), probes = (process.argv[3] || 'matrix,digits,twovoices').split(',');
const pc = (x) => Math.round(100 * x) + ' %';
console.log('| probe | true gain | shape | clear at check-in 1–4 | ever clear by 4 | likely or clear at 4 | 90 % interval covers truth | run SD true / reported |');
console.log('|---|---|---|---|---|---|---|---|');
for (const p of probes) for (const [gain, shape, policy] of [[1.5, 'ramp'], [1.5, 'exp'], [1.5, 'step'], [0, 'ramp'], [1.5, 'ramp', 'single'], [0, 'ramp', 'single']]) {
  if (p !== 'matrix' && (shape !== 'ramp' || policy)) continue;
  const r = runSim(ES, p, { n, gain, seed: 101, shape, policy });
  console.log(`| ${p}${p === 'matrix' ? (policy === 'single' ? ' (one run per check-in)' : ' (default: twice until clear)') : ''} | ${gain} dB | ${gain ? shape : '—'} | ${r.clearAt.map(pc).join(' · ')} | ${pc(r.everClearBy[3])} | ${pc(r.likelyOrClear[3])} | ${pc(r.coverage90)} | ${r.runErrorSd.toFixed(2)} / ${r.meanReportedRunSd.toFixed(2)} dB |`);
}
