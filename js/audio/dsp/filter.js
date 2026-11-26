/* Earshot audio DSP: biquad design (RBJ cookbook), cascades, Butterworth band limits, spectral tilt. Pure; MIT. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var A = ES.audio = ES.audio || {};
  var D = A.dsp = A.dsp || {};

  /* biquad(type, fHz, q, sr, gainDb) -> {b0, b1, b2, a1, a2} (a0 normalised to 1).
     types: lowpass, highpass, bandpass (0 dB peak), notch, allpass, peaking, lowshelf, highshelf,
     lowpass1 / highpass1 (first order; q ignored). */
  D.biquad = function (type, f, q, sr, gainDb) {
    f = D.clamp(f, 1, sr * 0.4999); q = q > 0 ? q : Math.SQRT1_2;
    var w0 = 2 * Math.PI * f / sr, cw = Math.cos(w0), sw = Math.sin(w0), al = sw / (2 * q);
    var Ag = Math.pow(10, (gainDb || 0) / 40), sA = Math.sqrt(Ag), b0, b1, b2, a0, a1, a2;
    switch (type) {
      case 'lowpass': b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; break;
      case 'highpass': b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; break;
      case 'bandpass': b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; break;
      case 'notch': b0 = 1; b1 = -2 * cw; b2 = 1; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; break;
      case 'allpass': b0 = 1 - al; b1 = -2 * cw; b2 = 1 + al; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; break;
      case 'peaking': b0 = 1 + al * Ag; b1 = -2 * cw; b2 = 1 - al * Ag; a0 = 1 + al / Ag; a1 = -2 * cw; a2 = 1 - al / Ag; break;
      case 'lowshelf':
        b0 = Ag * ((Ag + 1) - (Ag - 1) * cw + 2 * sA * al); b1 = 2 * Ag * ((Ag - 1) - (Ag + 1) * cw);
        b2 = Ag * ((Ag + 1) - (Ag - 1) * cw - 2 * sA * al); a0 = (Ag + 1) + (Ag - 1) * cw + 2 * sA * al;
        a1 = -2 * ((Ag - 1) + (Ag + 1) * cw); a2 = (Ag + 1) + (Ag - 1) * cw - 2 * sA * al; break;
      case 'highshelf':
        b0 = Ag * ((Ag + 1) + (Ag - 1) * cw + 2 * sA * al); b1 = -2 * Ag * ((Ag - 1) + (Ag + 1) * cw);
        b2 = Ag * ((Ag + 1) + (Ag - 1) * cw - 2 * sA * al); a0 = (Ag + 1) - (Ag - 1) * cw + 2 * sA * al;
        a1 = 2 * ((Ag - 1) - (Ag + 1) * cw); a2 = (Ag + 1) - (Ag - 1) * cw - 2 * sA * al; break;
      case 'lowpass1': case 'highpass1': {
        var K = Math.tan(w0 / 2);
        if (type === 'lowpass1') { b0 = K; b1 = K; } else { b0 = 1; b1 = -1; }
        b2 = 0; a0 = K + 1; a1 = K - 1; a2 = 0; break;
      }
      default: throw new Error('unknown biquad type ' + type);
    }
    return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
  };

  // Filter x through one biquad or a cascade (array). Returns a new Float32Array (transposed direct form II).
  D.filter = function (x, coefs) {
    var y = new Float32Array(x);
    return D.filterInPlace(y, coefs);
  };
  D.filterInPlace = function (y, coefs) {
    var cs = Array.isArray(coefs) ? coefs : [coefs], n = y.length;
    for (var s = 0; s < cs.length; s++) {
      var c = cs[s], b0 = c.b0, b1 = c.b1, b2 = c.b2, a1 = c.a1, a2 = c.a2, z1 = 0, z2 = 0;
      for (var i = 0; i < n; i++) {
        var xi = y[i], yi = b0 * xi + z1;
        z1 = b1 * xi - a1 * yi + z2; z2 = b2 * xi - a2 * yi;
        y[i] = yi;
      }
    }
    return y;
  };
  // Magnitude response (dB) of a biquad or cascade at fHz.
  D.freqz = function (coefs, f, sr) {
    var cs = Array.isArray(coefs) ? coefs : [coefs], w = 2 * Math.PI * f / sr, db = 0;
    var c1 = Math.cos(w), s1 = Math.sin(w), c2 = Math.cos(2 * w), s2 = Math.sin(2 * w);
    for (var i = 0; i < cs.length; i++) {
      var c = cs[i];
      var nr = c.b0 + c.b1 * c1 + c.b2 * c2, ni = -(c.b1 * s1 + c.b2 * s2);
      var dr = 1 + c.a1 * c1 + c.a2 * c2, di = -(c.a1 * s1 + c.a2 * s2);
      db += 10 * Math.log10((nr * nr + ni * ni) / (dr * dr + di * di) + 1e-30);
    }
    return db;
  };

  /* Butterworth cascade: type 'lowpass'|'highpass', order 1..8. Even orders use Q_k = 1/(2 cos((2k-1)pi/(2N)));
     odd orders add one first-order section. */
  D.butter = function (type, f, order, sr) {
    order = Math.max(1, Math.min(8, order | 0 || 4));
    var out = [], pairs = order >> 1;
    for (var k = 1; k <= pairs; k++) out.push(D.biquad(type, f, 1 / (2 * Math.cos((2 * k - 1) * Math.PI / (2 * order))), sr));
    if (order % 2) out.push(D.biquad(type + '1', f, 0, sr));
    return out;
  };
  D.lowpass = function (x, sr, f, order) { return f >= sr * 0.4999 ? D.copy(x) : D.filter(x, D.butter('lowpass', f, order || 4, sr)); };
  D.highpass = function (x, sr, f, order) { return f <= 1 ? D.copy(x) : D.filter(x, D.butter('highpass', f, order || 4, sr)); };
  // Band limit (e.g. a phone line 300-3400 Hz): Butterworth high-pass at lo and low-pass at hi (order 4 each).
  D.bandCoefs = function (sr, lo, hi, order) {
    var cs = [];
    if (lo > 1) cs = cs.concat(D.butter('highpass', lo, order || 4, sr));
    if (hi < sr * 0.4999) cs = cs.concat(D.butter('lowpass', hi, order || 4, sr));
    return cs;
  };
  D.band = function (x, sr, lo, hi, order) {
    var cs = D.bandCoefs(sr, lo, hi, order);
    return cs.length ? D.filter(x, cs) : D.copy(x);
  };

  /* Spectral tilt: gain changes by dbPerOct per octave above `pivot` Hz (default 500), flat below it, so a negative
     tilt muffles (as through a wall or a mask) and a positive one thins the voice. Zero-phase, FFT domain. */
  D.tiltGain = function (f, dbPerOct, pivot) {
    pivot = pivot || 500;
    return f <= pivot ? 1 : Math.pow(10, dbPerOct * (Math.log(f / pivot) / Math.LN2) / 20);
  };
  D.tilt = function (x, sr, dbPerOct, pivot) {
    if (!dbPerOct) return D.copy(x);
    return D.fftFilter(x, sr, function (f) { return D.tiltGain(f, dbPerOct, pivot); }, null, 1024);
  };
})(typeof window !== 'undefined' ? window : globalThis);
