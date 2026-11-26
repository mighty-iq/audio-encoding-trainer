/* Earshot audio DSP: whisper-like speech by LPC analysis and noise excitation (the voice source is replaced by noise,
   the vocal-tract filter is kept, so the words stay but voicing and pitch vanish). Pure; MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var A = ES.audio = ES.audio || {};
  var D = A.dsp = A.dsp || {};

  // Levinson-Durbin on autocorrelation r[0..p] -> {a: Float64Array(p+1) with a[0]=1, err}
  D.levinson = function (r, p) {
    var a = new Float64Array(p + 1), tmp = new Float64Array(p + 1), err = r[0];
    a[0] = 1;
    if (err <= 0) return { a: a, err: 0 };
    for (var i = 1; i <= p; i++) {
      var acc = r[i];
      for (var j = 1; j < i; j++) acc += a[j] * r[i - j];
      var k = -acc / err;
      for (j = 1; j < i; j++) tmp[j] = a[j] + k * a[i - j];
      for (j = 1; j < i; j++) a[j] = tmp[j];
      a[i] = k;
      err *= 1 - k * k;
      if (err <= 1e-30) { err = 1e-30; break; }
    }
    return { a: a, err: err };
  };

  /* whisper(x, sr, {order, frameMs 25, hopMs 10, hpHz 250}, rng)
     Pre-emphasis 0.94; per 10 ms hop a Hann-windowed 25 ms frame gives LPC coefficients (autocorrelation method,
     order default sr/1000 + 4) and the prediction-error power; white noise with that power drives the all-pole
     filter (coefficients switched per hop, gain interpolated); de-emphasis; a gentle high-pass because whispers
     carry little energy below ~300 Hz. */
  D.whisper = function (x, sr, o, rng) {
    o = o || {};
    rng = rng || D.rng('whisper');
    var n = x.length, p = o.order || Math.round(sr / 1000) + 4;
    var N = Math.round((o.frameMs || 25) * sr / 1000), H = Math.round((o.hopMs || 10) * sr / 1000), i, j, k;
    var pre = 0.94, xe = new Float64Array(n);
    for (i = 0; i < n; i++) xe[i] = x[i] - (i ? pre * x[i - 1] : 0);
    var w = new Float64Array(N), wss = 0;
    for (i = 0; i < N; i++) { w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * (i + 0.5) / N); wss += w[i] * w[i]; }
    var nf = Math.ceil(n / H) + 1, coefs = new Array(nf), gains = new Float64Array(nf), fr = new Float64Array(N), r = new Float64Array(p + 1);
    for (k = 0; k < nf; k++) {
      var c = k * H, s0 = c - (N >> 1);
      for (i = 0; i < N; i++) { var t = s0 + i; fr[i] = t >= 0 && t < n ? xe[t] * w[i] : 0; }
      for (j = 0; j <= p; j++) { var acc = 0; for (i = j; i < N; i++) acc += fr[i] * fr[i - j]; r[j] = acc; }
      if (r[0] <= 1e-18) { coefs[k] = null; gains[k] = 0; continue; }
      r[0] *= 1.0001; // white-noise correction keeps the filter well conditioned
      var lp = D.levinson(r, p);
      coefs[k] = lp.a;
      gains[k] = Math.sqrt(lp.err / wss); // excitation RMS per sample
    }
    var y = new Float64Array(n), mem = new Float64Array(p + 1), noise = D.white(n, rng);
    for (i = 0; i < n; i++) {
      var fpos = i / H, k0 = Math.floor(fpos), fra = fpos - k0, k1 = Math.min(nf - 1, k0 + 1);
      var a = coefs[fra < 0.5 ? k0 : k1] || coefs[k0] || coefs[k1];
      var g = gains[k0] + fra * (gains[k1] - gains[k0]);
      var e = g * noise[i], v = e;
      if (a) for (j = 1; j <= p; j++) v -= a[j] * mem[j];
      for (j = p; j > 1; j--) mem[j] = mem[j - 1];
      mem[1] = v;
      y[i] = v;
    }
    var out = new Float32Array(n), prev = 0;
    for (i = 0; i < n; i++) { prev = y[i] + pre * prev; out[i] = prev; }
    var hp = o.hpHz == null ? 250 : o.hpHz;
    return hp > 0 ? D.filterInPlace(out, D.butter('highpass', hp, 2, sr)) : out;
  };

  // Normalised autocorrelation periodicity (max over pitch lags 2.5..15 ms) of the loudest frames; for tests/QA.
  D.periodicity = function (x, sr, opts) {
    opts = opts || {};
    var N = Math.round(0.04 * sr), hop = N >> 1, lo = Math.round(0.0025 * sr), hi = Math.round(0.015 * sr);
    var frames = [];
    for (var s = 0; s + N + hi < x.length; s += hop) {
      var e = 0; for (var i = 0; i < N; i++) e += x[s + i] * x[s + i];
      frames.push([e, s]);
    }
    frames.sort(function (a, b) { return b[0] - a[0]; });
    var take = Math.max(1, Math.round(frames.length * (opts.top || 0.3))), sum = 0;
    for (var f = 0; f < take && f < frames.length; f++) {
      var st = frames[f][1], best = 0;
      for (var l = lo; l <= hi; l++) {
        var a = 0, e1 = 0, e2 = 0;
        for (i = 0; i < N; i++) { var u = x[st + i], v = x[st + i + l]; a += u * v; e1 += u * u; e2 += v * v; }
        var rr = a / Math.sqrt(e1 * e2 + 1e-20);
        if (rr > best) best = rr;
      }
      sum += best;
    }
    return frames.length ? sum / Math.min(take, frames.length) : 0;
  };
})(typeof window !== 'undefined' ? window : globalThis);
