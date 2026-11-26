/* Earshot audio DSP: speech-shaped noise, pink noise, long-term spectra, interruption (gating). Pure; MIT. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var A = ES.audio = ES.audio || {};
  var D = A.dsp = A.dsp || {};

  /* LTAS = array of [fHz, dB] points of spectral density (dB per Hz, any reference), interpolated linearly in
     log-frequency and held flat beyond the ends. The default is a generic long-term speech spectrum shape (our own
     smooth approximation, not a standard's table): a rise to 250 Hz, a plateau to 500 Hz, then about -9 dB per
     octave to 1 kHz and -8 dB per octave above. Prefer a measured LTAS of the actual voices (ES.data.ltas or ltasOf). */
  D.LTAS_DEFAULT = [[50, -22], [100, -9], [160, -3], [250, 0], [500, 0], [1000, -9], [2000, -17], [4000, -25], [8000, -33]];
  D.ltasAt = function (ltas, f) {
    var L = ltas && ltas.length ? ltas : D.LTAS_DEFAULT;
    if (f <= L[0][0]) return L[0][1];
    if (f >= L[L.length - 1][0]) return L[L.length - 1][1];
    for (var i = 1; i < L.length; i++) {
      if (f <= L[i][0]) {
        var a = Math.log(L[i - 1][0]), b = Math.log(L[i][0]), t = (Math.log(f) - a) / (b - a);
        return L[i - 1][1] + t * (L[i][1] - L[i - 1][1]);
      }
    }
    return L[L.length - 1][1];
  };

  /* Noise with a given power spectral density shape: a random complex spectrum (independent Gaussian real and
     imaginary parts in every bin, scaled by sqrt(psd)) and one inverse FFT; the real and imaginary outputs are two
     independent noises with the same spectrum, which gives decorrelated stereo for free. The result is periodic
     with period N = nextPow2(n), so opts.loop returns exactly N samples that loop seamlessly.
     Returns unit-RMS Float32Array (or [a, b] when opts.stereo). */
  D.shapedNoise = function (n, sr, psdFn, rng, opts) {
    opts = opts || {};
    var N = D.nextPow2(Math.max(2, n)), re = new Float64Array(N), im = new Float64Array(N), i, k;
    var mag = typeof psdFn === 'function' ? null : psdFn; // a precomputed magnitude array (N/2 + 1) may be passed
    if (!mag) {
      mag = new Float64Array((N >> 1) + 1);
      for (k = 1; k <= N >> 1; k++) mag[k] = Math.sqrt(Math.max(0, psdFn(k * sr / N, k)));
    }
    // uniform random real and imaginary parts: every bin gets the same expected power, and each output sample is a
    // sum of N random terms, so it is Gaussian by the central limit theorem (no transcendental call per bin)
    var fill = D.fastUniform(rng);
    fill(re, 0.5); fill(im, 0.5);
    for (k = 0; k < N; k++) { var m = mag[k <= N >> 1 ? k : N - k]; re[k] *= m; im[k] *= m; }
    D.fft(re, im, true);
    var len = opts.loop ? N : n, a = new Float32Array(len), b = opts.stereo ? new Float32Array(len) : null;
    for (i = 0; i < len; i++) { a[i] = re[i]; if (b) b[i] = im[i]; }
    D.scaleInPlace(a, 1 / Math.sqrt(D.meanSquare(a) || 1));
    if (b) D.scaleInPlace(b, 1 / Math.sqrt(D.meanSquare(b) || 1));
    return b ? [a, b] : a;
  };
  // Speech-shaped noise: white noise shaped to an LTAS by FFT filtering (unit RMS).
  // Magnitude per FFT bin (N/2 + 1 values) of an LTAS, in one pass over the bins (log-frequency interpolation).
  var magCache = [];
  D.ltasMag = function (ltas, N, sr) {
    var L = ltas && ltas.length ? ltas : D.LTAS_DEFAULT, key = N + '|' + sr + '|' + JSON.stringify(L);
    for (var c = 0; c < magCache.length; c++) if (magCache[c].key === key) return magCache[c].mag;
    var mag = new Float64Array((N >> 1) + 1), j = 0;
    var lf = L.map(function (p) { return Math.log(p[0]); });
    for (var k = 1; k <= N >> 1; k++) {
      var f = k * sr / N, db;
      if (f <= L[0][0]) db = L[0][1];
      else if (f >= L[L.length - 1][0]) db = L[L.length - 1][1];
      else {
        while (j < L.length - 2 && f > L[j + 1][0]) j++;
        var t = (Math.log(f) - lf[j]) / (lf[j + 1] - lf[j]);
        db = L[j][1] + t * (L[j + 1][1] - L[j][1]);
      }
      mag[k] = Math.pow(10, db / 20);
    }
    magCache.unshift({ key: key, mag: mag });
    if (magCache.length > 6) magCache.pop();
    return mag; // shared: callers must not modify it
  };
  D.ssn = function (n, sr, ltas, rng, opts) {
    rng = rng || D.rng('ssn');
    var N = D.nextPow2(Math.max(2, n));
    return D.shapedNoise(n, sr, D.ltasMag(ltas, N, sr), rng, opts);
  };
  // Pink noise (power falls 3 dB per octave; unit RMS). sr only scales the axis, so it is optional.
  var pinkMag = {};
  D.pink = function (n, rng, opts) {
    rng = rng || D.rng('pink');
    var N = D.nextPow2(Math.max(2, n)), mag = pinkMag[N];
    if (!mag) {
      mag = pinkMag[N] = new Float64Array((N >> 1) + 1);
      for (var k = 1; k <= N >> 1; k++) mag[k] = 1 / Math.sqrt(k);
    }
    return D.shapedNoise(n, 16000, mag, rng, opts);
  };

  // Long-term spectrum of a signal as LTAS points at third-octave centres (frames >40 dB below the loudest skipped).
  D.ltasOf = function (x, sr, opts) {
    opts = opts || {};
    var sp = D.psd(x, sr, { n: 1024, gateDb: opts.gateDb == null ? 40 : opts.gateDb }), out = [];
    var cs = D.thirdOctaves(63, sr * 0.45), r = Math.pow(2, 1 / 6);
    for (var i = 0; i < cs.length; i++) {
      var f1 = cs[i] / r, f2 = cs[i] * r, pw = D.bandPower(sp, f1, f2) / (f2 - f1);
      out.push([cs[i], D.p2db(pw)]);
    }
    return out;
  };
  // Mean of several LTAS (power average at the same frequencies as the first).
  D.ltasMean = function (list) {
    if (!list.length) return null;
    var out = [];
    for (var i = 0; i < list[0].length; i++) {
      var s = 0;
      for (var j = 0; j < list.length; j++) s += Math.pow(10, D.ltasAt(list[j], list[0][i][0]) / 10);
      out.push([list[0][i][0], D.p2db(s / list.length)]);
    }
    return out;
  };

  /* Gating (interrupted speech). o: {rateHz, duty (fraction on), rampMs (raised-cosine, default 5), phase (0..1;
     random from rng when absent), gaps: [[t0, t1], ...] seconds (explicit gaps instead of periodic gating),
     fill: 'silence'|'noise', fillDb (filler noise RMS re the signal's active level, default 0), fillLtas}.
     Ramps are centred on the nominal edges, so the time with gain >= 0.5 is exactly the duty cycle. */
  function ramp(v) { return v <= 0 ? 0 : v >= 1 ? 1 : 0.5 - 0.5 * Math.cos(Math.PI * v); }
  D.gateMask = function (n, sr, o, rng) {
    o = o || {};
    var g = new Float32Array(n), R = Math.max(1, (o.rampMs == null ? 5 : o.rampMs) * sr / 1000), i, t;
    if (o.gaps && o.gaps.length) {
      for (i = 0; i < n; i++) g[i] = 1;
      for (var k = 0; k < o.gaps.length; k++) {
        var s = o.gaps[k][0] * sr, e = o.gaps[k][1] * sr, a = Math.max(0, Math.floor(s - R)), b = Math.min(n, Math.ceil(e + R));
        for (i = a; i < b; i++) {
          var off = 1 - ramp((i - s) / R + 0.5) * ramp((e - i) / R + 0.5);
          if (off < g[i]) g[i] = off;
        }
      }
      return g;
    }
    var rate = o.rateHz || 2, duty = D.clamp(o.duty == null ? 0.5 : o.duty, 0, 1), P = sr / rate, on = duty * P;
    var ph = (o.phase == null ? (rng || D.rng('gate')).next() : o.phase) * P;
    if (on >= P) { for (i = 0; i < n; i++) g[i] = 1; return g; }
    if (on <= 0) return g;
    for (i = 0; i < n; i++) {
      t = i + ph;
      var m = Math.floor(t / P), best = 0;
      for (var d = -1; d <= 1; d++) {
        var st = (m + d) * P, en = st + on, v = ramp((t - st) / R + 0.5) * ramp((en - t) / R + 0.5);
        if (v > best) best = v;
      }
      g[i] = best;
    }
    return g;
  };
  D.gate = function (x, sr, o, rng) {
    o = o || {};
    rng = rng || D.rng('gate');
    var n = x.length, g = D.gateMask(n, sr, o, D.fork(rng, 'mask')), y = new Float32Array(n), i;
    for (i = 0; i < n; i++) y[i] = x[i] * g[i];
    if (o.fill === 'noise') {
      var lev = D.activeDb(x, sr), ltas = o.fillLtas || D.ltasOf(x, sr);
      var nz = D.ssn(n, sr, ltas, D.fork(rng, 'fill')), k = D.db2g(lev + (o.fillDb || 0));
      for (i = 0; i < n; i++) y[i] += nz[i] * k * (1 - g[i]);
    }
    return y;
  };
})(typeof window !== 'undefined' ? window : globalThis);
