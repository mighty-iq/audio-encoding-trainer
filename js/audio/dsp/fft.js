/* Earshot audio DSP: radix-2 complex FFT, spectra and FFT-domain helpers. Pure; MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var A = ES.audio = ES.audio || {};
  var D = A.dsp = A.dsp || {};

  var tables = {};
  function table(n) {
    var t = tables[n];
    if (t) return t;
    var bits = Math.round(Math.log(n) / Math.LN2), rev = new Uint32Array(n), i;
    for (i = 0; i < n; i++) { var r = 0, v = i; for (var b = 0; b < bits; b++) { r = (r << 1) | (v & 1); v >>= 1; } rev[i] = r; }
    var cos = new Float64Array(n >> 1), sin = new Float64Array(n >> 1);
    for (i = 0; i < n >> 1; i++) { cos[i] = Math.cos(2 * Math.PI * i / n); sin[i] = Math.sin(2 * Math.PI * i / n); }
    t = tables[n] = { rev: rev, cos: cos, sin: sin };
    return t;
  }
  D.nextPow2 = function (n) { var p = 1; while (p < n) p <<= 1; return p; };

  // In-place complex FFT on Float64Array re/im (length a power of two). inverse=true divides by n.
  D.fft = function (re, im, inverse) {
    var n = re.length;
    if (n <= 1) return;
    var t = table(n), rev = t.rev, cs = t.cos, sn = t.sin, i, j, tr, ti;
    for (i = 0; i < n; i++) { j = rev[i]; if (j > i) { tr = re[i]; re[i] = re[j]; re[j] = tr; ti = im[i]; im[i] = im[j]; im[j] = ti; } }
    var sgn = inverse ? 1 : -1, a, b, k, xr, xi;
    for (a = 0; a < n; a += 2) { // size-2 butterflies (twiddle 1)
      xr = re[a + 1]; xi = im[a + 1]; re[a + 1] = re[a] - xr; im[a + 1] = im[a] - xi; re[a] += xr; im[a] += xi;
    }
    for (var size = 4; size <= n; size <<= 1) {
      var half = size >> 1, step = n / size, wr, wi;
      if (half < 64) { // small blocks: twiddle-outer
        for (k = 0; k < half; k++) {
          wr = cs[k * step]; wi = sgn * sn[k * step];
          for (a = k; a < n; a += size) {
            b = a + half; xr = re[b] * wr - im[b] * wi; xi = re[b] * wi + im[b] * wr;
            re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
          }
        }
      } else { // large blocks: block-outer, sequential memory access
        for (var s0 = 0; s0 < n; s0 += size) {
          for (k = 0, i = 0; k < half; k++, i += step) {
            wr = cs[i]; wi = sgn * sn[i]; a = s0 + k; b = a + half;
            xr = re[b] * wr - im[b] * wi; xi = re[b] * wi + im[b] * wr;
            re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
          }
        }
      }
    }
    if (inverse) { var s = 1 / n; for (i = 0; i < n; i++) { re[i] *= s; im[i] *= s; } }
  };

  // Frequency (Hz) of bin k for an n-point transform (negative-frequency bins map to |f|).
  D.binHz = function (k, n, sr) { return (k <= n / 2 ? k : n - k) * sr / n; };

  /* Zero-phase FFT filtering of a real signal by a magnitude response gainFn(fHz) -> linear gain.
     Pads by `pad` samples on both sides (default 2048) to keep the circular wrap out of the result.
     Two real signals can be filtered in one transform: pass y as the second argument (returns [x', y']). */
  D.fftFilter = function (x, sr, gainFn, y, pad) {
    pad = pad == null ? 2048 : pad;
    var n = x.length, N = D.nextPow2(n + 2 * pad), re = new Float64Array(N), im = new Float64Array(N), i;
    for (i = 0; i < n; i++) re[pad + i] = x[i];
    if (y) for (i = 0; i < n; i++) im[pad + i] = y[i];
    D.fft(re, im, false);
    var g = new Float64Array((N >> 1) + 1);
    for (i = 0; i <= N >> 1; i++) g[i] = gainFn(i * sr / N);
    for (i = 0; i < N; i++) { var gi = g[i <= N >> 1 ? i : N - i]; re[i] *= gi; im[i] *= gi; }
    D.fft(re, im, true);
    var ox = new Float32Array(n);
    for (i = 0; i < n; i++) ox[i] = re[pad + i];
    if (!y) return ox;
    var oy = new Float32Array(n);
    for (i = 0; i < n; i++) oy[i] = im[pad + i];
    return [ox, oy];
  };

  /* Welch power spectral density (Hann frames). Returns {f: Float64Array, psd: Float64Array (mean square per Hz),
     frames}. opts.gateDb: ignore frames more than gateDb below the loudest frame (default: keep all). */
  D.psd = function (x, sr, opts) {
    opts = opts || {};
    var N = opts.n || 1024, hop = opts.hop || (N >> 1), n = x.length;
    var w = new Float64Array(N), wss = 0, i, k;
    for (i = 0; i < N; i++) { w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N); wss += w[i] * w[i]; }
    var acc = new Float64Array((N >> 1) + 1), re = new Float64Array(N), im = new Float64Array(N);
    var starts = [], en = [];
    for (var s = 0; s + N <= n || (s === 0 && n > 0); s += hop) {
      var e = 0; for (i = 0; i < N && s + i < n; i++) e += x[s + i] * x[s + i];
      starts.push(s); en.push(e);
      if (s + N > n) break;
    }
    var maxE = 0; for (k = 0; k < en.length; k++) if (en[k] > maxE) maxE = en[k];
    var thr = opts.gateDb == null ? 0 : maxE * Math.pow(10, -opts.gateDb / 10), used = 0;
    for (k = 0; k < starts.length; k++) {
      if (en[k] < thr || en[k] <= 0) continue;
      for (i = 0; i < N; i++) { var v = starts[k] + i < n ? x[starts[k] + i] : 0; re[i] = v * w[i]; im[i] = 0; }
      D.fft(re, im, false);
      for (i = 0; i <= N >> 1; i++) acc[i] += (re[i] * re[i] + im[i] * im[i]) * (i === 0 || i === N >> 1 ? 1 : 2);
      used++;
    }
    var f = new Float64Array((N >> 1) + 1), scale = used ? 1 / (used * wss * sr) : 0;
    for (i = 0; i <= N >> 1; i++) { f[i] = i * sr / N; acc[i] *= scale; }
    return { f: f, psd: acc, frames: used };
  };

  // Third-octave band centres (Hz) from lo to hi (base 1000 Hz, ratio 2^(1/3)).
  D.thirdOctaves = function (lo, hi) {
    var out = [];
    for (var k = -20; k <= 14; k++) { var fc = 1000 * Math.pow(2, k / 3); if (fc >= lo * 0.99 && fc <= hi * 1.01) out.push(fc); }
    return out;
  };
  // Band power (mean square) of a PSD between f1 and f2 (sum of psd * df).
  D.bandPower = function (spec, f1, f2) {
    var f = spec.f, p = spec.psd, df = f[1] - f[0], s = 0;
    for (var i = 0; i < f.length; i++) if (f[i] >= f1 && f[i] < f2) s += p[i] * df;
    return s;
  };
})(typeof window !== 'undefined' ? window : globalThis);
