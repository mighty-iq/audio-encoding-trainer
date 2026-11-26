/* ES.lab.procedures — adaptive and fixed procedures for the probes (pure; R4 §1, §5b). Each returns a small
   state machine: next() → the next level, record(level, …) → stores the response, estimate() → {m, s, …}.
   - bayes: Bayesian adaptive track on a grid (threshold × slope × lapse), after BPACE (Schmid et al. 2023):
     the next level alternates between the threshold and the upper-slope "sweet points" of the current posterior,
     never the low one (spares the listener); a run that scores badly gets an easier next trial. Word scores are
     binomial with tempering (words of one sentence co-vary). The estimate is the posterior mean and SD.
   - staircase: 1-up/1-down in fixed steps (digits in noise: Koopmans et al. 2018): SRT = mean level of trials
     5–25, where the 25th is the level the next trial would have had; its SD comes from a grid fit of the same data.
   - adaptation: accuracy over a fixed block and its slope across items (new-voice adaptation).
   MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var L = ES.lab = ES.lab || {};
  var S = L.stats;
  var P = L.procedures = {};

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function roundTo(x, step) { return Math.round(x / step) * step; }

  /** opts: {grid:{…}, n, start, targets:[0.8, 0.5], temper, round, min, max, maxStep, comfortBelow} */
  P.bayes = function (opts) {
    var o = opts || {}, G = S.grid(o.grid || {}), dir = G.dir, targets = o.targets || [0.8, 0.5];
    var stepR = o.round || 0.5, lo = o.min != null ? o.min : G.th[0], hi = o.max != null ? o.max : G.th[G.th.length - 1];
    var maxStep = o.maxStep || 8, comfort = o.comfortBelow != null ? o.comfortBelow : 0.4, temper = o.temper == null ? 1 : o.temper;
    var log = [], last = null;
    var T = {
      n: o.n || 20, grid: G, log: log,
      next: function () {
        if (!log.length) return clamp(roundTo(o.start != null ? o.start : 0, stepR), lo, hi);
        var e = G.estimate(), f = targets[log.length % targets.length];
        if (last && last.n && last.k / last.n < comfort) f = Math.max.apply(null, targets);
        var x = S.levelAt(f, e.m, Math.max(0.02, e.slope), dir), prev = last.x;
        x = clamp(x, prev - maxStep, prev + maxStep);
        return clamp(roundTo(x, stepR), lo, hi);
      },
      record: function (x, k, n) {
        k = Math.max(0, Math.min(n, k | 0));
        G.update(x, k, n, temper);
        last = { x: x, k: k, n: n };
        log.push([x, k, n]);
      },
      done: function () { return log.length >= T.n; },
      estimate: function () { var e = G.estimate(); e.trials = log.length; return e; }
    };
    return T;
  };

  /** opts: {start, step:2, n:24, min, max, from:5, to:25, fit:{grid opts for the SD}} */
  P.staircase = function (opts) {
    var o = opts || {}, step = o.step || 2, n = o.n || 24, lo = o.min != null ? o.min : -30, hi = o.max != null ? o.max : 20;
    var levels = [clamp(o.start != null ? o.start : 0, lo, hi)], results = [];
    var T = {
      n: n, levels: levels, results: results,
      next: function () { return levels[levels.length - 1]; },
      record: function (x, correct) {
        results.push([x, correct ? 1 : 0]);
        levels.push(clamp(x + (correct ? -step : step), lo, hi));
      },
      done: function () { return results.length >= n; },
      /** Mean level of trials `from`…`to` (1-based; level n + 1 is the next trial's). */
      srt: function () {
        var a = (o.from || 5) - 1, b = Math.min(levels.length, o.to || 25);
        return S.mean(levels.slice(a, b));
      },
      estimate: function () {
        var G = S.grid(o.fit || { lo: -30, hi: 20, step: 0.25, mu: T.srt(), sd: 8, slopes: [0.12, 0.18, 0.25], slopeW: [1, 2, 1], guess: o.guess || 0,
          lapses: [0.01, 0.05], lapseW: [0.7, 0.3] });
        results.forEach(function (r) { G.update(r[0], r[1], 1, 1); });
        var e = G.estimate(), m = T.srt();
        var hitFloor = levels.slice(4).filter(function (x) { return x <= lo; }).length > 3;
        var hitCeil = levels.slice(4).filter(function (x) { return x >= hi; }).length > 3;
        return { m: m, s: Math.max(0.3, e.s), fit: e.m, slope: e.slope, trials: results.length, atEdge: hitFloor ? 'lo' : hitCeil ? 'hi' : null };
      }
    };
    return T;
  };

  /** Accuracy over a fixed block and its change across items: props = proportion correct per item. */
  P.adaptation = function (props, nPerItem, temper) {
    var n = props.length, acc = S.mean(props);
    var xm = (n - 1) / 2, sxx = 0, sxy = 0;
    props.forEach(function (p, i) { sxx += (i - xm) * (i - xm); sxy += (i - xm) * (p - acc); });
    var slope = sxx ? sxy / sxx : 0, q = Math.max(1, Math.round(n / 4));
    var neff = n * (nPerItem || 1) * (temper == null ? 1 : temper);
    var pp = (acc * neff + 0.5) / (neff + 1);
    return { acc: acc, s: Math.sqrt(pp * (1 - pp) / Math.max(1, neff)), slope10: slope * 10,
      first: S.mean(props.slice(0, q)), last: S.mean(props.slice(n - q)) };
  };

  /** Proportion right of k questions with the binomial SD (shrunk away from 0 and 1). */
  P.proportion = function (k, n) {
    var p = n ? k / n : 0, pp = (k + 0.5) / (n + 1);
    return { p: p, s: Math.sqrt(pp * (1 - pp) / Math.max(1, n)) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
