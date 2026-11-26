/* Earshot audio DSP: channel vocoder (noise or tone carriers), the classic cochlear-implant simulation. Pure; MIT. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var A = ES.audio = ES.audio || {};
  var D = A.dsp = A.dsp || {};

  // Log-spaced band edges (Hz): bands+1 values from lo to hi.
  D.vocoderEdges = function (bands, lo, hi) {
    var e = [];
    for (var k = 0; k <= bands; k++) e.push(lo * Math.pow(hi / lo, k / bands));
    return e;
  };
  // Analysis filter of one band: 4th-order Butterworth high-pass at fl and low-pass at fh (24 dB/oct each side).
  D.vocoderBand = function (sr, fl, fh) { return D.butter('highpass', fl, 4, sr).concat(D.butter('lowpass', fh, 4, sr)); };

  /* vocode(x, sr, {bands 2..32 (default 8), lo 100, hi 7500, carrier 'noise'|'tone', envHz 50}, rng)
     Each band: band-pass analysis, envelope = full-wave rectification low-passed at envHz (2 x 2nd order),
     carrier = band-passed noise (same filter) or a sine at the band's geometric centre (random phase),
     product scaled so the band's output energy equals the input band's energy (band energies follow the input).
     envHz default 50 Hz: periodicity cues above ~50 Hz removed, as in the learning studies (R2 section 1.1). */
  D.vocode = function (x, sr, o, rng) {
    o = o || {};
    rng = rng || D.rng('vocode');
    var nb = D.clamp(Math.round(o.bands || 8), 1, 32), lo = o.lo || 100, hi = Math.min(o.hi || 7500, sr * 0.47);
    var carrier = o.carrier === 'tone' || o.carrier === 'sine' ? 'tone' : 'noise', envHz = o.envHz || 50;
    var n = x.length, out = new Float32Array(n), edges = D.vocoderEdges(nb, lo, hi);
    var envF = D.butter('lowpass', envHz, 4, sr), b, i;
    for (b = 0; b < nb; b++) {
      var fl = edges[b], fh = edges[b + 1], an = D.vocoderBand(sr, fl, fh);
      var xb = D.filter(x, an), eIn = 0;
      for (i = 0; i < n; i++) eIn += xb[i] * xb[i];
      if (eIn <= 1e-20) continue;
      var env = xb; // reuse: rectify in place, then smooth
      for (i = 0; i < n; i++) env[i] = env[i] < 0 ? -env[i] : env[i];
      D.filterInPlace(env, envF);
      var car;
      if (carrier === 'noise') car = D.filterInPlace(D.white(n, D.fork(rng, 'band' + b)), an);
      else {
        car = new Float32Array(n);
        var fc = Math.sqrt(fl * fh), ph = 2 * Math.PI * D.fork(rng, 'band' + b).next(), dph = 2 * Math.PI * fc / sr;
        for (i = 0; i < n; i++) car[i] = Math.sin(ph + dph * i);
      }
      var eOut = 0;
      for (i = 0; i < n; i++) { var v = (env[i] > 0 ? env[i] : 0) * car[i]; car[i] = v; eOut += v * v; }
      if (eOut <= 1e-20) continue;
      var g = Math.sqrt(eIn / eOut);
      for (i = 0; i < n; i++) out[i] += g * car[i];
    }
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
