/* Earshot audio DSP: time-scale modification (WSOLA, pitch preserved) and band-limited resampling. Pure; MIT. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var A = ES.audio = ES.audio || {};
  var D = A.dsp = A.dsp || {};

  /* WSOLA (waveform-similarity overlap-add, after Verhelst & Roelands 1993); pitch is kept.
     speed = the SPEED factor, as in TrialSpec {type:'wsola', rate} (CONTRACTS §12 R2): 2 plays twice as fast,
     0.67 slower; output length = round(n / speed). Frames of 32 ms with a periodic Hann window at 50 % overlap
     (sums to one); each next frame is taken from within +-10 ms of its nominal input position where it best matches
     the natural continuation of the previous frame (cross-correlation over the overlap, coarse step 2, refined). */
  D.wsola = function (x, sr, speed, opts) {
    opts = opts || {};
    var rate = 1 / D.clamp(+speed || 1, 0.25, 5); // duration ratio used below
    var n = x.length, outLen = Math.max(1, Math.round(n * rate));
    if (Math.abs(rate - 1) < 1e-6) return D.copy(x);
    var N = 2 * Math.round((opts.frameMs || 32) * sr / 2000), Hs = N >> 1, Ha = Hs / rate;
    var tol = Math.round((opts.tolMs || 10) * sr / 1000), L = Hs;
    var w = new Float32Array(N), i;
    for (i = 0; i < N; i++) w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
    // padded input: tol + N zeros on both sides, so every candidate window is in range
    var P = tol + N, xp = new Float32Array(n + 2 * P + Math.ceil(Ha) + N);
    xp.set(x, P);
    var out = new Float32Array(outLen + N), frames = Math.ceil(outLen / Hs) + 1;
    var prev = P; // input start (in xp) of the previous frame
    for (i = 0; i < N; i++) out[i] += w[i] * xp[prev + i];
    for (var k = 1; k < frames; k++) {
      var nominal = P + Math.round(k * Ha), cont = prev + Hs; // natural continuation of the last copied frame
      var best = 0, bestC = 0, d, j, c, s;
      for (j = 0; j < L; j += 2) bestC += xp[cont + j] * xp[nominal + j]; // d = 0 wins ties (e.g. in silence)
      for (d = -tol; d <= tol; d += 2) {
        if (d === 0) continue;
        s = nominal + d; c = 0;
        for (j = 0; j < L; j += 2) c += xp[cont + j] * xp[s + j];
        if (c > bestC) { bestC = c; best = d; }
      }
      var b0 = best;
      for (d = b0 - 1; d <= b0 + 1; d++) {
        if (d < -tol || d > tol || d === b0) continue;
        s = nominal + d; c = 0;
        for (j = 0; j < L; j += 2) c += xp[cont + j] * xp[s + j];
        if (c > bestC) { bestC = c; best = d; }
      }
      var start = nominal + best, o = k * Hs;
      if (o >= out.length) break;
      var m = Math.min(N, out.length - o);
      for (i = 0; i < m; i++) out[o + i] += w[i] * xp[start + i];
      prev = start;
    }
    return out.subarray(0, outLen).slice();
  };

  /* Band-limited resampling by `ratio` = output length / input length (like tape speed: ratio 0.9 is shorter and
     higher in pitch, 1.1 longer and lower). Windowed-sinc kernel (Blackman, 16 zero crossings each side) from a
     fine table; cut-off at min(1, ratio) of the input Nyquist so shortening never aliases. */
  var KT = null, KZ = 16, KRES = 512;
  function kernelTable() {
    if (KT) return KT;
    var len = KZ * KRES, t = new Float32Array(len + 2);
    for (var i = 0; i <= len; i++) {
      var u = i / KRES, s = u === 0 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u);
      var wv = 0.42 + 0.5 * Math.cos(Math.PI * u / KZ) + 0.08 * Math.cos(2 * Math.PI * u / KZ);
      t[i] = s * wv;
    }
    KT = t; return t;
  }
  D.resample = function (x, ratio) {
    ratio = +ratio;
    if (!(ratio > 0)) throw new Error('resample ratio must be > 0');
    var n = x.length, m = Math.max(1, Math.round(n * ratio));
    if (Math.abs(ratio - 1) < 1e-9) return D.copy(x);
    var t = kernelTable(), fc = Math.min(1, ratio), half = KZ / fc, y = new Float32Array(m);
    var step = n / m; // input samples per output sample (exact end-to-end mapping)
    for (var i = 0; i < m; i++) {
      var pos = i * step, i0 = Math.ceil(pos - half), i1 = Math.floor(pos + half), acc = 0;
      if (i0 < 0) i0 = 0;
      if (i1 > n - 1) i1 = n - 1;
      for (var k = i0; k <= i1; k++) {
        var u = Math.abs(pos - k) * fc * KRES, ui = u | 0;
        if (ui >= KZ * KRES) continue;
        var fr = u - ui;
        acc += x[k] * (t[ui] + fr * (t[ui + 1] - t[ui]));
      }
      y[i] = acc * fc;
    }
    return y;
  };

  /* Integer upsampling by k (e.g. 16 -> 48 kHz for playback): polyphase Kaiser-windowed sinc, 12 zero crossings each
     side; phase 0 passes the input samples unchanged. Output length n * k. */
  var UP = {};
  D.upsampleInt = function (x, k) {
    k = k | 0;
    if (k <= 1) return D.copy(x);
    var Z = 12, taps = UP[k], n = x.length, y = new Float32Array(n * k), i, m, ph;
    if (!taps) {
      taps = UP[k] = [];
      var beta = 8, i0 = function (v) { var s = 1, t = 1; for (var q = 1; q < 30; q++) { t *= (v / (2 * q)) * (v / (2 * q)); s += t; } return s; };
      for (ph = 0; ph < k; ph++) {
        var h = new Float64Array(2 * Z + 1);
        for (m = -Z; m <= Z; m++) {
          var u = (ph + m * k) / k, s = u === 0 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u), r = u / (Z + 1);
          h[m + Z] = Math.abs(r) < 1 ? s * i0(beta * Math.sqrt(1 - r * r)) / i0(beta) : 0;
        }
        taps.push(h);
      }
    }
    for (i = 0; i < n; i++) y[i * k] = x[i];
    for (ph = 1; ph < k; ph++) {
      var hp = taps[ph];
      for (i = 0; i < n; i++) {
        var acc = 0, lo = Math.max(-Z, i - n + 1), hi = Math.min(Z, i);
        for (m = lo; m <= hi; m++) acc += x[i - m] * hp[m + Z];
        y[i * k + ph] = acc;
      }
    }
    return y;
  };

  // Simple F0 estimate (normalised autocorrelation peak between fmin and fmax) of a voiced stretch; for tests/QA.
  D.f0 = function (x, sr, fmin, fmax, from, len) {
    fmin = fmin || 60; fmax = fmax || 400; from = from | 0; len = len || Math.min(x.length - from, Math.round(0.1 * sr));
    var lo = Math.floor(sr / fmax), hi = Math.ceil(sr / fmin), best = 0, bestR = -1;
    var r = new Float64Array(hi + 2);
    for (var l = lo - 1; l <= hi + 1; l++) {
      var s = 0, e1 = 0, e2 = 0;
      for (var i = from; i < from + len && i + l < x.length; i++) { s += x[i] * x[i + l]; e1 += x[i] * x[i]; e2 += x[i + l] * x[i + l]; }
      r[l] = s / Math.sqrt(e1 * e2 + 1e-20);
    }
    for (l = lo; l <= hi; l++) if (r[l] > bestR && r[l] >= r[l - 1] && r[l] >= r[l + 1]) { bestR = r[l]; best = l; }
    if (!best) return { hz: 0, r: 0 };
    var a = r[best - 1], b = r[best], c = r[best + 1], den = a - 2 * b + c;
    var off = den ? 0.5 * (a - c) / den : 0; // parabolic interpolation
    return { hz: sr / (best + off), r: bestR };
  };
})(typeof window !== 'undefined' ? window : globalThis);
