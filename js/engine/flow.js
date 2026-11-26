/* Earshot engine — set runner used by the exercise views and the simulations.
   const sc = ES.engine.flow.start('crowd', { mode, learner, seed, headphones, kind, hint, lab, overrides, trials });
   let spec; while ((spec = ES.engine.flow.next(sc))) { …render, play, collect response…; ES.engine.flow.answer(sc, spec, response); }
   const setRecord = ES.engine.flow.end(sc);  // goes into log.sessions[].sets (CONTRACTS §7)
   Saves are the caller's job, between trials (never during a stimulus). */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var E = ES.engine = ES.engine || {};

  // Exercise index (dB-equivalent; higher = better): mean gain over the prior, in logits, scaled by the primary
  // dB dial's slope when the exercise has one (so Crowd's index reads in dB of voice level), else by 0.25/dB.
  function index(lr, ex, ck) {
    var meta = E.dialMeta[ex] || {}, ref = meta.primary ? E.dialDef(ex, meta.primary).slope : 0.25;
    var act = lr.active(ex, { ctxKey: ck, allFamilies: true }), sum = 0, n = 0;
    act.forEach(function (d) {
      var p = lr.post(ex, d, ck);
      if (!p.n) return;
      sum += d.dir * d.slope * (p.m - d.prior.m); n++;
    });
    return n ? Math.round(sum / n / ref * 100) / 100 : 0;
  }

  function start(ex, opts) {
    opts = opts || {};
    var lr = opts.learner || E.learner, seed = opts.seed !== undefined ? opts.seed : 'set:' + ex + ':' + lr.state.n;
    var meta = E.dialMeta[ex] || {};
    var sc = { ex: ex, mode: opts.mode || 'edge', lr: lr, rng: ES.core.rng(seed), seed: seed, i: 0,
      n: opts.trials || meta.setTrials || 20, headphones: !!opts.headphones, lab: opts.lab || null, overrides: opts.overrides || null,
      playerSeed: opts.playerSeed || (lr.state.seed = lr.state.seed || ('p' + ES.core.hash(String(lr.clock())))),
      met: opts.met, avoidVoices: opts.avoidVoices || null, breadth: opts.breadth, kind: opts.kind || 'normal',
      set: { i: 0, sinceAnchor: 0, anchorGap: 3 + (ES.core.hash(String(seed)) % 2), misses: 0, block: null, lastFamily: null,
        kind: opts.kind || 'normal', hint: opts.hint || null },
      recentVoices: [], lastRoom: null, results: [], voices: {}, startIdx: index(lr, ex, lr.ctxKey(ex, !!opts.headphones)), pending: null };
    if (sc.kind === 'fresh') sc.fresh = { before: sc.startIdx, daysAway: opts.daysAway || null };
    return sc;
  }
  function breadthFor(sc) {
    if (sc.breadth !== undefined) return sc.breadth;
    if (sc.mode === 'variety') return 1;
    if (sc.mode === 'path') { var ps = sc.lr.state.path[sc.ex]; var st = ps ? E.path.steps(sc.ex)[ps.i] : null; return st && st.mix ? 0.6 : 0.25; }
    var b = sc.lr.state.breadth[sc.ex];
    return b === undefined ? 0.2 : b;
  }
  function next(sc) {
    if (sc.i >= sc.n) return null;
    var lr = sc.lr, ex = sc.ex, plat = lr.state.plat[ex] || {};
    if (plat.anchorBoost > 0) sc.set.anchorGap = Math.min(sc.set.anchorGap, 2);
    var dec = E.controller.next(ex, { mode: sc.mode, rng: sc.rng.fork('c' + sc.i), learner: lr, headphones: sc.headphones, set: sc.set,
      breadth: sc.mode === 'variety' ? 1 : undefined, lab: sc.lab, overrides: sc.overrides, lastFocus: sc.lastFocus, forceFocus: plat.forceN > 0 ? plat.forceFocus : null });
    var setting = { dials: dec.dials, focus: dec.focus, anchor: !!dec.anchor, warmup: !!dec.warmup, seed: sc.seed + ':' + sc.i };
    var ctx = { breadth: breadthFor(sc), headphones: sc.headphones, recentVoices: sc.recentVoices, avoidVoices: sc.set.kind === 'overnight' && sc.i < 3 ? sc.avoidVoices : null,
      playerSeed: sc.playerSeed, lastRoom: sc.lastRoom, learner: lr, met: sc.met, family: dec.family };
    var spec = E.items[ex].make(sc.rng.fork('m' + sc.i), setting, ctx);
    // a condition met for the first time (new accent, room type, task) is a warm-up whatever its level (R2 §1.0)
    var c = lr.state.cond[ex + ':' + spec.meta.cond];
    if (!spec.setting.warmup && (!c || c.n < 3) && sc.mode !== 'free') { spec.setting.warmup = true; spec.setting.warmupReason = 'new condition'; }
    spec.meta.decision = { p: Math.round(dec.p * 1000) / 1000, target: dec.target, mode: dec.mode, path: dec.path || null, overnight: !!dec.overnight,
      floor: !!dec.floor, saturated: !!dec.saturated, coach: dec.coach || null };
    sc.pending = spec;
    return spec;
  }
  function answer(sc, spec, response) {
    var lr = sc.lr, ex = sc.ex, res = E.score(spec, response), upd = lr.update(spec, res), pr = null, set = sc.set;
    if (sc.mode === 'path') pr = E.path.record(ex, spec, res, lr);
    var st = spec.setting, plat = lr.state.plat[ex];
    if (plat && plat.forceN > 0) plat.forceN--;
    if (plat && plat.anchorBoost > 0) plat.anchorBoost--;
    set.i++; sc.i++;
    if (st.anchor) { set.sinceAnchor = 0; set.anchorGap = 3 + (sc.rng.fork('g' + sc.i).next() < 0.5 ? 0 : 1); set.misses = 0; }
    else if (!st.warmup) set.sinceAnchor++;
    set.misses = res.prop < 0.5 ? set.misses + 1 : 0;
    if (spec.meta.family) set.lastFamily = spec.meta.family;
    var tv = spec.meta.voices && spec.meta.voices[0];
    if (tv) { sc.recentVoices.unshift(tv); if (sc.recentVoices.length > 3) sc.recentVoices.pop(); }
    (spec.meta.voices || []).forEach(function (v) { sc.voices[v] = 1; });
    if (spec.meta.room) sc.lastRoom = spec.meta.room;
    if (!st.anchor && !st.warmup) sc.lastFocus = st.focus;
    sc.results.push({ prop: res.prop, correct: res.correct, anchor: !!st.anchor, warmup: !!st.warmup, focus: st.focus, p: spec.meta.decision.p,
      intrusions: res.intrusions, overnight: spec.meta.decision.overnight, dials: st.dials });
    sc.pending = null;
    return { result: res, update: upd, path: pr, done: sc.i >= sc.n };
  }
  function end(sc) {
    var lr = sc.lr, ex = sc.ex, ck = lr.ctxKey(ex, sc.headphones), R = sc.results, n = R.length;
    var endV = {}, sd = {}, focus = {}, nOk = 0, sum = 0, anchors = 0, warm = 0;
    lr.active(ex, { ctxKey: ck, allFamilies: true }).forEach(function (d) {
      var p = lr.post(ex, d, ck); if (!p.n) return;
      endV[d.id] = Math.round(p.m * 100) / 100; sd[d.id] = Math.round(p.s * 100) / 100;
    });
    R.forEach(function (r) { if (r.correct) nOk++; sum += r.prop; if (r.anchor) anchors++; if (r.warmup) warm++; if (!r.anchor && !r.warmup) focus[r.focus] = (focus[r.focus] || 0) + 1; });
    var mainFocus = Object.keys(focus).sort(function (a, b) { return focus[b] - focus[a]; })[0] || null;
    var idx = index(lr, ex, ck), best = lr.state.best[ck];
    var pb = n >= 5 && best !== undefined && idx > best + 0.3;
    if (best === undefined || idx > best) lr.state.best[ck] = idx;
    var out = { ex: ex, n: n, correct: nOk, acc: n ? Math.round(sum / n * 1000) / 1000 : 0, focus: mainFocus, end: endV, sd: sd, pb: !!pb,
      idx: idx, startIdx: sc.startIdx, mode: sc.mode, ctxKey: ck, anchors: anchors, warmups: warm, breadth: breadthFor(sc), voices: Object.keys(sc.voices) };
    if (sc.kind === 'overnight') {
      var on = R.filter(function (r) { return r.overnight; });
      out.overnight = { n: on.length, prop: on.length ? Math.round(on.reduce(function (a, r) { return a + r.prop; }, 0) / on.length * 100) / 100 : null,
        expected: sc.set.hint ? sc.set.hint.p : null, focus: sc.set.hint ? sc.set.hint.focus : null };
    }
    if (sc.fresh) out.fresh = { daysAway: sc.fresh.daysAway, before: sc.fresh.before, after: idx };
    if (sc.mode === 'path') { var ps = lr.state.path[ex]; out.path = ps ? { i: ps.i, best: ps.best } : null; }
    return out;
  }
  // Listen-only exposure examples of a condition just trained (between sets; never a repeat-aloud step).
  function exposure(ex, opts) {
    opts = opts || {};
    var gen = E.items[ex];
    if (!gen || !gen.exposure) return [];
    var lr = opts.learner || E.learner, rng = ES.core.rng(opts.seed || 'exp:' + ex + ':' + lr.state.n), ck = lr.ctxKey(ex, !!opts.headphones);
    var family = E.dialMeta[ex].families ? (opts.family || E.controller.chooseFamily(ex, { learner: lr, rng: rng, set: {} }, 'edge')) : null;
    var act = lr.active(ex, { ctxKey: ck, family: family }), zs = lr.zStar(ex, ck), dials = {};
    act.forEach(function (d) { dials[d.id] = E.controller.comfortOf(lr, ex, ck, d, zs); });
    return gen.exposure(rng, { dials: dials, focus: act[0] && act[0].id }, { learner: lr, headphones: !!opts.headphones, breadth: 0.5, family: family, playerSeed: opts.playerSeed });
  }

  E.flow = { start: start, next: next, answer: answer, end: end, exposure: exposure, index: index };
})(typeof window !== 'undefined' ? window : globalThis);
