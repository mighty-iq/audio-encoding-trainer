// Answer-only cues on the data as built, three ways (review ST-03): mixed players (11 seeds, random variety),
// and single players at variety 0.3 and 1. Prints, per generator and responder, the largest excess over chance in
// any level bin (target ≤ +0.05) and the solver failures; --json writes the full bins.
// Run: node tests/sim/cues.mjs [--seeds 10000] [--solo 3000] [--gens echo,far] [--fixture] [--json out.json]
import fs from 'node:fs';
import { loadEngine } from './load.mjs';
import { runChecks } from './checks.mjs';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const ES = loadEngine({ realData: !args.includes('--fixture') }), gens = opt('gens', ES.engine.exercises.join(',')).split(',');
const R = ['frequent', 'seen', 'typical', 'different', 'hub', 'longest', 'shortest', 'first', 'last'];
const runs = { mixed: runChecks(ES, { seeds: +opt('seeds', 10000), gens }) };
for (const b of [0.3, 1]) runs['solo ' + b] = runChecks(ES, { seeds: +opt('solo', 3000), gens, solo: { breadth: b } });
const table = {};
for (const [name, res] of Object.entries(runs)) {
  for (const ex of Object.keys(res.shortcuts)) {
    const bins = res.shortcuts[ex], row = (table[ex] = table[ex] || {})[name] = { fails: res.solver[ex].fail, bins: Object.keys(bins).length };
    // per responder: the largest excess over chance in any bin, and whether any bin exceeds chance + 0.05 by more
    // than sampling noise (one-sided, 2.5 standard errors): '*' marks a real excess
    for (const r of R) {
      let best = -1, real = false;
      for (const B of Object.values(bins)) {
        const ex = (B.dev[r] ?? B.chance) - B.chance, se = Math.sqrt(B.chance * (1 - B.chance) / B.n);
        if (ex > best) best = ex;
        if (ex - 0.05 > 2.5 * se) real = true;
      }
      row[r] = (best >= 0 ? '' : '') + best.toFixed(3) + (real ? '*' : '');
    }
    row.heard = +Math.max(0, ...Object.values(bins).filter((B) => B.dev.heard).map((B) => B.dev.heard.acc - B.dev.heard.chance)).toFixed(3);
    row.position = Object.values(bins).some((B) => B.flag.includes('position')) ? 'flag' : 'ok';
  }
}
console.log('largest excess over chance in any level bin (target ≤ 0.05; * = above 0.05 beyond 2.5 standard errors); fails = solver failures');
console.log('ex       run       fails ' + R.map((r) => r.slice(0, 7).padStart(8)).join('') + '   heard position');
for (const [ex, rows] of Object.entries(table)) for (const [name, row] of Object.entries(rows)) {
  console.log(ex.padEnd(8) + ' ' + name.padEnd(9) + String(row.fails).padStart(6) + ' ' + R.map((r) => String(row[r]).padStart(8)).join('') + String(row.heard).padStart(8) + ' ' + row.position);
}
const jf = opt('json', null); if (jf) fs.writeFileSync(jf, JSON.stringify({ table, runs: Object.fromEntries(Object.entries(runs).map(([k, v]) => [k, v.shortcuts])) }, null, 1));
