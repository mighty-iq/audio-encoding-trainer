/* Earshot engine — controller.next(exId, ctx) → { dials, focus, anchor, warmup, p, target, ctxKey, family, … }.
   Edge (default): one focus dial at the edge (p ≈ 0.72), the other dials at comfort (component F = 0.92, i.e. a
   margin below their own thresholds, so every dimension advances); every 4th–5th trial and after two misses in a
   row an anchor (p ≈ 0.9: easy trials support learning and transfer: Hung & Seitz 2014, Liu et al. 2012); the first
   trials of a set and of a new condition are warm-ups (p ≈ 0.85; they do not move thresholds). Focus is chosen by
   recent learning progress plus an uncertainty bonus, with 20 % exploration (ZPDES-style bandit: R5 §1.3).
   Variety: same targets, focus uniform, variety at maximum. Focus: 60 % of trials on the dial behind the weakest
   probe (else the dial furthest below its prior). Free: caller's dial values, with a coach suggestion.
   Path: venue-ordered steps (path.js). No trial is planned below p = 0.65 (adaptation floor: Bradlow 2023). */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var E = ES.engine = ES.engine || {};
  var C = function () { return E.items.common; };

  // Lab probe → the exercise dial that trains its condition (Focus mode).
  var PROBE_MAP = { matrix: { ex: 'echo', dial: 'snr' }, digits: { ex: 'crowd', dial: 'tmr' }, twovoices: { ex: 'crowd', dial: 'similar' },
    rooms: { ex: 'far', dial: 'dist' }, newvoice: { ex: 'strange', dial: null }, story: { ex: 'echo', dial: 'details' } };
  var FAMILY_ORDER = ['accent', 'fast', 'phone', 'muffled', 'whisper', 'vocoded'];

  function M() { return E.model; }
  function lrOf(ctx) { return E.lrOf(ctx && ctx.learner); }
  function rnd(ctx) { return (ctx && ctx.rng) || ES.core.rng('controller'); }

  // Posterior cache for one decision (posteriors do not change while a trial is planned).
  function cached(lr, ex, ck) {
    var c = {};
    return { get: function (d) { return c[d.id] || (c[d.id] = lr.post(ex, d, ck)); } };
  }
  var PC = null;
  function comp(lr, ex, d, x, ck, zs) { return PC ? lr.compP(d, x, PC.get(d), zs, 0) : lr.compE(ex, d, x, ck, zs, 0); }
  function solv(lr, ex, d, need, ck, zs) { return PC ? lr.solveP(d, need, PC.get(d), zs, 0) : lr.solve(ex, d, need, ck, zs, 0); }
  function pAt(lr, ex, ck, act, dials, zs) {
    var F = 1;
    for (var i = 0; i < act.length; i++) F *= comp(lr, ex, act[i], dials[act[i].id], ck, zs);
    var g = lr.gammaOf(ex, dials);
    return g + (1 - g - M().lapse) * F;
  }
  function needF(lr, ex, dials, p) { var g = lr.gammaOf(ex, dials); return (p - g) / (1 - g - M().lapse); }
  function easiest(d) { return d.kind === 'ord' ? d.min : d.dir > 0 ? d.min : d.max; }
  function hardest(d) { return d.kind === 'ord' ? d.max : d.dir > 0 ? d.max : d.min; }
  function towardEasy(d, x) {
    if (d.kind === 'ord') return Math.max(d.min, Math.min(d.max, Math.floor(x + 1e-9)));
    var s = d.step, v = d.dir > 0 ? Math.floor(x / s + 1e-9) * s : Math.ceil(x / s - 1e-9) * s;
    return Math.max(d.min, Math.min(d.max, Math.round(v * 1000) / 1000));
  }

  // Level for dial d so that p ≈ target, other dials fixed in `dials` (mutates dials[d.id]).
  function levelFor(lr, ex, ck, act, d, dials, target, rng, zs, safe) {
    var res = { saturated: false, floor: false };
    if (d.kind === 'ord') {
      var ps = [];
      for (var i = d.min; i <= d.max; i++) { dials[d.id] = i; ps.push(pAt(lr, ex, ck, act, dials, zs)); }
      var x;
      if (ps[0] < target) { x = d.min; res.floor = true; }
      else if (ps[ps.length - 1] >= target) { x = d.max; res.saturated = true; }
      else {
        for (var j = 0; j < ps.length - 1; j++) {
          if (ps[j] >= target && ps[j + 1] < target) { var fr = (ps[j] - target) / Math.max(1e-6, ps[j] - ps[j + 1]); x = d.min + j + (!safe && rng.next() < fr ? 1 : 0); break; }
        }
      }
      dials[d.id] = x;
    } else {
      var others = 1;
      for (var k = 0; k < act.length; k++) if (act[k] !== d) others *= comp(lr, ex, act[k], dials[act[k].id], ck, zs);
      var need = needF(lr, ex, dials, target) / Math.max(1e-6, others);
      var xc;
      if (need >= 0.999) { xc = easiest(d); res.floor = true; }
      else if (need <= 0.001) { xc = hardest(d); res.saturated = true; }
      else xc = solv(lr, ex, d, need, ck, zs);
      var snapped = safe ? towardEasy(d, xc) : lr.snap(d, xc);
      if (snapped === hardest(d) && (d.dir > 0 ? xc > hardest(d) : xc < hardest(d))) res.saturated = true;
      if (snapped === easiest(d) && (d.dir > 0 ? xc < easiest(d) : xc > easiest(d))) res.floor = true;
      dials[d.id] = snapped;
    }
    res.p = pAt(lr, ex, ck, act, dials, zs);
    return res;
  }
  function comfortOf(lr, ex, ck, d, zs) { return towardEasy(d, solv(lr, ex, d, M().fc, ck, zs)); }
  // Every dial eased by the same share so that the product reaches p (anchors, warm-ups).
  function pinnedF(lr, ex, ck, act, pins, zs) {
    var F = 1; act.forEach(function (d) { if (pins[d.id] !== undefined) F *= comp(lr, ex, d, pins[d.id], ck, zs); });
    return F;
  }
  function equalShare(lr, ex, ck, act, p, zs, fixed, fDiv) {
    var dials = {}, n = act.length;
    act.forEach(function (d) { dials[d.id] = easiest(d); });
    if (fixed) Object.keys(fixed).forEach(function (k) { dials[k] = fixed[k]; });
    var each = Math.pow(Math.max(0.01, Math.min(0.999, needF(lr, ex, dials, p) / Math.max(0.05, fDiv || 1))), 1 / Math.max(1, n));
    act.forEach(function (d) { dials[d.id] = towardEasy(d, solv(lr, ex, d, Math.min(0.999, each), ck, zs)); });
    return dials;
  }

  // ---- family choice (exclusive dials, Strange): new families start blocked, then interleave once accuracy holds
  function famStats(lr, ex, fam) {
    var st = lr.state.cond, n = 0, acc = 0, w = 0;
    Object.keys(st).forEach(function (k) {
      if (k === ex + ':' + fam || k.indexOf(ex + ':' + fam + ':') === 0) { n += st[k].n; acc += st[k].acc * st[k].n; w += st[k].n; }
    });
    return { n: n, acc: w ? acc / w : 0.5 };
  }
  function chooseFamily(ex, ctx, mode) {
    var lr = lrOf(ctx), rng = rnd(ctx), set = ctx.set || {}, fams = E.dials[ex].filter(function (d) { return d.family; }).map(function (d) { return d.family; });
    var order = FAMILY_ORDER.filter(function (f) { return fams.indexOf(f) >= 0; });
    if (ctx.family && fams.indexOf(ctx.family) >= 0) return ctx.family;
    if (set.block && set.block.left > 0 && fams.indexOf(set.block.family) >= 0) { set.block.left--; return set.block.family; }
    var acquired = order.filter(function (f) { var s = famStats(lr, ex, f); return s.n >= 8 && s.acc >= 0.62; });
    var fresh = order.filter(function (f) { return acquired.indexOf(f) < 0; });
    var rec = lr.state.recent[ex] || [], hold = rec.length >= 8 && rec.slice(-10).reduce(function (a, b) { return a + b; }, 0) / Math.min(10, rec.length) >= 0.7;
    var breadth = ctx.breadth !== undefined ? ctx.breadth : (lr.state.breadth[ex] === undefined ? 0.2 : lr.state.breadth[ex]);
    var nRot = Math.max(1, Math.round(1 + breadth * (order.length - 1)));
    var startNew = fresh.length && (!acquired.length || (hold && acquired.length < nRot) || (mode === 'variety' && hold));
    var inBlock = fresh.filter(function (f) { return famStats(lr, ex, f).n > 0; });
    if (startNew || (!acquired.length && inBlock.length)) {
      var f0 = inBlock[0] || fresh[0];
      set.block = { family: f0, left: 7 };
      return f0;
    }
    var rot = acquired.slice(0, Math.max(1, nRot));
    if (mode === 'variety') { var alt = rot.filter(function (f) { return f !== set.lastFamily; }); return C().pick(rng, alt.length ? alt : rot); }
    if (mode === 'focus' && rng.next() < 0.6) {
      return rot.slice().sort(function (a, b) { return z(lr, ex, a, ex) - z(lr, ex, b, ex); })[0];
    }
    return bandit(lr, ex, ex, rot.map(function (f) { return E.dials[ex].filter(function (d) { return d.family === f; })[0]; }), rng).family;
  }
  // Trials seen in this exercise's context (Crowd keeps headphone and plain contexts apart).
  function exposureN(lr, ex, ck) {
    var st = lr.state.cond, n = 0;
    if (E.dialMeta[ex] && E.dialMeta[ex].hpContext) return ((st[ex + ':' + (ck !== ex ? 'hp' : 'base')]) || { n: 0 }).n;
    Object.keys(st).forEach(function (k) { if (k.indexOf(ex + ':') === 0) n += st[k].n; });
    return n;
  }
  function z(lr, ex, id, ck) { var d = E.dialDef(ex, id), p = lr.post(ex, d, ck); return (p.m - d.prior.m) * d.dir / d.prior.s; }

  // Learning-progress bandit over candidate dials.
  function bandit(lr, ex, ck, cands, rng) {
    if (cands.length === 1 || rng.next() < 0.2) return C().pick(rng, cands);
    var st = lr.state, scores = cands.map(function (d) {
      var r = st.dials[ck + '.' + d.id] || {}, h = r.h || [], p = lr.post(ex, d, ck);
      var lp = h.length >= 2 ? Math.max(0, h[h.length - 1] - h[Math.max(0, h.length - 4)]) : 0.3;
      var u = Math.min(1.5, d.slope * p.s), stale = Math.min(30, st.n - (r.lf || 0)) / 30;
      return 2 * lp + 0.5 * u + 0.4 * stale;
    });
    var mx = Math.max.apply(null, scores), w = scores.map(function (s) { return Math.exp((s - mx) / 0.25); });
    return C().weighted(rng, cands, w);
  }

  function next(ex, ctx) {
    ctx = ctx || {};
    var lr0 = lrOf(ctx), prev = PC;
    PC = cached(lr0, ex, lr0.ctxKey(ex, !!ctx.headphones));
    try { return nextRaw(ex, ctx); } finally { PC = prev; }
  }
  // Set counters: the flow runner keeps them itself (ctx.set.__flow); other callers pass the planner's set plus
  // ctx.index and ctx.prev (last results), and the counters live in a hidden memo on that set object.
  function setView(ctx, lr, ex) {
    var raw = ctx.set;
    if (raw && raw.__flow) return raw;
    var m = E.items.common.memo(ctx), idx = typeof ctx.index === 'number' ? ctx.index : (m.i || 0), prev = ctx.prev || [];
    if (m.lastAnchor === undefined) { m.lastAnchor = -1; m.anchorGap = 3 + (ES.core.hash(String((raw && raw.exId) || ex) + ':' + lr.state.n) % 2); }
    var misses = 0;
    for (var k = prev.length - 1; k >= 0; k--) { if ((+prev[k].prop || 0) < 0.5) misses++; else break; }
    m.i = idx; m.sinceAnchor = idx - m.lastAnchor - 1; m.misses = misses;
    m.kind = (raw && raw.kind) || m.kind || 'normal'; m.hint = (raw && raw.hint) || m.hint || null;
    return m;
  }
  function effBreadth(lr, ex, mode, ctx) {
    if (mode === 'variety') return 1;
    if (typeof ctx.breadthOverride === 'number') return ctx.breadthOverride;
    var b = lr.state.breadth[ex];
    return b === undefined ? 0.2 : b;
  }
  function nextRaw(ex, ctx) {
    var lr = lrOf(ctx), rng = rnd(ctx), md = M(), mode = ctx.mode || 'edge';
    var set = setView(ctx, lr, ex), meta = E.dialMeta[ex] || {};
    if (mode === 'path' && E.path && E.path.next) return E.path.next(ex, ctx);
    var ck = lr.ctxKey(ex, !!ctx.headphones), zs = lr.zStar(ex, ck), breadth = effBreadth(lr, ex, mode, ctx);
    var family = meta.families ? chooseFamily(ex, { learner: lr, rng: rng, set: set, breadth: breadth, family: ctx.family, lab: ctx.lab }, mode) : null;
    var out0 = decide(ex, ctx, lr, rng, md, set, mode, meta, ck, zs, family);
    out0.breadth = breadth;
    if (out0.anchor) { set.lastAnchor = set.i || 0; set.anchorGap = 3 + (rng.next() < 0.5 ? 0 : 1); }
    if (out0.family) set.lastFamily = out0.family;
    return out0;
  }
  function decide(ex, ctx, lr, rng, md, set, mode, meta, ck, zs, family) {
    var act = lr.active(ex, { ctxKey: ck, family: family });
    var out = { ex: ex, ctxKey: ck, family: family, anchor: false, warmup: false, mode: mode };
    // overnight re-test: yesterday's hardest condition (the caller avoids yesterday's voices)
    if (set.kind === 'overnight' && set.hint && (set.i || 0) < 3 && (!family || set.hint.family === family || meta.families)) {
      var hd = JSON.parse(JSON.stringify(set.hint.dials || {}));
      if (meta.families && set.hint.family) { family = out.family = set.hint.family; act = lr.active(ex, { ctxKey: ck, family: family }); }
      act.forEach(function (d) { if (hd[d.id] === undefined) hd[d.id] = comfortOf(lr, ex, ck, d, zs); });
      out.dials = pick(act, hd); out.focus = set.hint.focus || act[0].id; out.overnight = true;
      out.p = pAt(lr, ex, ck, act, out.dials, zs);
      if (out.p < md.floor) {
        // keep yesterday's hardest level on its dial; ease the others, then that dial only as far as the floor needs
        act.forEach(function (d) { if (d.id !== out.focus) out.dials[d.id] = easiest(d); });
        out.p = pAt(lr, ex, ck, act, out.dials, zs);
        if (out.p < md.floor) { var r1 = levelFor(lr, ex, ck, act, E.dialDef(ex, out.focus), out.dials, md.floor, rng, zs, true); out.p = r1.p; }
      }
      out.target = out.p;
      return out;
    }
    var condN = family ? famStats(lr, ex, family).n : exposureN(lr, ex, ck);
    var setWarm = set.kind === 'fresh' ? 3 : 2;
    out.warmup = (set.i || 0) < setWarm || condN < 4;
    out.anchor = !out.warmup && ((set.sinceAnchor || 0) >= (set.anchorGap || 4) || (set.misses || 0) >= 2);
    var dials;
    if (mode === 'free') {
      dials = {};
      var ov = ctx.overrides || {};
      act.forEach(function (d) { dials[d.id] = ov[d.id] !== undefined ? lr.snap(d, ov[d.id]) : comfortOf(lr, ex, ck, d, zs); });
      out.focus = Object.keys(ov).filter(function (k) { return dials[k] !== undefined; })[0] || act[0].id;
      out.dials = dials; out.p = pAt(lr, ex, ck, act, dials, zs); out.target = md.target; out.warmup = false; out.anchor = false;
      var fd = E.dialDef(ex, out.focus), trial = JSON.parse(JSON.stringify(dials));
      var r0 = levelFor(lr, ex, ck, act, fd, trial, md.target, ES.core.rng('coach'), zs);
      out.coach = { dial: out.focus, value: trial[out.focus], p: Math.round(r0.p * 100) / 100 };
      return out;
    }
    var pins = pinsOf(set, act, lr), free = act.filter(function (d) { return pins[d.id] === undefined; });
    if (Object.keys(pins).length) out.pinned = pins;
    if (out.warmup || out.anchor) {
      var tp = out.warmup ? md.warm : md.anchor;
      dials = free.length ? equalShare(lr, ex, ck, free, tp, zs, pins, pinnedF(lr, ex, ck, act, pins, zs)) : {};
      Object.keys(pins).forEach(function (id) { dials[id] = pins[id]; });
      out.focus = set.focus && dials[set.focus] !== undefined ? set.focus : (ctx.lastFocus && dials[ctx.lastFocus] !== undefined) ? ctx.lastFocus : (free[0] || act[0]).id;
      if (family) out.focus = act.filter(function (d) { return d.family; })[0].id;
      out.dials = dials; out.target = tp; out.p = pAt(lr, ex, ck, act, dials, zs);
      if (out.p < md.floor && Object.keys(pins).length) easePins(lr, ex, ck, act, dials, pins, md, zs, out);
      if (out.p < md.floor) out.floor = true; // even the easiest levels are predicted below the floor
      return out;
    }
    // edge trial: decide the focus among dials that can still be pushed (not saturated, not floored)
    var comfort = {};
    act.forEach(function (d) { comfort[d.id] = pins[d.id] !== undefined ? pins[d.id] : comfortOf(lr, ex, ck, d, zs); });
    var probe = [], cands = free.length ? free : act;
    if (set.focus && cands.some(function (d) { return d.id === set.focus; })) cands = cands.filter(function (d) { return d.id === set.focus; });
    cands.forEach(function (d) {
      var tr = JSON.parse(JSON.stringify(comfort));
      var r = levelFor(lr, ex, ck, act, d, tr, md.target, rng, zs);
      probe.push({ d: d, r: r, dials: tr });
    });
    // a dial whose estimate says even its easiest level is beyond the edge gets the focus now and then (12 %; at its
    // easiest level, the others eased): only its own focus trials can correct that estimate
    var floored = probe.filter(function (q) { return q.r.floor && q.r.p < md.floor && !q.d.family; });
    var ok = probe.filter(function (q) { return !(q.r.saturated && q.r.p > md.target + 0.06) && !(q.r.floor && q.r.p < md.floor); });
    if (floored.length && (!ok.length || rng.next() < 0.12)) ok = floored;
    if (!ok.length) ok = probe;
    var chosen, forced = ctx.forceFocus ? ok.filter(function (q) { return q.d.id === ctx.forceFocus; })[0] : null;
    if (forced && rng.next() < 0.7) chosen = forced;
    else if (family) chosen = ok.filter(function (q) { return q.d.family === family; })[0] || ok[0];
    else if (mode === 'variety') chosen = C().pick(rng, ok);
    else if (mode === 'focus' && rng.next() < 0.6) {
      var trainable = ok.filter(function (q) { return !(q.r.floor && q.r.p < md.floor); });
      chosen = focusPick(lr, ex, ck, trainable.length ? trainable : ok, ctx.lab);
    }
    else { var bd = bandit(lr, ex, ck, ok.map(function (q) { return q.d; }), rng); chosen = ok.filter(function (q) { return q.d === bd; })[0]; }
    dials = chosen.dials;
    out.focus = chosen.d.id; out.p = chosen.r.p; out.target = md.target;
    if (out.p < md.floor) {
      // adaptation floor: ease the other free dials, then pinned dials one step at a time, then the focus dial
      act.forEach(function (d) { if (d !== chosen.d && pins[d.id] === undefined) dials[d.id] = easiest(d); });
      var r2 = levelFor(lr, ex, ck, act, chosen.d, dials, md.target, rng, zs, true);
      out.p = r2.p;
      if (out.p < md.floor && Object.keys(pins).length) { easePins(lr, ex, ck, act, dials, pins, md, zs, out); var r3 = levelFor(lr, ex, ck, act, chosen.d, dials, md.target, rng, zs, true); out.p = r3.p; }
      if (out.p < md.floor) { dials[chosen.d.id] = easiest(chosen.d); out.p = pAt(lr, ex, ck, act, dials, zs); out.floor = true; }
    }
    if (chosen.r.saturated) out.saturated = true;
    out.dials = dials;
    return out;
  }
  function pick(act, dials) { var o = {}; act.forEach(function (d) { o[d.id] = dials[d.id]; }); return o; }
  // Pinned dials (venue sets: ctx.set.pin = {dialId: value}), snapped, active dials only.
  function pinsOf(set, act, lr) {
    var pin = set && set.pin, out = {};
    if (!pin) return out;
    act.forEach(function (d) { if (pin[d.id] !== undefined && pin[d.id] !== null) out[d.id] = lr.snap(d, pin[d.id]); });
    return out;
  }
  // Ease pinned dials one step at a time (never past their easiest level) until p reaches the floor.
  function easePins(lr, ex, ck, act, dials, pins, md, zs, out) {
    var guard = 0, ids = Object.keys(pins);
    while (out.p < md.floor && guard++ < 40) {
      var moved = false;
      ids.forEach(function (id) {
        var d = E.dialDef(ex, id), x = dials[id], nx = d.kind === 'ord' ? x - 1 : x - d.dir * d.step * 2;
        if (d.kind === 'ord' ? nx >= d.min : (d.dir > 0 ? nx >= d.min : nx <= d.max)) { dials[id] = lr.snap(d, nx); moved = true; (out.eased = out.eased || {})[id] = dials[id]; }
      });
      if (!moved) break;
      out.p = pAt(lr, ex, ck, act, dials, zs);
    }
  }
  function focusPick(lr, ex, ck, ok, lab) {
    var weakest = lab && lab.weakest && PROBE_MAP[lab.weakest];
    if (weakest && weakest.ex === ex && weakest.dial) { var hit = ok.filter(function (q) { return q.d.id === weakest.dial; })[0]; if (hit) return hit; }
    return ok.slice().sort(function (a, b) { return z(lr, ex, a.d.id, ck) - z(lr, ex, b.d.id, ck); })[0];
  }

  E.controller = { supports: { pin: true }, exposureN: exposureN, famStats: famStats, next: next, levelFor: levelFor, pAt: pAt, equalShare: equalShare, comfortOf: comfortOf, chooseFamily: chooseFamily,
    bandit: bandit, PROBE_MAP: PROBE_MAP, FAMILY_ORDER: FAMILY_ORDER };
})(typeof window !== 'undefined' ? window : globalThis);
