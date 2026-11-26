/* ES.game.venueFallback — FALLBACK for venue sets until the engine honours pinned dials (`ctx.set.pin`, asked in
   docs/dev/requests.md 18:12 UTC). It builds each trial's setting with the controller's own exported helpers, the
   way Edge mode does: the venue's pins hold, the headline dial sits at the edge (p ≈ 0.72), the first two trials
   are warm-ups (0.85), every 4th–5th trial and any trial after two misses is an anchor (0.9), and no trial is
   planned below the adaptation floor (0.65): pinned dials ease one step at a time first, reported as
   trial.meta.eased. Remove this file once ES.engine.controller.supports.pin is true (venues.plan stops using it). */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.game = ES.game || {};

  function K() { return ES.game.core; }
  function E() { return ES.engine || {}; }
  function easier(d, x) {
    if (d.kind === 'ord') return x > d.min ? x - 1 : null;
    var nx = x + (d.dir > 0 ? -1 : 1) * Math.max(d.step || 0.5, 3);
    return d.dir > 0 ? (nx >= d.min ? nx : null) : (nx <= d.max ? nx : null);
  }

  /** A make(i, ctx) → TrialSpec for one venue set (cond = {ex, pin, dial}; set = the plan's set). */
  function maker(cond, set) {
    var st = { recentVoices: [], lastRoom: null, since: 0, gap: 4, base: 'venue:' + set.venue + ':' + Date.now().toString(36) };
    return function make(i, ctx) {
      ctx = ctx || {};
      var L = K().learner(), C = E().controller, md = E().model, ex = cond.ex;
      var hp = ctx.headphones !== undefined ? !!ctx.headphones : K().headphones();
      var ck = L.ctxKey(ex, hp), zs = L.zStar(ex, ck), focus = K().dialDef(ex, cond.dial), family = focus.family || null;
      var act = L.active(ex, { ctxKey: ck, family: family }), dials = {}, pins = set.pin || {};
      act.forEach(function (d) {
        if (d.id === focus.id) return;
        dials[d.id] = pins[d.id] !== undefined ? pins[d.id] : C.comfortOf(L, ex, ck, d, zs);
      });
      var res = ctx.results || [], last2 = res.slice(-2);
      var warm = i < 2, anchor = !warm && (st.since >= st.gap || (last2.length === 2 && !last2[0].correct && !last2[1].correct));
      var target = warm ? md.warm : anchor ? md.anchor : md.target;
      var rng = ES.core.rng(st.base + ':' + i), r = C.levelFor(L, ex, ck, act, focus, dials, target, rng, zs, warm || anchor), eased = 0;
      while (r.p < md.floor && eased < 8) {
        // ease the pinned dial that costs most (lowest component first), one step
        var cands = act.filter(function (d) { return d.id !== focus.id && easier(d, dials[d.id]) !== null; });
        if (!cands.length) break;
        cands.sort(function (a, b) { return L.compE(ex, a, dials[a.id], ck, zs, 0) - L.compE(ex, b, dials[b.id], ck, zs, 0); });
        dials[cands[0].id] = easier(cands[0], dials[cands[0].id]);
        eased++;
        r = C.levelFor(L, ex, ck, act, focus, dials, target, rng, zs, true);
      }
      if (anchor) { st.since = 0; st.gap = 3 + (rng.next() < 0.5 ? 0 : 1); } else if (!warm) st.since++;
      var setting = { dials: dials, focus: focus.id, anchor: anchor, warmup: warm, seed: st.base + ':' + i };
      var breadth = L.state && L.state.breadth && L.state.breadth[ex] !== undefined ? L.state.breadth[ex] : 0.2;
      var t = E().items[ex].make(rng.fork('m'), setting, { breadth: breadth, headphones: hp, recentVoices: st.recentVoices, lastRoom: st.lastRoom,
        playerSeed: (L.state && L.state.seed) || 'p', learner: L, family: family });
      var v = t.meta && t.meta.voices && t.meta.voices[0];
      if (v) { st.recentVoices.unshift(v); if (st.recentVoices.length > 3) st.recentVoices.pop(); }
      if (t.meta && t.meta.room) st.lastRoom = t.meta.room;
      t.meta = t.meta || {};
      t.meta.venue = set.venue;
      t.meta.decision = { p: Math.round(r.p * 1000) / 1000, target: target, mode: 'venue', eased: eased };
      if (eased) t.meta.eased = eased;
      return t;
    };
  }

  ES.game.venueFallback = { maker: maker };
})(typeof window !== 'undefined' ? window : globalThis);
