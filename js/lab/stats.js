/* ES.lab.stats — pure statistics for the Lab (CONTRACTS §11; PLAN §8; numbers from docs/research/R4).
   - Psychometric model p(x) = γ + (1 − γ − λ)·F(x), F logistic with slope s at its 50 % point θ (F'(θ) = s).
   - Grid posteriors over (θ, slope, lapse) for adaptive tracks; binomial word scores are tempered (an effective
     number of independent words per sentence), so posteriors are not over-confident when words co-vary.
   - Trend across runs: a Bayesian linear model of the run estimates (level + slope per week + a practice term
     with a prior from the literature), a noise scale on a grid (scaled inverse-χ² prior), mixture posterior →
     gain ± 90 % interval, the smallest detectable change (1.96 × SD of the gain; for k runs averaged before and
     after this is the classic 2.77 × σ / √k), and a verdict. Positive gain = better, whatever the unit.
   Loads in Node (no DOM). MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var L = ES.lab = ES.lab || {};
  var S = L.stats = {};

  // ---- normal distribution
  function erf(x) { // Abramowitz & Stegun 7.1.26 (|error| < 1.5e-7)
    var s = x < 0 ? -1 : 1; x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  S.Phi = function (z) { return 0.5 * (1 + erf(z / Math.SQRT2)); };
  /** Inverse normal CDF (Acklam; |relative error| < 1.2e-9). */
  S.qnorm = function (p) {
    if (!(p > 0 && p < 1)) return p <= 0 ? -Infinity : Infinity;
    var a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.3577518672690, -30.66479806614716, 2.506628277459239];
    var b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    var c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    var d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    var q, r;
    if (p < 0.02425) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - 0.02425) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    q = p - 0.5; r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  };
  S.Z90 = S.qnorm(0.95);   // 1.6449: half-width of a 90 % interval in SDs
  S.Z975 = S.qnorm(0.975); // 1.9600

  // ---- small numerics
  function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : NaN; }
  function sd(a) { if (a.length < 2) return NaN; var m = mean(a), s = 0; for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m); return Math.sqrt(s / (a.length - 1)); }
  function logSumExp(arr) { var mx = -Infinity, i; for (i = 0; i < arr.length; i++) if (arr[i] > mx) mx = arr[i]; if (mx === -Infinity) return mx; var s = 0; for (i = 0; i < arr.length; i++) s += Math.exp(arr[i] - mx); return mx + Math.log(s); }
  function r2(x, d) { var p = Math.pow(10, d == null ? 2 : d); return Math.round(x * p) / p; }
  S.mean = mean; S.sd = sd; S.logSumExp = logSumExp; S.round = r2;
  /** Inverse of a symmetric positive-definite 3×3 (or n×n by Gauss–Jordan) matrix given as nested arrays. */
  function inv(M) {
    var n = M.length, A = M.map(function (row, i) { var r = row.slice(); for (var j = 0; j < n; j++) r.push(i === j ? 1 : 0); return r; });
    for (var c = 0; c < n; c++) {
      var piv = c;
      for (var r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
      var tmp = A[c]; A[c] = A[piv]; A[piv] = tmp;
      var v = A[c][c];
      if (Math.abs(v) < 1e-300) return null;
      for (var k = 0; k < 2 * n; k++) A[c][k] /= v;
      for (r = 0; r < n; r++) if (r !== c) { var f = A[r][c]; if (f) for (k = 0; k < 2 * n; k++) A[r][k] -= f * A[c][k]; }
    }
    return A.map(function (row) { return row.slice(n); });
  }
  function logDet(M) { // Gaussian elimination
    var n = M.length, A = M.map(function (r) { return r.slice(); }), ld = 0;
    for (var c = 0; c < n; c++) {
      var piv = c;
      for (var r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
      if (piv !== c) { var t = A[c]; A[c] = A[piv]; A[piv] = t; }
      var v = A[c][c];
      if (!(Math.abs(v) > 0)) return -Infinity;
      ld += Math.log(Math.abs(v));
      for (r = c + 1; r < n; r++) { var f = A[r][c] / v; for (var k = c; k < n; k++) A[r][k] -= f * A[c][k]; }
    }
    return ld;
  }
  S.inv = inv; S.logDet = logDet;

  // ---- psychometric functions
  /** Logistic with slope s at θ (proportion per unit); dir −1 when larger x is harder (distance). */
  S.F = function (x, th, s, dir) { return 1 / (1 + Math.exp(-4 * s * (dir === -1 ? th - x : x - th))); };
  S.p = function (x, th, s, g, l, dir) { return g + (1 - g - l) * S.F(x, th, s, dir); };
  /** The level where F = f (0 < f < 1). */
  S.levelAt = function (f, th, s, dir) { var z = Math.log(f / (1 - f)) / (4 * s); return dir === -1 ? th - z : th + z; };

  /* ---- grid posterior over threshold θ × slope × lapse.
     opts: {lo, hi, step, mu, sd (normal prior on θ), slopes:[…], slopeW:[…], lapses:[…], lapseW:[…], guess, dir} */
  S.grid = function (opts) {
    var o = opts || {}, lo = o.lo != null ? o.lo : -25, hi = o.hi != null ? o.hi : 15, step = o.step || 0.25;
    var nt = Math.max(2, Math.round((hi - lo) / step) + 1), th = new Float64Array(nt), i, j, k;
    for (i = 0; i < nt; i++) th[i] = lo + i * step;
    var slopes = o.slopes || [0.1], sw = o.slopeW || slopes.map(function () { return 1; });
    var lapses = o.lapses || [0.02], lw = o.lapseW || lapses.map(function () { return 1; });
    var ns = slopes.length, nl = lapses.length, g = o.guess || 0, dir = o.dir === -1 ? -1 : 1;
    var logp = new Float64Array(nt * ns * nl), mu = o.mu != null ? o.mu : (lo + hi) / 2, psd = o.sd || 10;
    var swSum = sw.reduce(function (a, b) { return a + b; }, 0), lwSum = lw.reduce(function (a, b) { return a + b; }, 0);
    for (i = 0; i < nt; i++) {
      var zt = (th[i] - mu) / psd, lt = -0.5 * zt * zt;
      for (j = 0; j < ns; j++) for (k = 0; k < nl; k++) logp[(i * ns + j) * nl + k] = lt + Math.log(sw[j] / swSum) + Math.log(lw[k] / lwSum);
    }
    var G = { th: th, slopes: slopes, lapses: lapses, guess: g, dir: dir, logp: logp, n: 0 };
    /** k correct out of n at level x; temper = effective independent fraction (1 = independent). */
    G.update = function (x, kk, nn, temper) {
      var t = temper == null ? 1 : temper, nk = nn - kk;
      for (var a = 0; a < nt; a++) for (var b = 0; b < ns; b++) {
        var F = S.F(x, th[a], slopes[b], dir), base = (a * ns + b) * nl;
        for (var c = 0; c < nl; c++) {
          var p = g + (1 - g - lapses[c]) * F;
          p = p < 1e-9 ? 1e-9 : p > 1 - 1e-9 ? 1 - 1e-9 : p;
          logp[base + c] += t * (kk * Math.log(p) + nk * Math.log(1 - p));
        }
      }
      G.n++;
    };
    G.weights = function () {
      var mx = -Infinity, q;
      for (q = 0; q < logp.length; q++) if (logp[q] > mx) mx = logp[q];
      var w = new Float64Array(logp.length), s = 0;
      for (q = 0; q < logp.length; q++) { w[q] = Math.exp(logp[q] - mx); s += w[q]; }
      for (q = 0; q < logp.length; q++) w[q] /= s;
      return w;
    };
    function marg(w) { // over θ
      var m = new Float64Array(nt);
      for (var a = 0; a < nt; a++) { var s2 = 0; for (var q = 0; q < ns * nl; q++) s2 += w[a * ns * nl + q]; m[a] = s2; }
      return m;
    }
    G.marginal = function () { return marg(G.weights()); };
    G.estimate = function () {
      var w = G.weights(), mt = 0, m2 = 0, ms = 0, ml = 0;
      for (var a = 0; a < nt; a++) for (var b = 0; b < ns; b++) for (var c = 0; c < nl; c++) {
        var v = w[(a * ns + b) * nl + c];
        mt += v * th[a]; m2 += v * th[a] * th[a]; ms += v * slopes[b]; ml += v * lapses[c];
      }
      var m = marg(w), cum = 0, qlo = null, qhi = null, q;
      for (q = 0; q < nt; q++) { cum += m[q]; if (qlo === null && cum >= 0.05) qlo = th[q]; if (qhi === null && cum >= 0.95) qhi = th[q]; }
      return { m: mt, s: Math.sqrt(Math.max(0, m2 - mt * mt)), slope: ms, lapse: ml, lo90: qlo, hi90: qhi,
        atEdge: m[0] + m[1] > 0.05 ? 'lo' : m[nt - 1] + m[nt - 2] > 0.05 ? 'hi' : null };
    };
    return G;
  };

  /** Classic smallest detectable change for k runs averaged before and after: 2.77 × σ / √k (R4 §5a). */
  S.sdcSimple = function (sigma, k) { return S.Z975 * Math.SQRT2 * sigma / Math.sqrt(k || 1); };

  /* ---- trend across runs.
     points: [{t: days, y: estimate (natural units), s: run SD, r: run ordinal of this probe (1 = first ever),
               practice: bool}]  (practice runs are left out of the fit; r keeps counting them)
     o: {better: −1 | +1, sigmaX: extra run-to-run SD, practice: {c0, sd, q}, slopeSd (per week), nu0, minDays}
     → {ok, reason, n, gain, sd, lo90, hi90, pUp, sdc, verdict, perWeek, practiceEst, tRef, tLast, weeks, band(t)} */
  S.trend = function (points, o) {
    o = o || {};
    var better = o.better === -1 ? -1 : 1, sx = o.sigmaX != null ? o.sigmaX : 0.3, pr = o.practice || { c0: 0, sd: 0.3, q: 0.35 };
    var q = pr.q != null ? pr.q : 0.35, nu0 = o.nu0 || 6, slopeSd = o.slopeSd || 1, minDays = o.minDays != null ? o.minDays : 5;
    var pts = (points || []).filter(function (p) { return p && !p.practice && isFinite(p.y) && isFinite(p.t); })
      .sort(function (a, b) { return a.t - b.t; });
    var out = { ok: false, n: pts.length, better: better };
    if (pts.length < 2) { out.reason = pts.length ? 'baseline' : 'none'; out.verdict = out.reason; return out; }
    var nb = Math.min(o.baselineN || 2, pts.length - 1), tRef = mean(pts.slice(0, nb).map(function (p) { return p.t; }));
    var tLast = pts[pts.length - 1].t;
    out.tRef = tRef; out.tLast = tLast; out.weeks = (tLast - tRef) / 7;
    if (tLast - tRef < minDays) { out.reason = 'early'; out.verdict = 'early'; return out; }
    var n = pts.length, X = [], y = [], v = [];
    pts.forEach(function (p) {
      var r = Math.max(2, p.r || 2);
      X.push([1, (p.t - tRef) / 7, -Math.pow(q, r - 2)]);
      y.push(better * p.y);
      var s = isFinite(p.s) && p.s > 0 ? p.s : sx;
      v.push(s * s + sx * sx);
    });
    var gbar = mean(y), mu0 = [gbar, 0, pr.c0 || 0], sd0 = [20, slopeSd, pr.sd != null ? pr.sd : 0.3];
    var P0 = [[1 / (sd0[0] * sd0[0]), 0, 0], [0, 1 / (sd0[1] * sd0[1]), 0], [0, 0, 1 / (sd0[2] * sd0[2])]];
    var logDetS0 = 2 * (Math.log(sd0[0]) + Math.log(sd0[1]) + Math.log(sd0[2]));
    var mu0P0mu0 = mu0[0] * mu0[0] * P0[0][0] + mu0[1] * mu0[1] * P0[1][1] + mu0[2] * mu0[2] * P0[2][2];
    var dw = (tLast - tRef) / 7, gvec = [0, dw, 0];
    var comps = [], logw = [], NPHI = 56, lo = Math.log(0.15), hi = Math.log(12);
    for (var gi = 0; gi < NPHI; gi++) {
      var u = lo + (hi - lo) * gi / (NPHI - 1), phi = Math.exp(u);
      var A = [[P0[0][0], 0, 0], [0, P0[1][1], 0], [0, 0, P0[2][2]]], bv = [P0[0][0] * mu0[0], P0[1][1] * mu0[1], P0[2][2] * mu0[2]];
      var yWy = 0, sumLog = 0;
      for (var i = 0; i < n; i++) {
        var w = 1 / (phi * v[i]), xi = X[i];
        for (var a = 0; a < 3; a++) { bv[a] += w * xi[a] * y[i]; for (var b = 0; b < 3; b++) A[a][b] += w * xi[a] * xi[b]; }
        yWy += w * y[i] * y[i]; sumLog += Math.log(phi * v[i]);
      }
      var C = inv(A);
      if (!C) continue;
      var m = [0, 0, 0];
      for (a = 0; a < 3; a++) for (b = 0; b < 3; b++) m[a] += C[a][b] * bv[b];
      var mAm = 0;
      for (a = 0; a < 3; a++) for (b = 0; b < 3; b++) mAm += m[a] * A[a][b] * m[b];
      var logml = -0.5 * (n * Math.log(2 * Math.PI) + sumLog + logDetS0 + logDet(A) + yWy + mu0P0mu0 - mAm);
      // scaled inverse-χ²(ν0, 1) prior on φ, density on u = log φ (Jacobian φ)
      var logPrior = -(nu0 / 2) * u - nu0 / (2 * phi);
      var gm = gvec[1] * m[1], gs = Math.sqrt(Math.max(1e-12, gvec[1] * gvec[1] * C[1][1]));
      comps.push({ phi: phi, m: m, C: C, gm: gm, gs: gs });
      logw.push(logml + logPrior);
    }
    var lz = logSumExp(logw), W = logw.map(function (x) { return Math.exp(x - lz); });
    var gMean = 0, g2 = 0, pUp = 0, perWeek = 0, prac = 0, lev = 0, phiM = 0;
    comps.forEach(function (c, k) {
      gMean += W[k] * c.gm; g2 += W[k] * (c.gs * c.gs + c.gm * c.gm); pUp += W[k] * S.Phi(c.gm / c.gs);
      perWeek += W[k] * c.m[1]; prac += W[k] * c.m[2]; lev += W[k] * c.m[0]; phiM += W[k] * c.phi;
    });
    var gSd = Math.sqrt(Math.max(0, g2 - gMean * gMean));
    function cdf(x) { var s = 0; comps.forEach(function (c, k) { s += W[k] * S.Phi((x - c.gm) / c.gs); }); return s; }
    function quant(p) {
      var a = gMean - 12 * gSd - 1, b = gMean + 12 * gSd + 1;
      for (var it = 0; it < 80; it++) { var mid = (a + b) / 2; if (cdf(mid) < p) a = mid; else b = mid; }
      return (a + b) / 2;
    }
    out.ok = true; out.reason = null;
    out.gain = gMean; out.sd = gSd; out.lo90 = quant(0.05); out.hi90 = quant(0.95); out.pUp = pUp;
    out.sdc = S.Z975 * gSd; out.perWeek = perWeek; out.practiceEst = prac; out.phi = phiM;
    out.level = better * lev;   // asymptotic level at tRef in natural units
    out.verdict = S.verdict(out);
    /** Fitted level (natural units, practice removed) at day t with its 90 % band. */
    out.band = function (t) {
      var xw = (t - tRef) / 7, mm = 0, m2 = 0;
      var parts = comps.map(function (c, k) {
        var mu = c.m[0] + xw * c.m[1], va = c.C[0][0] + 2 * xw * c.C[0][1] + xw * xw * c.C[1][1];
        mm += W[k] * mu; m2 += W[k] * (va + mu * mu);
        return { mu: mu, s: Math.sqrt(Math.max(1e-12, va)) };
      });
      var s = Math.sqrt(Math.max(0, m2 - mm * mm));
      var cd = function (x) { var z = 0; parts.forEach(function (pp, k) { z += W[k] * S.Phi((x - pp.mu) / pp.s); }); return z; };
      var qf = function (p) { var a = mm - 12 * s - 1, b = mm + 12 * s + 1; for (var it = 0; it < 60; it++) { var mid = (a + b) / 2; if (cd(mid) < p) a = mid; else b = mid; } return (a + b) / 2; };
      var l = qf(0.05), h = qf(0.95);
      return better === 1 ? { m: mm, lo: l, hi: h } : { m: -mm, lo: -h, hi: -l };
    };
    return out;
  };

  /** clear: the gain reaches the smallest detectable change (P(gain > 0) ≈ 0.975 or more); likely: P(gain > 0) ≥ 0.9;
      lower: a decline as large as the detectable change; otherwise not yet clear. */
  S.verdict = function (t) {
    if (!t || !t.ok) return t && t.reason || 'none';
    if (t.gain >= t.sdc && t.lo90 > 0) return 'clear';
    if (t.gain <= -t.sdc && t.hi90 < 0) return 'lower';
    if (t.pUp >= 0.9) return 'likely';
    return 'unclear';
  };
  S.VERDICT_TEXT = { clear: 'clear gain', likely: 'likely gain', unclear: 'not yet clear', lower: 'below baseline',
    early: 'first check-in comes next', baseline: 'baseline in progress', none: 'no runs yet' };
})(typeof window !== 'undefined' ? window : globalThis);
