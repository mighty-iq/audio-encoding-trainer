/* Earshot audio DSP: mixing helpers (placement, looping with crossfades) and a look-ahead peak limiter. Pure; MIT. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var A = ES.audio = ES.audio || {};
  var D = A.dsp = A.dsp || {};

  // A zero buffer of `len` samples with x added at sample `at` (scaled by g).
  D.place = function (len, x, at, g) { return D.addInto(new Float32Array(len), x, at | 0, g); };

  /* Loop x to n samples, starting at `offset`, with an equal-power crossfade of `xf` samples at every wrap.
     Used for babble talkers and ambience beds. */
  D.loopTo = function (x, n, offset, xf) {
    var m = x.length, y = new Float32Array(n);
    if (!m) return y;
    xf = Math.max(0, Math.min(xf == null ? 0 : xf | 0, m >> 2));
    var step = m - xf, pos = -((offset | 0) % step), i;
    while (pos < n) {
      for (i = 0; i < m; i++) {
        var o = pos + i;
        if (o < 0) continue;
        if (o >= n) break;
        var g = 1;
        if (xf && i < xf) g = Math.sin(0.5 * Math.PI * (i + 0.5) / xf);
        else if (xf && i >= m - xf) g = Math.cos(0.5 * Math.PI * (i - (m - xf) + 0.5) / xf);
        y[o] += x[i] * g;
      }
      pos += step;
    }
    return y;
  };

  // Make a buffer loop seamlessly: crossfade its last xf samples into its first xf samples (returns m - xf samples).
  D.makeLoop = function (x, xf) {
    var m = x.length; xf = Math.max(1, Math.min(xf | 0, m >> 2));
    var y = new Float32Array(m - xf), i;
    for (i = 0; i < m - xf; i++) y[i] = x[i];
    for (i = 0; i < xf; i++) {
      var t = (i + 0.5) / xf;
      y[i] = x[i] * Math.sin(0.5 * Math.PI * t) + x[m - xf + i] * Math.cos(0.5 * Math.PI * t);
    }
    return y;
  };

  // Running minimum over a centred window of half-width W (monotonic deque, O(n)).
  function runMin(a, W) {
    var n = a.length, out = new Float32Array(n), dq = new Int32Array(n + 2 * W + 1), h = 0, t = 0, j = 0;
    for (var i = 0; i < n; i++) {
      var hi = Math.min(n - 1, i + W);
      for (; j <= hi; j++) { while (t > h && a[dq[t - 1]] >= a[j]) t--; dq[t++] = j; }
      while (dq[h] < i - W) h++;
      out[i] = a[dq[h]];
    }
    return out;
  }

  /* Look-ahead peak limiter, linked across channels. Gain = moving average (length W + 1) of the running minimum
     (half-width W) of the required gain ceil/|x|, so every sample stays at or below the ceiling; a one-pole release
     (relMs) lets the gain return slowly. Returns {gain, reductionDb (largest cut, <= 0)}; apply with D.applyGain. */
  D.limiterGain = function (chs, sr, o) {
    o = o || {};
    chs = D.chans(chs);
    var n = chs[0].length, ceil = D.db2g(o.ceilDb == null ? -1 : o.ceilDb), W = Math.max(1, Math.round((o.lookMs || 5) * sr / 1000));
    var req = new Float32Array(n), any = false, i, c;
    for (i = 0; i < n; i++) {
      var p = 0;
      for (c = 0; c < chs.length; c++) { var v = chs[c][i]; if (v < 0) v = -v; if (v > p) p = v; }
      req[i] = p > ceil ? ceil / p : 1;
      if (req[i] < 1) any = true;
    }
    if (!any) return { gain: null, reductionDb: 0 };
    var hold = runMin(req, W), g = new Float32Array(n), half = W >> 1, s = 0, cnt = 0;
    // centred moving average of length 2*half+1 (<= W+1), so every averaged hold value covers sample i
    for (i = 0; i < Math.min(n, half); i++) { s += hold[i]; cnt++; }
    for (i = 0; i < n; i++) {
      var add = i + half, rem = i - half - 1;
      if (add < n) { s += hold[add]; cnt++; }
      if (rem >= 0) { s -= hold[rem]; cnt--; }
      g[i] = s / cnt;
    }
    var rel = 1 - Math.exp(-1 / ((o.relMs || 80) * sr / 1000)), cur = 1, minG = 1;
    for (i = 0; i < n; i++) {
      var up = cur + (1 - cur) * rel;
      cur = g[i] < up ? g[i] : up;
      if (cur > req[i]) cur = req[i]; // numerical guard
      g[i] = cur;
      if (cur < minG) minG = cur;
    }
    return { gain: g, reductionDb: D.g2db(minG) };
  };
  D.applyGain = function (chs, gain, k) {
    chs = D.chans(chs); k = k == null ? 1 : k;
    for (var c = 0; c < chs.length; c++) {
      var d = chs[c];
      if (gain) for (var i = 0; i < d.length; i++) d[i] *= gain[i] * k;
      else if (k !== 1) D.scaleInPlace(d, k);
    }
    return chs;
  };
  // Mean square of channels after a per-sample gain (for exact post-limiter levels of stems), over [from, to).
  D.meanSquareGained = function (chs, gain, from, to) {
    if (!gain) return D.meanSquare(chs, from, to);
    chs = D.chans(chs);
    var n = chs[0].length, a = Math.max(0, from | 0), b = to == null ? n : Math.min(n, to | 0), s = 0;
    if (b <= a) return 0;
    for (var c = 0; c < chs.length; c++) { var d = chs[c]; for (var i = a; i < b; i++) { var v = d[i] * gain[i]; s += v * v; } }
    return s / ((b - a) * chs.length);
  };
})(typeof window !== 'undefined' ? window : globalThis);
