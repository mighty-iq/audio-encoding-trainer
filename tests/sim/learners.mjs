// Simulated learners for tests/sim/run.mjs. Each has, per (context, dial), a latent threshold that moves with
// practice: θ(n) = θ0 + dir·Δ·(1 − e^(−n/τ)), n = trials in that exercise. Types: improver (still learning at day
// 60), early (fast learner who stalls after ~2 weeks), stalled (no learning), weak (worse start, slow). True
// slopes differ from the engine's priors (×0.75–1.3), lapse 1–6 %, a day-to-day offset, a rapid-adaptation dip
// for a condition met for the first time, item difficulty that only partly matches the offsets the engine uses,
// and correlated slots (a quarter of trials share one draw across slots).
export const TYPES = [['improver', 0.6], ['early', 0.15], ['stalled', 0.2], ['weak', 0.05]];

function L(z) { return 1 / (1 + Math.exp(-z)); }
function gauss(r) { let u = 0, v = 0; while (u === 0) u = r.next(); v = r.next(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

export function makeLearner(ES, id, rng, forceType) {
  let t = forceType, x = rng.next(), acc = 0;
  if (!t) for (const [name, w] of TYPES) { acc += w; if (x < acc) { t = name; break; } }
  t = t || 'improver';
  // trials of practice per exercise over 60 days are ~100 (Seek) to ~700 (Crowd); improvers keep moving through it
  const tau = t === 'improver' ? 600 + rng.next() * 1400 : t === 'early' ? 150 + rng.next() * 150 : t === 'weak' ? 1500 + rng.next() * 1500 : 1e9;
  const gainL = t === 'stalled' ? 0 : t === 'weak' ? 0.5 + rng.next() * 0.5 : t === 'early' ? 0.8 + rng.next() * 0.7 : 1.2 + rng.next() * 1.0; // logits
  return { id, type: t, tau, gainL, adherence: 0.45 + rng.next() * 0.4, headphones: rng.next() < 0.3, lapse: 0.01 + rng.next() * 0.05,
    dials: {}, practice: {}, cond: {}, rng, ES };
}

function trueDial(S, ck, d) {
  const k = ck + '.' + d.id;
  if (!S.dials[k]) {
    const r = S.rng, shift = S.type === 'weak' ? -1.2 * d.prior.s * d.dir : 0;
    S.dials[k] = { th0: d.prior.m + 0.8 * d.prior.s * gauss(r) + shift, slope: d.slope * (0.75 + 0.55 * r.next()),
      gain: (S.gainL * (0.6 + 0.8 * r.next())) / d.slope };
  }
  return S.dials[k];
}
// True threshold now (dial units), after n trials of practice in the exercise.
export function trueTheta(S, ex, ck, d) {
  const td = trueDial(S, ck, d), n = S.practice[ex] || 0;
  return td.th0 + d.dir * td.gain * (1 - Math.exp(-n / S.tau));
}

// Probability of a correct slot for a trial spec (the engine's own parameterisation of thresholds).
export function pTrue(S, spec, dayOffset) {
  const ES = S.ES, E = ES.engine, ex = spec.ex, lr = E.learner, ck = spec.meta.ctxKey || ex;
  const dials = spec.setting.dials, zs = lr.zStar(ex, ck);
  const act = lr.active(ex, { ctxKey: ck, family: lr.familyOf(ex, dials) }).filter((d) => dials[d.id] !== undefined && dials[d.id] !== null);
  const meta = E.dialMeta[ex], prim = meta.primary && dials[meta.primary] !== undefined;
  const item = 0.8 * (spec.meta.offsetDb || 0) + 0.5 * (spec.meta.itemNoise || 0);
  let F = 1;
  for (const d of act) {
    const td = trueDial(S, ck, d), th = trueTheta(S, ex, ck, d);
    let z = zs - td.slope * d.dir * (dials[d.id] - th) + dayOffset;
    if (prim ? d.id === meta.primary : d.id === spec.setting.focus) z -= (prim ? td.slope : 0.25) * item;
    F *= L(z);
  }
  // rapid adaptation to a condition met for the first time (log-shaped: Cooke 2022)
  const ckey = ex + ':' + spec.meta.cond, nC = S.cond[ckey] || 0;
  if (/accent|vocoded|fast|whisper|phone|muffled|room/.test(String(spec.meta.cond))) F *= L(2.2 - 1.6 * Math.exp(-nC / 3)) / L(2.2);
  const slots = spec.question.slots, g = slots.reduce((a, sl) => a + (sl.gamma !== undefined ? sl.gamma : 1 / Math.max(1, sl.options.length)), 0) / slots.length;
  return g + (1 - g - S.lapse) * F;
}

// Respond to a spec: picks per slot; correct with the true probability, coupled across slots a quarter of the time.
export function respond(S, spec, dayOffset) {
  const p = pTrue(S, spec, dayOffset), r = S.rng, coupled = r.next() < 0.25, shared = r.next() < p;
  const picks = spec.question.slots.map((sl) => {
    const ok = coupled ? shared : r.next() < p;
    if (sl.kind === 'locate') return ok ? { x: sl.answer.x, y: sl.answer.y } : { x: sl.answer.x + 0.9, y: sl.answer.y + 0.9 };
    if (ok) return sl.answer;
    const wrong = sl.options.filter((o) => o !== sl.answer);
    return wrong[Math.floor(r.next() * wrong.length)];
  });
  S.cond[spec.ex + ':' + spec.meta.cond] = (S.cond[spec.ex + ':' + spec.meta.cond] || 0) + 1;
  S.practice[spec.ex] = (S.practice[spec.ex] || 0) + 1;
  return { picks, p };
}

// Synthetic trial spec (same fields the learner and flow read) for fast simulation; every Nth trial uses the
// real generator instead (see run.mjs).
const SIZES = ['small', 'medium', 'large', 'hall'];
export function synthSpec(ES, ex, setting, ctx, r) {
  const E = ES.engine, meta = E.dialMeta[ex], lr = ctx.learner, ck = lr.ctxKey(ex, !!ctx.headphones);
  let cond = 'base', family = null;
  if (ex === 'crowd') cond = ck !== ex ? 'hp' : 'base';
  if (ex === 'far') { const i = Math.min(3, Math.floor(setting.dials.rt60 / 2.6)); cond = 'room:' + SIZES[(ctx.breadth >= 0.5 && r.next() < 0.4) ? Math.max(0, Math.min(3, i + (r.next() < 0.5 ? 1 : -1))) : i]; }
  if (ex === 'strange') { family = Object.keys(setting.dials)[0]; cond = family === 'accent' ? 'accent:' + ['es', 'fr', 'zh', 'hi', 'ja'][Math.floor(r.next() * (1 + 4 * (ctx.breadth || 0)))] : family; }
  const k = meta.slots || 1, nOpt = ex === 'voices' ? E.dials.voices[0].values[setting.dials.cast || 0] : 4;
  const slots = [];
  for (let i = 0; i < k; i++) slots.push({ label: 's' + i, options: Array.from({ length: nOpt }, (_, j) => 'o' + j), answer: 'o0', foils: {} });
  if (ex === 'seek') slots[0] = { label: 'loc', kind: 'locate', answer: { x: 0, y: 0, r: 0.1 }, gamma: 0.03, options: [], foils: {} };
  return { id: 'syn', ex, setting: { dials: setting.dials, focus: setting.focus, anchor: setting.anchor, warmup: setting.warmup },
    question: { slots }, audio: { parts: [] }, feedback: {}, picture: {},
    meta: { ctxKey: ck, cond, family, offsetDb: Math.round(gauss(r) * 10) / 10, itemNoise: gauss(r), voices: ['syn.v' + Math.floor(r.next() * 30)] } };
}
