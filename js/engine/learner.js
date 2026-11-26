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
  var LN2PI8 = Math.PI / 8, GRID = 61, DAY = 86400000;

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
  var ACT = {};
  function active(ex, opts) {
    opts = opts || {};
    var ak = ex + '|' + (opts.ctxKey || '') + '|' + (opts.headphones ? 1 : 0) + '|' + opts.family + '|' + (opts.allFamilies ? 1 : 0);
    if (ACT[ak]) return ACT[ak];
    return (ACT[ak] = activeRaw(ex, opts));
  }
  function activeRaw(ex, opts) {
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
  var ZS = {};
  function zStar(ex, ck) {
    var zk = ex + '|' + ck;
    if (ZS[zk] !== undefined) return ZS[zk];
    return (ZS[zk] = zStarRaw(ex, ck));
  }
  function zStarRaw(ex, ck) {
    var m = meta(ex), md = M();
    var fT = (md.target - m.gamma) / (1 - m.gamma - md.lapse);
    return logit(Math.min(0.995, fT / Math.pow(md.fc, nTyp(ex, ck) - 1)));
  }

  function create(initial, clock) {
    var self = {};
    self.clock = clock || function () { return Date.now(); };
    self.state = fresh();
    if (initial) load(initial);

    function fresh() { return { v: 1, n: 0, dials: {}, breadth: {}, recent: {}, edge: {}, cond: {}, path: {}, best: {}, plat: {}, cast: {} }; }
    function load(obj) {
      var s = fresh();
      if (obj && typeof obj === 'object' && (obj.v === 1 || obj.v === undefined)) {
        ['dials', 'breadth', 'recent', 'edge', 'cond', 'path', 'best', 'plat', 'cast'].forEach(function (k) {
          if (obj[k] && typeof obj[k] === 'object') s[k] = JSON.parse(JSON.stringify(obj[k]));
        });
        s.n = +obj.n || 0;
        if (typeof obj.seed === 'string') s.seed = obj.seed;
      }
      self.state = s;
      self._bound = true; // an explicit load wins over the lazy read from the store
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
    // Same as compE with a posterior p = {m, s} already looked up (hot paths: controller, update).
    function compP(d, x, p, zs, offsetLogit) {
      var b = d.slope, k = 1 / Math.sqrt(1 + LN2PI8 * b * b * p.s * p.s);
      return L(k * (zs - b * d.dir * (x - p.m) - (offsetLogit || 0)));
    }
    function solveP(d, need, p, zs, offsetLogit) {
      var b = d.slope, k = Math.sqrt(1 + LN2PI8 * b * b * p.s * p.s);
      return p.m + d.dir * (zs - (offsetLogit || 0) - k * logit(need)) / b;
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
    // The app's learner (E.learner) reads its record from the store on first use and writes it back after every
    // update (updates happen at answer time, between stimuli). Other instances (simulations) are never bound.
    function sync() {
      if (self._bound || !self._default) return;
      try {
        var S = ES.core && ES.core.store;
        if (!S || !S.peek) return;
        var rec = S.peek('learner');
        if (rec && typeof rec === 'object' && rec.dials) load(rec);
        self._bound = true;
      } catch (e) { /* storage blocked: keep memory state */ }
    }
    // persistence is the caller's: the shell calls learner.save() after every answer and at set ends
    function update(trial, result) {
      sync();
      return updateRaw(trial, result);
    }
    function updateRaw(trial, result) {
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
      var newCond = c.n < 3 && !(trial.meta && trial.meta.task === 'meet'); // first items of a condition: rapid adaptation, no threshold update
      c.n++; c.acc = c.n === 1 ? 0.5 * c.acc + 0.5 * prop : 0.85 * c.acc + 0.15 * prop; c.at = self.clock();
      if (!set.warmup && !set.anchor) {
        var er = st.edge[ex] = st.edge[ex] || [];
        er.push(Math.round(prop * 100) / 100);
        if (er.length > 20) er.splice(0, er.length - 20);
        breadthRule(ex);
      }
      if (ex === 'voices' && trial.meta && trial.meta.voices && trial.meta.voices[0]) {
        var cv = trial.meta.voices[0]; st.cast[cv] = (st.cast[cv] || 0) + 1;
      }
      var out = { updated: [], warmup: !!set.warmup || newCond };
      if (set.warmup || set.noUpdate || newCond || set.tutorial) return out;
      var dials = set.dials || {}, fam = familyOf(ex, dials);
      var act = active(ex, { ctxKey: ck, family: fam }).filter(function (d) { return dials[d.id] !== undefined && dials[d.id] !== null; });
      if (!act.length) return out;
      var zs = zStar(ex, ck), offDb = (trial.meta && trial.meta.offsetDb) || 0;
      var posts = act.map(function (d) { return post(ex, d, ck); });
      var comps = act.map(function (d, i) { return compP(d, dials[d.id], posts[i], zs, offsetFor(ex, d, dials, offDb, set.focus)); });
      // Only the focus dial learns from a trial: its threshold is defined with the others at comfort, and dials held
      // at one level carry no information that could separate their thresholds from the focus dial's (updating them
      // too lets confounded posteriors wander off). Every dial is the focus often enough (bandit + staleness).
      var fid = set.focus && dials[set.focus] !== undefined ? set.focus : act[0].id;
      var keff = Math.pow(k, 0.7), now = self.clock();
      act.forEach(function (d, j) {
        if (d.id !== fid) return;
        var w = 1;
        var others = 1;
        for (var i = 0; i < act.length; i++) if (i !== j) others *= comps[i];
        var pr = posts[j];
        var dr = d.drift * (M().driftScale || 1);
        pr = { m: pr.m, s: Math.sqrt(pr.s * pr.s + dr * dr), n: pr.n };
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
    // Variety (breadth) widens when accuracy over the last 20 edge trials ≥ 0.75 (the player is ahead of the edge
    // target 0.72), narrows below 0.55 (PLAN §7). Anchors and warm-ups are left out: they are easy by design.
    function breadthRule(ex) {
      var st = self.state, rec = st.edge[ex], b = st.breadth[ex];
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
      sync();
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

    self.sync = sync;
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
    self.compP = compP;
    self.solveP = solveP;
    self.solve = solve;
    self.snap = snapDial;
    self.offsetFor = offsetFor;
    self.gammaOf = gammaOf;
    self.predict = predict;
    self.update = update;
    self.summary = summary;
    self.familyOf = familyOf;
    // Voices met outside a scored trial (the Voices tutorial's meet steps) count as met, so 'who' trials can ask
    // about them. Takes one id or a list; returns the learner. The app's learner saves at once (a tutorial can be
    // the last thing in a visit); other instances leave saving to their owner.
    self.noteMet = function (v) {
      sync();
      var st = self.state, n = 0;
      st.cast = st.cast || {};
      (Array.isArray(v) ? v : [v]).forEach(function (id) { if (typeof id === 'string' && id) { st.cast[id] = (st.cast[id] || 0) + 1; n++; } });
      if (n && self._default) save();
      return self;
    };
    self.met = function () { sync(); return Object.keys(self.state.cast || {}); };
    self.ability = function (ex, id, ck) { var d = dialDef(ex, id), p = post(ex, d, ck || ex); return d.dir * d.slope * p.m; };
    return self;
  }

  E.learner = create();
  E.learner._default = true;
  // Accept an instance or a stored record; a record means "the app's learner" (synced from the store).
  E.lrOf = function (x) {
    if (x && x.state && typeof x.update === 'function') return x;
    E.learner.sync();
    return E.learner;
  };
})(typeof window !== 'undefined' ? window : globalThis);
