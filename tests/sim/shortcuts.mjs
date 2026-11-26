// Shortcut responders written from the player's side. They see the prompt and the option list (and, for the
// "heard" responder, every word spoken in the mix without knowing who said it). Each must stay near chance:
// first / last position, most frequent past answer, only options seen as answers before, most different and most
// typical option (letter-bigram similarity), longest and shortest option, and the answer-position distribution.
import { norm } from './solver.mjs';

function bigrams(s) { s = ' ' + norm(s) + ' '; const out = new Set(); for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2)); return out; }
function dice(a, b) { const A = bigrams(a), B = bigrams(b); let n = 0; A.forEach((x) => { if (B.has(x)) n++; }); return (2 * n) / (A.size + B.size || 1); }

export function makeShortcutState() { return { past: {}, pos: {}, acc: {}, bins: {} }; }

function choose(rng, arr) { return arr[Math.floor(rng.next() * arr.length)]; }

// Spoken words in the mix, for the heard-word responder (target and maskers alike).
function heardWords(ES, spec) {
  const C = ES.data.manifest.clips, out = new Set();
  (spec.audio.parts || []).forEach((p) => { if (p.role === 'target' || p.role === 'masker') { const c = C[p.clip]; if (c && (c.kind === 'word' || c.kind === 'number' || c.kind === 'name')) out.add(norm(c.text)); } });
  if (spec.audio.live) { [spec.audio.live.target, ...spec.audio.live.decoys].forEach((d) => { const c = C[d.clip]; if (c) out.add(norm(c.text)); }); }
  return out;
}

const RESP = ['first', 'last', 'frequent', 'seen', 'different', 'typical', 'longest', 'shortest', 'heard'];

// Score every responder on every word slot of a spec; `bins` are the level labels this spec belongs to.
export function scoreSpec(ES, st, spec, bins, rng) {
  const heard = heardWords(ES, spec), ex = spec.ex;
  spec.question.slots.forEach((sl, si) => {
    if (sl.kind === 'locate' || !sl.options || sl.options.length < 2) return;
    const key = ex + '|' + sl.label.replace(/What did .* say\?/, 'What did X say?'), opts = sl.options, n = opts.length, ans = norm(sl.answer);
    const past = (st.past[key] = st.past[key] || {});
    const sims = opts.map((o, i) => opts.reduce((a, p, j) => (j === i ? a : a + dice(o, p)), 0) / (n - 1));
    const pickBy = (score, best) => { const v = opts.map(score), m = best(...v); return choose(rng, opts.filter((o, i) => v[i] === m)); };
    const seenOpts = opts.filter((o) => past[norm(o)]);
    const heardOpts = opts.filter((o) => heard.has(norm(o)));
    const picks = {
      first: opts[0], last: opts[n - 1],
      frequent: pickBy((o) => past[norm(o)] || 0, Math.max),
      seen: choose(rng, seenOpts.length ? seenOpts : opts),
      different: pickBy((o) => -sims[opts.indexOf(o)], Math.max),
      typical: pickBy((o) => sims[opts.indexOf(o)], Math.max),
      longest: pickBy((o) => norm(o).length, Math.max),
      shortest: pickBy((o) => -norm(o).length, Math.max),
      heard: heardOpts.length >= 2 ? choose(rng, heardOpts) : null
    };
    const chance = 1 / n, heardChance = heardOpts.length >= 2 ? 1 / heardOpts.length : null;
    for (const b of ['all', ...bins]) {
      const B = (st.bins[ex + '|' + b] = st.bins[ex + '|' + b] || { n: 0, chance: 0, hn: 0, hchance: 0, hits: Object.fromEntries(RESP.map((r) => [r, 0])), pos: {} });
      B.n++; B.chance += chance;
      const P = (B.pos[n] = B.pos[n] || new Array(n).fill(0)); P[opts.findIndex((o) => norm(o) === ans)]++;
      for (const r of RESP) {
        if (r === 'heard') { if (picks.heard !== null) { B.hn++; B.hchance += heardChance; if (norm(picks.heard) === ans) B.hits.heard++; } continue; }
        if (norm(picks[r]) === ans) B.hits[r]++;
      }
    }
    past[ans] = (past[ans] || 0) + 1;
  });
}

// Summarise: per bin, each responder's accuracy minus its chance level, flagged when beyond max(0.04, 3 SE).
export function summarise(st) {
  const out = {};
  for (const [k, B] of Object.entries(st.bins)) {
    const [ex, bin] = k.split('|'), c = B.chance / B.n, se = Math.sqrt(c * (1 - c) / B.n), tol = Math.max(0.04, 3.5 * se);
    const dev = {};
    let worst = 0, flag = [];
    for (const r of RESP) {
      if (r === 'heard') {
        if (!B.hn) continue;
        const hc = B.hchance / B.hn, d = B.hits.heard / B.hn - hc, hse = Math.sqrt(hc * (1 - hc) / B.hn);
        dev.heard = { acc: +(B.hits.heard / B.hn).toFixed(3), chance: +hc.toFixed(3), n: B.hn };
        if (Math.abs(d) > Math.max(0.04, 3.5 * hse)) flag.push('heard');
        continue;
      }
      const a = B.hits[r] / B.n, d = a - c;
      dev[r] = +a.toFixed(3);
      if (Math.abs(d) > Math.abs(worst)) worst = d;
      if (Math.abs(d) > tol) flag.push(r);
    }
    // answer position, per option count: largest deviation from uniform, in standard errors
    let posZ = 0; const pos = {};
    for (const [k, P] of Object.entries(B.pos)) {
      const m = P.reduce((a, x) => a + x, 0), u = 1 / +k;
      pos[k] = P.map((x) => +(x / m).toFixed(3));
      P.forEach((x) => { const z = Math.abs(x / m - u) / Math.sqrt(u * (1 - u) / m); if (z > posZ) posZ = z; });
    }
    if (posZ > 4) flag.push('position');
    (out[ex] = out[ex] || {})[bin] = { n: B.n, chance: +c.toFixed(3), worst: +worst.toFixed(3), tol: +tol.toFixed(3), flag, dev, pos };
  }
  return out;
}

// Level bins of a spec: every ordinal dial level, continuous dials in four bins of their range.
export function binsOf(ES, spec) {
  const out = [];
  for (const [id, v] of Object.entries(spec.setting.dials)) {
    if (v === null || v === undefined) continue;
    const d = ES.engine.dials[spec.ex].find((x) => x.id === id);
    if (!d) continue;
    if (d.kind === 'ord') out.push(id + '=' + v);
    else out.push(id + '~' + Math.min(3, Math.floor((v - d.min) / (d.max - d.min + 1e-9) * 4)));
  }
  if (spec.meta.task) out.push('task=' + spec.meta.task);
  return out;
}
