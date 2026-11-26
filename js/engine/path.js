/* Earshot engine — Path mode: venue-ordered steps per exercise. Each stage fixes the secondary dials and walks a
   ladder on the primary dial (blocked: one condition at a time), then a mixed step interleaves the stage's
   hardest conditions with the previous stage's (similar conditions back to back: R5 §3.1). Mastery: 5 trials in
   a row fully right, or ≥ 80 % over the last 15 (Kelly 2015; PLAN §7). A step predicted below p = 0.65 is eased
   one rung (adaptation floor); after 15 trials under 50 % the path steps back one (consolidate, no penalty).
   Venue hints are for the game layer's night-out map. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var E = ES.engine = ES.engine || {};

  // stage: [venue, label, fixed dials, primary dial, ladder values]
  var STAGES = {
    crowd: [['cafe', 'Café: one other voice', { talkers: 0, similar: 0, space: 0 }, 'tmr', [9, 6, 3, 0]],
      ['restaurant', 'Restaurant: a voice like yours', { talkers: 0, similar: 1, space: 1 }, 'tmr', [6, 3, 0, -3]],
      ['bar', 'Bar: two other voices', { talkers: 1, similar: 1, space: 3 }, 'tmr', [6, 3, 0, -3]],
      ['party', 'House party: three voices', { talkers: 2, similar: 1, space: 4 }, 'tmr', [3, 0, -3]],
      ['club', 'Club: similar voices', { talkers: 2, similar: 2, space: 5 }, 'tmr', [3, 0, -3, -6]],
      ['concert', 'Concert: near-twins', { talkers: 2, similar: 3, space: 7 }, 'tmr', [0, -3, -6, -9]]],
    far: [['home', 'Living room', { rt60: 1, noise: 24 }, 'dist', [1, 2, 3]],
      ['restaurant', 'Across a restaurant', { rt60: 3, noise: 15 }, 'dist', [2, 3, 4, 5]],
      ['station', 'Station hall', { rt60: 5, noise: 10 }, 'dist', [4, 5, 6, 7]],
      ['lecture', 'Lecture hall', { rt60: 4, noise: 12 }, 'dist', [5, 6, 7, 8]],
      ['cathedral', 'Cathedral', { rt60: 8, noise: 15 }, 'dist', [6, 7, 8, 9, 10]],
      ['park', 'Park, outdoors', { rt60: 0, noise: 3 }, 'dist', [6, 8, 10]]],
    strange: [['cafe', 'Accents', {}, 'accent', [0, 1, 2, 3, 4, 5]], ['station', 'Fast announcements', {}, 'fast', [0, 1, 2, 3, 4, 5]],
      ['phone', 'Phone line', {}, 'phone', [0, 1, 2, 3, 4, 5]], ['party', 'Through the wall', {}, 'muffled', [0, 1, 2, 3, 4, 5]],
      ['lecture', 'Whispers at the back', {}, 'whisper', [0, 1, 2, 3, 4, 5]], ['concert', 'Robot voices', {}, 'vocoded', [0, 1, 2, 3, 4, 5]]],
    repair: [['cafe', 'Strong context', { context: 0, gate: 0, fill: 0 }, 'gap', [0, 1, 2, 3]],
      ['bar', 'Some context', { context: 1, gate: 1, fill: 1 }, 'gap', [1, 2, 3, 4]],
      ['party', 'Broken-up sentences', { context: 1, gate: 2, fill: 2 }, 'gap', [2, 3, 4]],
      ['club', 'Little context, silent gaps', { context: 2, gate: 3, fill: 3 }, 'gap', [2, 3, 4, 5]]],
    echo: [['cafe', 'Two details', { details: 0, rate: 0, delay: 0 }, 'snr', [15, 10, 6]],
      ['restaurant', 'Three details', { details: 1, rate: 0, delay: 1 }, 'snr', [12, 8, 4]],
      ['bar', 'Four details, faster', { details: 2, rate: 1, delay: 1 }, 'snr', [10, 6, 2]],
      ['party', 'Five details', { details: 3, rate: 2, delay: 2 }, 'snr', [8, 4, 0]]],
    seek: [['park', 'Open ground', { decoys: 0, size: 0, gap: 0 }, 'snr', [12, 8, 4]],
      ['station', 'A decoy', { decoys: 1, size: 1, gap: 1 }, 'snr', [10, 6, 2]],
      ['stadium', 'Busy stands', { decoys: 2, size: 2, gap: 2 }, 'snr', [8, 4, 0]],
      ['concert', 'Crowded floor', { decoys: 4, size: 3, gap: 3 }, 'snr', [6, 2, -2]]],
    voices: [['cafe', 'Two voices', { cast: 0, similar: 0, length: 0 }, 'snr', [30, 15, 9]],
      ['restaurant', 'Three voices', { cast: 1, similar: 0, length: 0 }, 'snr', [24, 12, 6]],
      ['bar', 'Four similar voices', { cast: 2, similar: 1, length: 1 }, 'snr', [24, 12, 6]],
      ['party', 'Five voices, short clips', { cast: 3, similar: 1, length: 2 }, 'snr', [18, 9, 3]],
      ['club', 'Six close voices', { cast: 4, similar: 2, length: 2 }, 'snr', [12, 6, 0]]]
  };

  function steps(ex) {
    var out = [], st = STAGES[ex] || [];
    st.forEach(function (s, si) {
      s[4].forEach(function (v, k) {
        var d = JSON.parse(JSON.stringify(s[2])); d[s[3]] = v;
        out.push({ stage: si, venue: s[0], label: s[1] + ' · step ' + (k + 1), dials: d, primary: s[3] });
      });
      if (si > 0) {
        // this stage's two hardest steps and the previous stage's hardest plain step
        var plain = out.map(function (x, i) { return x.mix ? -1 : i; }).filter(function (i) { return i >= 0; });
        var mine = plain.filter(function (i) { return out[i].stage === si; }), prev = plain.filter(function (i) { return out[i].stage === si - 1; });
        var mix = mine.slice(-2).concat(prev.slice(-1));
        out.push({ stage: si, venue: s[0], label: s[1] + ' · mixed', mix: mix, primary: s[3] });
      }
    });
    return out;
  }
  var CACHE = {};
  function list(ex) { return CACHE[ex] || (CACHE[ex] = steps(ex)); }
  function state(lr, ex) {
    var p = lr.state.path[ex];
    if (!p || typeof p !== 'object') p = lr.state.path[ex] = { i: 0, hist: [], run: 0, n: 0, best: 0 };
    var top = list(ex).length - 1;
    if (!(p.i >= 0 && p.i <= top)) p.i = Math.max(0, Math.min(top, Math.floor(+p.i) || 0)); // damaged or older records (M9)
    if (!Array.isArray(p.hist)) p.hist = [];
    return p;
  }

  function next(ex, ctx) {
    ctx = ctx || {};
    var lr = E.lrOf(ctx.learner), rng = ctx.rng || ES.core.rng('path'), md = E.model, set = ctx.set || {};
    var all = list(ex), ps = state(lr, ex), st = all[Math.min(ps.i, all.length - 1)], ck = lr.ctxKey(ex, !!ctx.headphones);
    var src = st.mix ? all[st.mix[Math.floor(rng.next() * st.mix.length)]] : st;
    var family = E.dialMeta[ex].families ? E.dials[ex].filter(function (d) { return d.id === src.primary; })[0].family : null;
    var act = lr.active(ex, { ctxKey: ck, family: family }), zs = lr.zStar(ex, ck), dials = {};
    act.forEach(function (d) {
      var v = src.dials[d.id];
      dials[d.id] = v !== undefined ? lr.snap(d, v) : E.controller.comfortOf(lr, ex, ck, d, zs);
    });
    var pd = E.dialDef(ex, src.primary), eased = 0, p = E.controller.pAt(lr, ex, ck, act, dials, zs);
    // adaptation floor: ease the primary dial one rung at a time
    while (p < md.floor && eased < 6) {
      var x = dials[pd.id], nx = pd.kind === 'ord' ? x - 1 : x - pd.dir * 3;
      if (pd.kind === 'ord' ? nx < pd.min : (pd.dir > 0 ? nx < pd.min : nx > pd.max)) break;
      dials[pd.id] = lr.snap(pd, nx); eased++;
      p = E.controller.pAt(lr, ex, ck, act, dials, zs);
    }
    var condN = family ? E.controller.famStats(lr, ex, family).n : E.controller.exposureN(lr, ex, ck);
    return { ex: ex, ctxKey: ck, family: family, dials: dials, focus: pd.id, anchor: false, warmup: (set.i || 0) < 1 || condN < 3, breadth: st.mix ? 0.6 : 0.25,
      p: p, target: p, mode: 'path', path: { i: ps.i, of: all.length, label: st.label, venue: st.venue, stage: st.stage, eased: eased } };
  }
  // Called after each Path trial. Returns { advanced, back, i }.
  function record(ex, trial, result, lr) {
    lr = lr || E.learner;
    var all = list(ex), ps = state(lr, ex), prop = result.prop || 0, out = { advanced: false, back: false, i: ps.i };
    if (trial.setting && trial.setting.warmup) return out;
    ps.n++; ps.hist.push(Math.round(prop * 100) / 100); if (ps.hist.length > 15) ps.hist.shift();
    ps.run = prop >= 1 ? ps.run + 1 : 0;
    var mean = ps.hist.reduce(function (a, b) { return a + b; }, 0) / ps.hist.length;
    if (ps.run >= 5 || (ps.hist.length >= 15 && mean >= 0.8)) {
      if (ps.i < all.length - 1) { ps.i++; out.advanced = true; }
      ps.hist = []; ps.run = 0; ps.n = 0; ps.best = Math.max(ps.best, ps.i);
    } else if (ps.n >= 15 && mean < 0.5 && ps.i > 0) {
      ps.i--; out.back = true; ps.hist = []; ps.run = 0; ps.n = 0;
    }
    out.i = ps.i;
    return out;
  }

  E.path = { next: next, record: record, steps: list, STAGES: STAGES };
})(typeof window !== 'undefined' ? window : globalThis);
