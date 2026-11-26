/* Earshot audio DSP: room reverberation, fast. A room model has two parts: the first-order (wall, floor, ceiling)
   reflections as sparse taps at the full rate, and everything later (higher-order reflections and the diffuse tail)
   at half the rate, convolved by FFT. D.rir composes the same model into one full-rate impulse response, so
   D.reverb(x, model) equals convolving x with D.rir (up to the half-band filters). The late part therefore carries
   no energy above ~3.6 kHz at 16 kHz: the late field is dull, as high frequencies decay fastest in rooms.
   Pure; MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var A = ES.audio = ES.audio || {};
  var D = A.dsp = A.dsp || {};
  var C = 343;

  // ---- half-band filters (Kaiser-windowed sinc, cut-off at a quarter of the input rate) ----
  var HBK = 10, HB = null; // odd taps +-1, +-3, ... +-(2*HBK-1)
  function i0(x) { var s = 1, t = 1; for (var k = 1; k < 30; k++) { t *= (x / (2 * k)) * (x / (2 * k)); s += t; } return s; }
  function halfband() {
    if (HB) return HB;
    var beta = 7.5, span = 2 * HBK, c = new Float64Array(HBK);
    for (var k = 0; k < HBK; k++) {
      var j = 2 * k + 1, w = i0(beta * Math.sqrt(1 - (j / span) * (j / span))) / i0(beta);
      c[k] = Math.sin(Math.PI * j / 2) / (Math.PI * j) * w;
    }
    HB = c; return c;
  }
  // Decimate by 2: low-pass at a quarter of the rate, keep every second sample.
  D.decimate2 = function (x) {
    var c = halfband(), n = x.length, m = (n + 1) >> 1, y = new Float32Array(m);
    for (var i = 0; i < m; i++) {
      var p = 2 * i, acc = 0.5 * x[p];
      for (var k = 0; k < HBK; k++) {
        var a = p - 2 * k - 1, b = p + 2 * k + 1;
        acc += c[k] * ((a >= 0 ? x[a] : 0) + (b < n ? x[b] : 0));
      }
      y[i] = acc;
    }
    return y;
  };
  // Interpolate by 2 to n samples (gain 2, so amplitudes are kept).
  D.interp2 = function (y, n) {
    var c = halfband(), m = y.length, x = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      if (!(i & 1)) { var e = i >> 1; x[i] = e < m ? y[e] : 0; continue; }
      var q = i >> 1, acc = 0;
      for (var k = 0; k < HBK; k++) {
        var a = q - k, b = q + 1 + k;
        acc += 2 * c[k] * ((a >= 0 && a < m ? y[a] : 0) + (b < m ? y[b] : 0));
      }
      x[i] = acc;
    }
    return x;
  };

  /* Room model (cached by the caller). o: {rt60, size, seed, maxSec}. Geometry, absorption (Sabine) and the
     per-band decay (D.TAIL_BANDS: centre Hz, RT factor, Q); listener and source at fixed canonical positions 2 m apart.
     Returns {sr, early: [{d, gL, gR}] (full rate, samples after the direct sound), tail: [L, R] (half rate), len}. */
  D.TAIL_BANDS = [[125, 1.15, 1.414], [250, 1.08, 1.414], [500, 1.0, 1.414], [1000, 1.0, 1.414], [2000, 0.9, 1.414], [3150, 0.8, 4]];
  D.roomModel = function (sr, o) {
    o = o || {};
    var rt60 = D.clamp(+o.rt60 || 0.5, 0.1, 12), dm = D.roomDims(o.size), rng = D.rng(o.seed == null ? 'room' : 'room:' + o.seed);
    var alpha = D.clamp(0.161 * dm.V / (dm.S * rt60), 0.01, 0.95), beta = Math.sqrt(1 - alpha), sr2 = sr / 2;
    var len = Math.round(Math.min(o.maxSec || 4, rt60 * 1.15 + 0.1) * sr), len2 = (len + 1) >> 1;
    var lx = 0.4 * dm.l, ly = 0.45 * dm.w, lz = Math.min(1.2, dm.h * 0.45);
    var sx = Math.min(lx + Math.min(2, 0.35 * dm.l), dm.l - 0.3), sy = ly + 0.3, sz = Math.min(1.6, dm.h * 0.6);
    var r0 = Math.hypot(sx - lx, sy - ly, sz - lz), early = [], late = [], ord = 3;
    for (var a = -ord; a <= ord; a++) for (var b = -ord; b <= ord; b++) for (var c = -ord; c <= ord; c++) {
      for (var p = 0; p < 8; p++) {
        var px = p & 1, py = (p >> 1) & 1, pz = (p >> 2) & 1;
        var n = Math.abs(a - px) + Math.abs(a) + Math.abs(b - py) + Math.abs(b) + Math.abs(c - pz) + Math.abs(c);
        if (n === 0 || n > ord) continue;
        var ix = (1 - 2 * px) * sx + 2 * a * dm.l, iy = (1 - 2 * py) * sy + 2 * b * dm.w, iz = (1 - 2 * pz) * sz + 2 * c * dm.h;
        var dx = ix - lx, dy = iy - ly, dz = iz - lz, r = Math.sqrt(dx * dx + dy * dy + dz * dz), dt = (r - r0) / C;
        if (dt <= 0 || dt > 0.1) continue;
        var az = Math.atan2(-dy, dx) * 180 / Math.PI, it = D.itd(az), ild = D.db2g(3 * Math.sin(az * Math.PI / 180));
        var g = Math.pow(beta, n) * r0 / r, ref = { tL: dt + Math.max(0, it), tR: dt - Math.min(0, it), gL: g / ild, gR: g * ild, t: dt };
        (n === 1 ? early : late).push(ref);
      }
    }
    var tail = [new Float32Array(len2), new Float32Array(len2)], tFirst = Infinity, k, i;
    early.concat(late).forEach(function (f) { if (f.t < tFirst) tFirst = f.t; });
    if (!isFinite(tFirst)) tFirst = 0.003;
    // a half-rate impulse carries twice its energy once interpolated, so late reflections go in at g / sqrt(2)
    late.forEach(function (f) { put(tail[0], f.tL * sr2, f.gL * Math.SQRT1_2); put(tail[1], f.tR * sr2, f.gR * Math.SQRT1_2); });
    // diffuse tail: independent noise per ear and band, own exponential decay, faded in over the mixing time,
    // starting at the power of the reflections around its start
    var tMix = D.clamp(Math.sqrt(dm.V) / 1000, 0.005, 0.12), tEnd = tFirst + tMix + 0.02, eWin = 0;
    early.concat(late).forEach(function (f) { if (f.t <= tEnd) eWin += f.g ? f.g * f.g : 0.5 * (f.gL * f.gL + f.gR * f.gR); });
    var p0 = eWin / Math.max(1e-3, tEnd - tFirst) / sr; // per-sample power at the full rate
    var dif = [new Float32Array(len2), new Float32Array(len2)], st = Math.floor(tFirst * sr2), nm = Math.max(1, Math.floor(tMix * sr2));
    for (var ch = 0; ch < 2; ch++) {
      var acc = dif[ch], crng = D.fork(rng, 'ch' + ch);
      D.TAIL_BANDS.forEach(function (bd, bi) {
        var nz = D.white(len2, D.fork(crng, 'b' + bi)), decay = Math.exp(-6.9078 / (rt60 * bd[1] * sr2)), env = 1;
        D.filterInPlace(nz, D.biquad('bandpass', bd[0], bd[2], sr2));
        for (var j = 0; j < len2; j++) { if (j >= st) acc[j] += nz[j] * env; env *= decay; }
      });
      for (i = 0; i < st && i < len2; i++) acc[i] = 0;
      for (i = 0; i < nm && st + i < len2; i++) acc[st + i] *= 0.5 - 0.5 * Math.cos(Math.PI * (i + 0.5) / nm);
    }
    var a0 = Math.floor((tFirst + tMix) * sr2), a1 = Math.min(len2, a0 + Math.round(0.02 * sr2));
    var pt = a1 > a0 ? D.meanSquare(dif, a0, a1) : 1, gt = pt > 0 ? Math.sqrt(p0 / pt) : 1; // interpolation keeps power per sample
    for (ch = 0; ch < 2; ch++) for (i = 0; i < len2; i++) tail[ch][i] += dif[ch][i] * gt;
    var model = { sr: sr, len: len, rt60: rt60, dims: dm, tFirst: tFirst,
      early: early.map(function (f) { return { dL: Math.round(f.tL * sr), dR: Math.round(f.tR * sr), gL: f.gL, gR: f.gR }; }), tail: tail, G: {} };
    // unit energy per channel of the composed response
    var ir = D.composeRir(model);
    for (ch = 0; ch < 2; ch++) {
      var e = D.energy(ir[ch]), s = 1 / Math.sqrt(e || 1);
      D.scaleInPlace(tail[ch], s);
      for (k = 0; k < model.early.length; k++) { if (ch === 0) model.early[k].gL *= s; else model.early[k].gR *= s; }
    }
    return model;
    function put(arr, pos, gg) { var i0 = Math.floor(pos), fr = pos - i0; if (i0 >= 0 && i0 < arr.length) arr[i0] += gg * (1 - fr); if (i0 + 1 < arr.length) arr[i0 + 1] += gg * fr; }
  };
  // The model as one full-rate stereo impulse response (sample 0 = the direct sound's arrival, not included).
  D.composeRir = function (model) {
    var out = [D.interp2(model.tail[0], model.len), D.interp2(model.tail[1], model.len)];
    model.early.forEach(function (f) { if (f.dL < model.len) out[0][f.dL] += f.gL; if (f.dR < model.len) out[1][f.dR] += f.gR; });
    return out;
  };
  D.rir = function (sr, o) { return D.composeRir(D.roomModel(sr, o)); };

  /* Reverberate a mono signal through a room model -> [L, R] at the full rate, length x.length + model.len.
     Late part: decimate by 2, one complex FFT of the signal, product with the cached FFT of (tailL + i tailR),
     one inverse FFT gives both ears (real and imaginary parts), interpolate by 2. Early part: sparse taps. */
  D.reverb = function (x, model) {
    var n = x.length, outLen = n + model.len, x2 = D.decimate2(x), t2 = model.tail[0].length;
    var N = D.nextPow2(x2.length + t2), G = model.G[N], i;
    if (!G) {
      // x2: each half-rate tap stands for two full-rate samples of a band-limited response
      var gr = new Float64Array(N), gi = new Float64Array(N);
      for (i = 0; i < t2; i++) { gr[i] = 2 * model.tail[0][i]; gi[i] = 2 * model.tail[1][i]; }
      D.fft(gr, gi, false);
      G = model.G[N] = { re: gr, im: gi };
    }
    var re = new Float64Array(N), im = new Float64Array(N);
    re.set(x2);
    D.fft(re, im, false);
    for (i = 0; i < N; i++) { var a = re[i], b = im[i], c = G.re[i], d = G.im[i]; re[i] = a * c - b * d; im[i] = a * d + b * c; }
    D.fft(re, im, true);
    var m2 = Math.min(N, (outLen + 1) >> 1), yl = new Float32Array(m2), yr = new Float32Array(m2);
    for (i = 0; i < m2; i++) { yl[i] = re[i]; yr[i] = im[i]; }
    var L = D.interp2(yl, outLen), R = D.interp2(yr, outLen);
    model.early.forEach(function (f) {
      var gL = f.gL, gR = f.gR, dL = f.dL, dR = f.dR, j;
      for (j = 0; j < n && j + dL < outLen; j++) L[j + dL] += gL * x[j];
      for (j = 0; j < n && j + dR < outLen; j++) R[j + dR] += gR * x[j];
    });
    return [L, R];
  };

  // Long-term colour of the room sound as LTAS points (dB re its mean), for stationary beds placed in the room.
  D.roomColour = function (model) {
    if (model.colour) return model.colour;
    var ir = D.composeRir(model), l = D.ltasOf(ir[0], model.sr, { gateDb: 200 }), r = D.ltasOf(ir[1], model.sr, { gateDb: 200 });
    var m = D.ltasMean([l, r]), mean = 0;
    m.forEach(function (p) { mean += p[1]; });
    mean /= m.length;
    model.colour = m.map(function (p) { return [p[0], p[1] - mean]; });
    return model.colour;
  };
})(typeof window !== 'undefined' ? window : globalThis);
