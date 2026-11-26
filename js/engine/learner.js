/* Earshot engine — learner model (CONTRACTS §5, store key `learner` §7).
   Per (context, dial) a posterior over the threshold θ: the level where p = target (0.72) with the other dials
   at comfort. Model: p = γ + (1 − γ − λ) · Π_i F_i(x_i), F_i(x) = L(z* − β_i·dir_i·(x − θ_i)), one logistic
   component per active dial; z* makes θ the target level when the other typical dials sit at comfort (F = fc).
   The posterior is stored as a Gaussian {m, s}; each trial multiplies it on an 81-point grid by the trial's
   per-slot likelihood (proportion correct, slots discounted for correlation), then moment-matches. A random-walk
   drift per trial and per day away lets the estimate follow learning (QUEST-style posteriors assume a stationary
   observer: R5 §1.2). Warm-up trials (first items of a new condition: R2 §1.0) do not move thresholds. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.engine = ES.engine || {};
  var E = ES.engine;
  var LN2PI8 = Math.PI / 8, GRID = 81, DAY = 86400000;

  function L(z) { return z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)); }
  function logit(p) { p = Math.min(1 - 1e-9, Math.max(1e-9, p)); return Math.log(p / (1 - p)); }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  E.math = { L: L, logit: logit, clamp: clamp };

  function dialsOf(ex) { return (E.dials && E.dials[ex]) || []; }
  function dialDef(ex, id) { var a = dialsOf(ex); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function meta(ex) { return (E.dialMeta && E.dialMeta[ex]) || { gamma: 0.25, slots: 1 }; }
  function M() { return E.model; }
  E.dialDef = dialDef;

  // Context: Crowd with headphones keeps its own posteriors (spatial dial changes what "comfort" means).
  function ctxKey(ex, hp) {
    var m = meta(ex);
    return m.hpContext && hp ? ex + '@hp' : ex;
  }
  function isHp(ck) { return ck.indexOf('@hp') > 0; }
  function baseEx(ck) { return ck.split('@')[0]; }
  // Dials active in a context; for family exercises, only the named family (plus shared non-family dials).
  function active(ex, opts) {
    opts = opts || {};
    var hp = opts.ctxKey ? isHp(opts.ctxKey) : !!opts.headphones;
    return dialsOf(ex).filter(function (d) {
      if (d.requires === 'headphones' && !(hp && meta(ex).hpContext)) return false;
      if (d.family && opts.family !== undefined && opts.family !== null && d.family !== opts.family) return false;
      if (d.family && (opts.family === undefined || opts.family === null)) return !!opts.allFamilies;
      return true;
    });
  }
  function nTyp(ex, ck) {
    if (meta(ex).families) return 1;
    return Math.max(1, active(ex, { ctxKey: ck }).length);
  }
  function zStar(ex, ck) {
    var m = meta(ex), md = M();
    var fT = (md.target - m.gamma) / (1 - m.gamma - md.lapse);
    return logit(Math.min(0.995, fT / Math.pow(md.fc, nTyp(ex, ck) - 1)));
  }

  function create(initial, clock) {
    var self = {};
    self.clock = clock || function () { return Date.now(); };
    self.state = fresh();
    if (initial) load(initial);

    function fresh() { return { v: 1, n: 0, dials: {}, breadth: {}, recent: {}, cond: {}, path: {}, best: {}, plat: {}, cast: {} }; }
    function load(obj) {
      var s = fresh();
      if (obj && typeof obj === 'object' && (obj.v === 1 || obj.v === undefined)) {
        ['dials', 'breadth', 'recent', 'cond', 'path', 'best', 'plat', 'cast'].forEach(function (k) {
          if (obj[k] && typeof obj[k] === 'object') s[k] = JSON.parse(JSON.stringify(obj[k]));
        });
        s.n = +obj.n || 0;
        if (typeof obj.seed === 'string') s.seed = obj.seed;
      }
      self.state = s;
      return self;
    }
    function key(ck, id) { return ck + '.' + id; }

    // Posterior with day-drift applied lazily (not stored until the next update).
    function post(ex, d, ck) {
      var r = self.state.dials[key(ck || ex, d.id)];
      var pr = d.prior;
      if (!r && isHp(ck || '') ) {
        // seed the headphone context from the plain context (spatial release makes TMR easier: ~-4 dB at comfort)
        var base = self.state.dials[key(baseEx(ck), d.id)];
        if (base) r = { m: base.m + (d.id === 'tmr' ? -3 : 0), s: Math.max(base.s, pr.s * 0.7), n: 0, at: base.at };
      }
      if (!r) return { m: pr.m, s: pr.s, n: 0, at: 0, prior: true };
      var s2 = r.s * r.s;
      if (r.at) {
        var days = Math.min(30, Math.max(0, (self.clock() - r.at) / DAY));
        var qd = d.drift * 4;
        s2 += qd * qd * days;
      }
      return { m: r.m, s: Math.min(Math.sqrt(s2), pr.s * 1.5), n: r.n || 0, at: r.at || 0 };
    }
    function est(ex, id, ck) {
      var d = typeof id === 'object' ? id : dialDef(ex, id);
      var p = post(ex, d, ck || ex);
      return { m: p.m, s: p.s, n: p.n };
    }
    // Expected component E[F(x)] over θ ~ N(m, s²) (probit approximation).
    function compE(ex, d, x, ck, zs, offsetLogit) {
      var p = post(ex, d, ck), b = d.slope;
      var k = 1 / Math.sqrt(1 + LN2PI8 * b * b * p.s * p.s);
      return L(k * ((zs === undefined ? zStar(ex, ck) : zs) - b * d.dir * (x - p.m) - (offsetLogit || 0)));
    }
    // Level x (unclamped, continuous) at which E[F] = need.
    function solve(ex, d, need, ck, zs, offsetLogit) {
      var p = post(ex, d, ck), b = d.slope;
      var k = Math.sqrt(1 + LN2PI8 * b * b * p.s * p.s);
      var z = (zs === undefined ? zStar(ex, ck) : zs) - (offsetLogit || 0);
      return p.m + d.dir * (z - k * logit(need)) / b;
    }
    function gammaOf(ex, dials) { var m = meta(ex); return m.gammaOf ? m.gammaOf(dials || {}) : m.gamma; }
    // Item difficulty: on the exercise's primary dB dial when active, else a logit shift on the focus component.
    function offsetFor(ex, d, dials, offsetDb, focus) {
      if (!offsetDb) return 0;
      var m = meta(ex);
      if (m.primary && dials && dials[m.primary] !== undefined && dials[m.primary] !== null) {
        return d.id === m.primary ? d.slope * offsetDb : 0;
      }
      return d.id === focus ? 0.25 * offsetDb : 0;
    }
    function snapDial(d, x) {
      if (d.kind === 'ord') return clamp(x, d.min, d.max);
      return clamp(Math.round(x / d.step) * d.step, d.min, d.max);
    }
    // p (mean per-slot accuracy) for a dial setting; missing active dials are taken at comfort.
    function predict(ex, dials, offsetDb, opts) {
      opts = opts || {};
      var ck = opts.ctxKey || ctxKey(ex, opts.headphones), zs = zStar(ex, ck), md = M();
      var act = active(ex, { ctxKey: ck, family: opts.family !== undefined ? opts.family : familyOf(ex, dials) });
      var focus = opts.focus || (act[0] && act[0].id), F = 1;
      for (var i = 0; i < act.length; i++) {
        var d = act[i], x = dials && dials[d.id] !== undefined && dials[d.id] !== null ? dials[d.id] : snapDial(d, solve(ex, d, md.fc, ck, zs));
        F *= compE(ex, d, x, ck, zs, offsetFor(ex, d, dials, offsetDb, focus));
      }
      var g = opts.gamma !== undefined ? opts.gamma : gammaOf(ex, dials);
      return g + (1 - g - md.lapse) * F;
    }
    function familyOf(ex, dials) {
      if (!meta(ex).families || !dials) return undefined;
      var a = dialsOf(ex);
      for (var i = 0; i < a.length; i++) if (a[i].family && dials[a[i].id] !== undefined && dials[a[i].id] !== null) return a[i].family;
      return undefined;
    }

    // ---- update ----
    function gridUpdate(d, pr, loglik, w) {
      var span = Math.max(4.5 * pr.s, 2 / d.slope), lo = pr.m - span, hi = pr.m + span;
      var step = (hi - lo) / (GRID - 1), lp = new Array(GRID), mx = -Infinity, i, th;
      for (i = 0; i < GRID; i++) {
        th = lo + i * step;
        var z = (th - pr.m) / pr.s;
        lp[i] = -0.5 * z * z + w * loglik(th);
        if (lp[i] > mx) mx = lp[i];
      }
      var sw = 0, s1 = 0, s2 = 0;
      for (i = 0; i < GRID; i++) { th = lo + i * step; var wt = Math.exp(lp[i] - mx); sw += wt; s1 += wt * th; }
      var mean = s1 / sw;
      for (i = 0; i < GRID; i++) { th = lo + i * step; s2 += Math.exp(lp[i] - mx) * (th - mean) * (th - mean); }
      return { m: mean, s: Math.sqrt(s2 / sw) };
    }
    function update(trial, result) {
      var st = self.state, ex = trial.ex, set = trial.setting || {}, md = M();
      var ck = (trial.meta && trial.meta.ctxKey) || ctxKey(ex, false);
      var prop = result && typeof result.prop === 'number' ? result.prop : 0;
      var slots = (trial.question && trial.question.slots) || [];
      var k = Math.max(1, slots.length), g = 0;
      slots.forEach(function (sl) { g += sl.gamma !== undefined ? sl.gamma : 1 / Math.max(1, (sl.options || []).length); });
      g = slots.length ? g / slots.length : gammaOf(ex, set.dials);
      st.n++;
      var rec = st.recent[ex] = st.recent[ex] || [];
      rec.push(Math.round(prop * 100) / 100);
      if (rec.length > 30) rec.splice(0, rec.length - 30);
      var cond = (trial.meta && trial.meta.cond) || 'base', cid = ex + ':' + cond;
      var c = st.cond[cid] = st.cond[cid] || { n: 0, acc: 0.7, at: 0 };
      c.n++; c.acc = c.n === 1 ? 0.5 * c.acc + 0.5 * prop : 0.85 * c.acc + 0.15 * prop; c.at = self.clock();
      breadthRule(ex);
      if (ex === 'voices' && trial.meta && trial.meta.voices && trial.meta.voices[0]) {
        var cv = trial.meta.voices[0]; st.cast[cv] = (st.cast[cv] || 0) + 1;
      }
      var out = { updated: [], warmup: !!set.warmup };
      if (set.warmup || set.noUpdate) return out;
      var dials = set.dials || {}, fam = familyOf(ex, dials);
      var act = active(ex, { ctxKey: ck, family: fam }).filter(function (d) { return dials[d.id] !== undefined && dials[d.id] !== null; });
      if (!act.length) return out;
      var zs = zStar(ex, ck), offDb = (trial.meta && trial.meta.offsetDb) || 0;
      var comps = act.map(function (d) { return compE(ex, d, dials[d.id], ck, zs, offsetFor(ex, d, dials, offDb, set.focus)); });
      var resp = comps.map(function (f) { return 1 - f; }), rmax = Math.max.apply(null, resp) || 1;
      var keff = Math.pow(k, 0.7), now = self.clock();
      act.forEach(function (d, j) {
        var w = resp[j] / rmax;
        if (w < 0.05) return;
        var others = 1;
        for (var i = 0; i < act.length; i++) if (i !== j) others *= comps[i];
        var pr = post(ex, d, ck);
        pr = { m: pr.m, s: Math.sqrt(pr.s * pr.s + d.drift * d.drift), n: pr.n };
        var x = dials[d.id], off = offsetFor(ex, d, dials, offDb, set.focus);
        var nu = gridUpdate(d, pr, function (th) {
          var F = L(zs - d.slope * d.dir * (x - th) - off) * others;
          var p = g + (1 - g - md.lapse) * F;
          return keff * (prop * Math.log(p) + (1 - prop) * Math.log(1 - p));
        }, w);
        var pad = d.kind === 'ord' ? 4 : 12, sMin = 0.25 / d.slope;
        var r = st.dials[key(ck, d.id)] || { h: [], f: 0 };
        r.m = Math.round(clamp(nu.m, d.min - pad, d.max + pad) * 1000) / 1000;
        r.s = Math.round(clamp(nu.s, sMin, d.prior.s * 1.5) * 1000) / 1000;
        r.n = Math.round(((pr.n || 0) + w) * 100) / 100; r.at = now;
        if (d.id === set.focus) { r.f = (r.f || 0) + 1; r.lf = st.n; }
        r.u = (r.u || 0) + 1;
        if (r.u % 8 === 0) { r.h = r.h || []; r.h.push(Math.round(d.dir * d.slope * r.m * 1000) / 1000); if (r.h.length > 10) r.h.shift(); }
        st.dials[key(ck, d.id)] = r;
        out.updated.push(d.id);
      });
      return out;
    }
    // Variety (breadth) widens when accuracy over the last 20 trials ≥ 0.75, narrows below 0.55 (PLAN §7).
    function breadthRule(ex) {
      var st = self.state, rec = st.recent[ex], b = st.breadth[ex];
      if (b === undefined) b = st.breadth[ex] = 0.2;
      var cnt = (st.cond['_b:' + ex] = st.cond['_b:' + ex] || { n: 0, acc: 0, at: 0 });
      cnt.n++;
      if (rec.length < 20 || cnt.n < 10) return;
      var a = 0; for (var i = rec.length - 20; i < rec.length; i++) a += rec[i]; a /= 20;
      if (a >= 0.75) { st.breadth[ex] = Math.min(1, Math.round((b + 0.1) * 100) / 100); cnt.n = 0; }
      else if (a < 0.55) { st.breadth[ex] = Math.max(0, Math.round((b - 0.15) * 100) / 100); cnt.n = 0; }
    }

    // ---- summary for the UI (values in real units) ----
    function valueText(d, m) {
      if (d.kind === 'cont') return (m > 0 ? '+' : m < 0 ? '−' : '') + Math.abs(Math.round(m * 2) / 2) + ' ' + d.unit;
      var i = clamp(Math.round(m), d.min, d.max);
      return d.levels[i];
    }
    function summary(ex, opts) {
      opts = opts || {};
      var ck = opts.ctxKey || ctxKey(ex, opts.headphones);
      var list = active(ex, { ctxKey: ck, allFamilies: true }).map(function (d) {
        var p = post(ex, d, ck), reach = p.m > d.max ? (d.dir > 0 ? 'beyond' : 'floor') : p.m < d.min ? (d.dir > 0 ? 'floor' : 'beyond') : 'in';
        var lvl = d.kind === 'ord' ? clamp(Math.round(p.m), d.min, d.max) : null;
        return { id: d.id, label: d.label, unit: d.unit, kind: d.kind, family: d.family || null, m: p.m, s: p.s, n: p.n,
          level: lvl, value: d.kind === 'ord' ? d.values[lvl] : Math.round(p.m * 2) / 2, text: valueText(d, p.m), reach: reach,
          ability: d.dir * d.slope * p.m };
      });
      var rec = self.state.recent[ex] || [], acc = null;
      if (rec.length) { acc = 0; rec.forEach(function (v) { acc += v; }); acc /= rec.length; }
      return { ex: ex, ctxKey: ck, dials: list, breadth: self.state.breadth[ex] === undefined ? 0.2 : self.state.breadth[ex], acc: acc,
        target: M().target };
    }
    function save() {
      try { if (ES.core && ES.core.store && ES.core.store.set) return ES.core.store.set('learner', self.state); } catch (e) { /* guarded */ }
      return false;
    }

    self.create = create;
    self.load = load;
    self.toJSON = function () { return JSON.parse(JSON.stringify(self.state)); };
    self.save = save;
    self.reset = function () { self.state = fresh(); return self; };
    self.ctxKey = ctxKey;
    self.active = active;
    self.zStar = zStar;
    self.post = post;
    self.est = est;
    self.compE = compE;
    self.solve = solve;
    self.snap = snapDial;
    self.offsetFor = offsetFor;
    self.gammaOf = gammaOf;
    self.predict = predict;
    self.update = update;
    self.summary = summary;
    self.familyOf = familyOf;
    self.ability = function (ex, id, ck) { var d = dialDef(ex, id), p = post(ex, d, ck || ex); return d.dir * d.slope * p.m; };
    return self;
  }

  E.learner = create();
})(typeof window !== 'undefined' ? window : globalThis);
