/* Earshot audio DSP core: dB helpers, levels (ITU-T P.56-style active level), seeded rng access.
   Pure functions on Float32Array (or [L, R] channel arrays); no DOM, no Web Audio. MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var A = ES.audio = ES.audio || {};
  var D = A.dsp = A.dsp || {};

  // All levels are 10*log10(mean square) re 1.0 (a full-scale square wave is 0 dB; a full-scale sine is -3.01 dB).
  D.FLOOR_DB = -200;
  D.db2g = function (db) { return Math.pow(10, db / 20); };
  D.g2db = function (g) { g = Math.abs(g); return g > 1e-10 ? 20 * Math.log10(g) : D.FLOOR_DB; };
  D.p2db = function (p) { return p > 1e-20 ? 10 * Math.log10(p) : D.FLOOR_DB; };
  D.clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };

  function isArr(x) { return x && typeof x.length === 'number' && typeof x[0] === 'number'; }
  // Normalise input to an array of channels.
  D.chans = function (x) { return isArr(x) || (x && x.length === 0 && x.BYTES_PER_ELEMENT) ? [x] : x; };

  // Mean square over channels (mean of the channels' mean squares), optionally over [from, to) samples.
  D.meanSquare = function (x, from, to) {
    var ch = D.chans(x), n = ch[0].length, a = Math.max(0, from | 0), b = to == null ? n : Math.min(n, to | 0);
    if (b <= a) return 0;
    var s = 0;
    for (var c = 0; c < ch.length; c++) { var d = ch[c]; for (var i = a; i < b; i++) s += d[i] * d[i]; }
    return s / ((b - a) * ch.length);
  };
  D.energy = function (x) { // sum of squares, averaged over channels
    var ch = D.chans(x), s = 0;
    for (var c = 0; c < ch.length; c++) { var d = ch[c]; for (var i = 0; i < d.length; i++) s += d[i] * d[i]; }
    return s / ch.length;
  };
  D.rmsDb = function (x, from, to) { return D.p2db(D.meanSquare(x, from, to)); };
  D.peak = function (x) {
    var ch = D.chans(x), p = 0;
    for (var c = 0; c < ch.length; c++) { var d = ch[c]; for (var i = 0; i < d.length; i++) { var v = d[i] < 0 ? -d[i] : d[i]; if (v > p) p = v; } }
    return p;
  };
  D.peakDb = function (x) { return D.g2db(D.peak(x)); };

  /* Active speech level, after ITU-T P.56 method B (an approximation, not a certified implementation):
     envelope = two cascaded one-pole smoothers (time constant 30 ms) of the rectified signal; a sample is active at
     threshold c when the envelope reached c within the last 200 ms (hangover); the active level is the long-term
     energy over the active samples at the threshold that sits 15.9 dB (margin) below that level.
     Thresholds are scanned in 0.1 dB steps with linear interpolation. Stereo: rectified = sqrt((L^2+R^2)/2).
     Returns {db, act (activity factor 0..1), rmsDb}. Silence returns db = FLOOR_DB. */
  var BIN = 0.1, LO = -140, NB = 1700; // histogram from -140 dB to +30 dB
  // opts.tail (s): measure as if the signal were followed by that much silence. Sources are measured with
  // SOURCE_TAIL, so a clip's level alone equals its level inside a longer mix (the hangover counts the same samples).
  D.SOURCE_TAIL = 0.5;
  D.activeLevel = function (x, sr, opts) {
    opts = opts || {};
    var ch = D.chans(x), n0 = ch[0].length, nc = ch.length;
    if (!n0) return { db: D.FLOOR_DB, act: 0, rmsDb: D.FLOOR_DB };
    var tc = opts.tc || 0.03, hang = Math.max(1, Math.round((opts.hang || 0.2) * sr)), M = opts.margin == null ? 15.9 : opts.margin;
    var g = Math.exp(-1 / (tc * sr)), h = 1 - g, n = n0 + Math.max(0, Math.round((opts.tail || 0) * sr));
    var env = new Float32Array(n), q = 0, p = 0, E = 0, i, c;
    for (i = 0; i < n0; i++) {
      var s2 = 0;
      for (c = 0; c < nc; c++) { var v = ch[c][i]; s2 += v * v; }
      s2 /= nc; E += s2;
      q = g * q + h * Math.sqrt(s2);
      p = g * p + h * q;
      env[i] = p;
    }
    for (; i < n; i++) { q = g * q; p = g * p + h * q; env[i] = p; }
    if (E <= 0) return { db: D.FLOOR_DB, act: 0, rmsDb: D.FLOOR_DB };
    // running max over the last `hang` samples (monotonic deque) -> histogram of its level in dB
    var hist = new Float64Array(NB), dq = new Int32Array(n), head = 0, tail = 0;
    for (i = 0; i < n; i++) {
      while (tail > head && env[dq[tail - 1]] <= env[i]) tail--;
      dq[tail++] = i;
      if (dq[head] <= i - hang) head++;
      var m = env[dq[head]];
      if (m > 1e-9) {
        var b = Math.floor((20 * Math.log10(m) - LO) / BIN);
        hist[b < 0 ? 0 : b >= NB ? NB - 1 : b]++;
      }
    }
    // A(k) = number of samples whose hangover envelope >= threshold of bin k (cumulative from the top)
    var cum = new Float64Array(NB + 1);
    for (var k = NB - 1; k >= 0; k--) cum[k] = cum[k + 1] + hist[k];
    var prevD = null, prevL = null, result = null, act = 0;
    for (k = 0; k < NB; k++) {
      var Ak = cum[k];
      if (Ak <= 0) break;
      var Lk = 10 * Math.log10(E / Ak), Ck = LO + k * BIN, dk = Lk - Ck;
      if (dk <= M) {
        if (prevD === null) { result = Lk; act = Ak / n0; }
        else {
          var t = (prevD - M) / (prevD - dk);
          result = prevL + t * (Lk - prevL);
          act = (cum[k - 1] + t * (Ak - cum[k - 1])) / n0;
        }
        break;
      }
      prevD = dk; prevL = Lk;
    }
    var rms = 10 * Math.log10(E / n0);
    if (result === null) { result = rms; act = 1; } // never reached the margin: treat as continuous
    return { db: result, act: act, rmsDb: rms };
  };
  D.activeDb = function (x, sr, opts) { return D.activeLevel(x, sr, opts).db; };

  // ---- array helpers ----
  D.scale = function (x, g) { var y = new Float32Array(x.length); for (var i = 0; i < x.length; i++) y[i] = x[i] * g; return y; };
  D.scaleInPlace = function (x, g) { for (var i = 0; i < x.length; i++) x[i] *= g; return x; };
  D.addInto = function (dst, src, offset, g) { // dst[offset + i] += g * src[i], clipped to dst
    g = g == null ? 1 : g; offset = offset | 0;
    var a = Math.max(0, -offset), b = Math.min(src.length, dst.length - offset);
    for (var i = a; i < b; i++) dst[offset + i] += g * src[i];
    return dst;
  };
  D.copy = function (x) { return new Float32Array(x); };
  // Raised-cosine fades in and out (in place).
  D.fade = function (x, nIn, nOut) {
    var n = x.length, i;
    nIn = Math.min(nIn | 0, n); nOut = Math.min(nOut | 0, n);
    for (i = 0; i < nIn; i++) x[i] *= 0.5 - 0.5 * Math.cos(Math.PI * (i + 0.5) / nIn);
    for (i = 0; i < nOut; i++) x[n - 1 - i] *= 0.5 - 0.5 * Math.cos(Math.PI * (i + 0.5) / nOut);
    return x;
  };

  // ---- seeded randomness ----
  // Uses ES.core.rng (the app's single generator) when loaded; otherwise a local sfc32 so DSP stays testable alone.
  function hash32(s) { // FNV-1a
    s = String(s); var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function localRng(seed) {
    var a = hash32(seed), b = hash32('b' + seed), c = hash32('c' + seed), d = hash32('d' + seed) | 1;
    function next() {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
      var t = (a + b) | 0; a = b ^ (b >>> 9); b = (c + (c << 3)) | 0; c = (c << 21) | (c >>> 11);
      d = (d + 1) | 0; t = (t + d) | 0; c = (c + t) | 0;
      return (t >>> 0) / 4294967296;
    }
    for (var i = 0; i < 12; i++) next();
    var r = {
      next: next,
      float: function (lo, hi) { return lo + (hi - lo) * next(); },
      int: function (lo, hi) { return lo + Math.floor((hi - lo + 1) * next()); },
      pick: function (arr) { return arr[Math.floor(next() * arr.length)]; },
      shuffle: function (arr) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(next() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; },
      fork: function (label) { return localRng(String(seed) + '/' + label); }
    };
    return r;
  }
  D.hash32 = hash32;
  D.rng = function (seed) {
    if (seed && typeof seed.next === 'function') return seed;
    if (ES.core && typeof ES.core.rng === 'function') return ES.core.rng(seed == null ? 1 : seed);
    return localRng(seed == null ? 1 : seed);
  };
  // Child stream by label, so adding or removing one element never changes another element's noise.
  D.fork = function (rng, label) { return rng && rng.fork ? rng.fork(label) : D.rng(String(label)); };
  // Standard normal from an rng (Box-Muller).
  D.gauss = function (rng) {
    var u = rng.next() || 1e-12, v = rng.next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  /* Bulk noise: a xorshift32 stream seeded by one draw of the seeded rng, so long noise buffers cost ~2 ns a sample
     and stay fully determined by the seed. fill(arr, scale) writes uniform values in [-scale, scale). */
  D.fastUniform = function (rng) {
    var s = (Math.floor(rng.next() * 4294967296) ^ 0x9e3779b9) >>> 0 || 1;
    return function (arr, scale, from, to) {
      var k = (scale == null ? 1 : scale) * 2 / 4294967296, a = from | 0, b = to == null ? arr.length : to, x = s;
      for (var i = a; i < b; i++) { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; arr[i] = ((x >>> 0) - 2147483648) * k; }
      s = x >>> 0 || 1;
      return arr;
    };
  };
  // Uniform white noise with unit variance (becomes Gaussian-like after band filtering).
  D.white = function (n, rng) {
    return D.fastUniform(rng)(new Float32Array(n), Math.sqrt(3));
  };
})(typeof window !== 'undefined' ? window : globalThis);
