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
  function lrOf(ctx) { return (ctx && ctx.learner) || E.learner; }
  function rnd(ctx) { return (ctx && ctx.rng) || ES.core.rng('controller'); }

  function pAt(lr, ex, ck, act, dials, zs) {
    var F = 1;
    for (var i = 0; i < act.length; i++) F *= lr.compE(ex, act[i], dials[act[i].id], ck, zs, 0);
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
  function levelFor(lr, ex, ck, act, d, dials, target, rng, zs) {
    var res = { saturated: false, floor: false };
    if (d.kind === 'ord') {
      var ps = [];
      for (var i = d.min; i <= d.max; i++) { dials[d.id] = i; ps.push(pAt(lr, ex, ck, act, dials, zs)); }
      var x;
      if (ps[0] < target) { x = d.min; res.floor = true; }
      else if (ps[ps.length - 1] >= target) { x = d.max; res.saturated = true; }
      else {
        for (var j = 0; j < ps.length - 1; j++) {
          if (ps[j] >= target && ps[j + 1] < target) { var fr = (ps[j] - target) / Math.max(1e-6, ps[j] - ps[j + 1]); x = d.min + j + (rng.next() < fr ? 1 : 0); break; }
        }
      }
      dials[d.id] = x;
    } else {
      var others = 1;
      for (var k = 0; k < act.length; k++) if (act[k] !== d) others *= lr.compE(ex, act[k], dials[act[k].id], ck, zs, 0);
      var need = needF(lr, ex, dials, target) / Math.max(1e-6, others);
      var xc;
      if (need >= 0.999) { xc = easiest(d); res.floor = true; }
      else if (need <= 0.001) { xc = hardest(d); res.saturated = true; }
      else xc = lr.solve(ex, d, need, ck, zs, 0);
      var snapped = lr.snap(d, xc);
      if (snapped === hardest(d) && (d.dir > 0 ? xc > hardest(d) : xc < hardest(d))) res.saturated = true;
      if (snapped === easiest(d) && (d.dir > 0 ? xc < easiest(d) : xc > easiest(d))) res.floor = true;
      dials[d.id] = snapped;
    }
    res.p = pAt(lr, ex, ck, act, dials, zs);
    return res;
  }
  function comfortOf(lr, ex, ck, d, zs) { return towardEasy(d, lr.solve(ex, d, M().fc, ck, zs, 0)); }
  // Every dial eased by the same share so that the product reaches p (anchors, warm-ups).
  function equalShare(lr, ex, ck, act, p, zs) {
    var dials = {}, n = act.length;
    act.forEach(function (d) { dials[d.id] = easiest(d); });
    var each = Math.pow(Math.max(0.01, Math.min(0.999, needF(lr, ex, dials, p))), 1 / Math.max(1, n));
    act.forEach(function (d) { dials[d.id] = towardEasy(d, lr.solve(ex, d, Math.min(0.999, each), ck, zs, 0)); });
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
    var lr = lrOf(ctx), rng = rnd(ctx), md = M(), set = ctx.set || {}, mode = ctx.mode || 'edge';
    var meta = E.dialMeta[ex] || {};
    if (mode === 'path' && E.path && E.path.next) return E.path.next(ex, ctx);
    var ck = lr.ctxKey(ex, !!ctx.headphones), zs = lr.zStar(ex, ck);
    var family = meta.families ? chooseFamily(ex, ctx, mode) : null;
    var act = lr.active(ex, { ctxKey: ck, family: family });
    var out = { ex: ex, ctxKey: ck, family: family, anchor: false, warmup: false, mode: mode };
    // overnight re-test: yesterday's hardest condition (the caller avoids yesterday's voices)
    if (set.kind === 'overnight' && set.hint && (set.i || 0) < 3 && (!family || set.hint.family === family || meta.families)) {
      var hd = JSON.parse(JSON.stringify(set.hint.dials || {}));
      if (meta.families && set.hint.family) { family = out.family = set.hint.family; act = lr.active(ex, { ctxKey: ck, family: family }); }
      act.forEach(function (d) { if (hd[d.id] === undefined) hd[d.id] = comfortOf(lr, ex, ck, d, zs); });
      out.dials = pick(act, hd); out.focus = set.hint.focus || act[0].id; out.overnight = true;
      out.p = pAt(lr, ex, ck, act, out.dials, zs); out.target = out.p;
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
    if (out.warmup || out.anchor) {
      var tp = out.warmup ? md.warm : md.anchor;
      dials = equalShare(lr, ex, ck, act, tp, zs);
      out.focus = (ctx.lastFocus && dials[ctx.lastFocus] !== undefined) ? ctx.lastFocus : act[0].id;
      if (family) out.focus = act.filter(function (d) { return d.family; })[0].id;
      out.dials = dials; out.target = tp; out.p = pAt(lr, ex, ck, act, dials, zs);
      return out;
    }
    // edge trial: decide the focus among dials that can still be pushed (not saturated, not floored)
    var comfort = {};
    act.forEach(function (d) { comfort[d.id] = comfortOf(lr, ex, ck, d, zs); });
    var probe = [];
    act.forEach(function (d) {
      var tr = JSON.parse(JSON.stringify(comfort));
      var r = levelFor(lr, ex, ck, act, d, tr, md.target, rng, zs);
      probe.push({ d: d, r: r, dials: tr });
    });
    var ok = probe.filter(function (q) { return !(q.r.saturated && q.r.p > md.target + 0.06) && !(q.r.floor && q.r.p < md.floor); });
    if (!ok.length) ok = probe.filter(function (q) { return !(q.r.floor && q.r.p < md.floor); });
    if (!ok.length) ok = probe;
    var chosen, forced = ctx.forceFocus ? ok.filter(function (q) { return q.d.id === ctx.forceFocus; })[0] : null;
    if (forced && rng.next() < 0.7) chosen = forced;
    else if (family) chosen = ok.filter(function (q) { return q.d.family === family; })[0] || ok[0];
    else if (mode === 'variety') chosen = C().pick(rng, ok);
    else if (mode === 'focus' && rng.next() < 0.6) chosen = focusPick(lr, ex, ck, ok, ctx.lab);
    else { var bd = bandit(lr, ex, ck, ok.map(function (q) { return q.d; }), rng); chosen = ok.filter(function (q) { return q.d === bd; })[0]; }
    dials = chosen.dials;
    out.focus = chosen.d.id; out.p = chosen.r.p; out.target = md.target;
    if (out.p < md.floor) {
      // adaptation floor: ease the other dials, then everything
      act.forEach(function (d) { if (d !== chosen.d) dials[d.id] = easiest(d); });
      var r2 = levelFor(lr, ex, ck, act, chosen.d, dials, md.target, rng, zs);
      out.p = r2.p;
      if (out.p < md.floor) { dials[chosen.d.id] = easiest(chosen.d); out.p = pAt(lr, ex, ck, act, dials, zs); out.floor = true; }
    }
    if (chosen.r.saturated) out.saturated = true;
    out.dials = dials;
    return out;
  }
  function pick(act, dials) { var o = {}; act.forEach(function (d) { o[d.id] = dials[d.id]; }); return o; }
  function focusPick(lr, ex, ck, ok, lab) {
    var weakest = lab && lab.weakest && PROBE_MAP[lab.weakest];
    if (weakest && weakest.ex === ex && weakest.dial) { var hit = ok.filter(function (q) { return q.d.id === weakest.dial; })[0]; if (hit) return hit; }
    return ok.slice().sort(function (a, b) { return z(lr, ex, a.d.id, ck) - z(lr, ex, b.d.id, ck); })[0];
  }

  E.controller = { exposureN: exposureN, next: next, levelFor: levelFor, pAt: pAt, equalShare: equalShare, comfortOf: comfortOf, chooseFamily: chooseFamily,
    bandit: bandit, PROBE_MAP: PROBE_MAP, FAMILY_ORDER: FAMILY_ORDER };
})(typeof window !== 'undefined' ? window : globalThis);
