/* Earshot audio DSP: room geometry, critical distance, Schroeder decay, air absorption, and a light head model
   (ITD + ILD) used when no PannerNode HRTF is available. Room responses: dsp/reverb.js. Pure; MIT. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var A = ES.audio = ES.audio || {};
  var D = A.dsp = A.dsp || {};
  var C = 343; // speed of sound, m/s

  /* Room geometry from `size` (CONTRACTS §12 R1): a word 'small' | 'medium' | 'large' | 'hall' (length x width x
     height in m: 5 x 4 x 2.7, 10 x 7 x 3.2, 22 x 15 x 6, 38 x 24 x 12), or a number = length in m (width 0.7 x
     length; height 3 m below 12 m length, else 0.3 x length). Also accepted: [w, d] (height as for a number of the
     larger side) and [l, w, h]. Returns {l, w, h, V, S}. */
  D.ROOM_SIZES = { small: [5, 4, 2.7], medium: [10, 7, 3.2], large: [22, 15, 6], hall: [38, 24, 12] };
  function hOf(l) { return l < 12 ? 3 : 0.3 * l; }
  D.roomDims = function (size) {
    var l, w, h;
    if (typeof size === 'string') size = D.ROOM_SIZES[size] || (isFinite(+size) ? +size : D.ROOM_SIZES.medium);
    if (size && size.length === 3) { l = +size[0]; w = +size[1]; h = +size[2]; }
    else if (size && size.length === 2) { w = D.clamp(+size[0] || 6, 1.5, 300); l = D.clamp(+size[1] || 8, 1.5, 300); h = hOf(Math.max(l, w)); }
    else { l = D.clamp(+size || 10, 2, 300); w = 0.7 * l; h = hOf(l); }
    return { l: l, w: w, h: h, V: l * w * h, S: 2 * (l * w + l * h + w * h) };
  };
  // Critical distance (m), where direct and reverberant energy are equal: 0.057 * sqrt(Q V / RT60), Q = 2 (a talker
  // facing the listener).
  D.critDist = function (rt60, size, Q) {
    var d = D.roomDims(size);
    return 0.057 * Math.sqrt((Q || 2) * d.V / Math.max(0.05, rt60));
  };

  // Woodworth ITD (s) for azimuth (deg; front/back symmetric), head radius 8.75 cm.
  D.itd = function (azDeg) {
    var lat = Math.asin(Math.sin(azDeg * Math.PI / 180));
    return 0.0875 / C * (Math.abs(lat) + Math.sin(Math.abs(lat))) * (lat < 0 ? -1 : 1);
  };

  // D.rir, D.roomModel and D.reverb live in dsp/reverb.js (loaded after this file).

  // Schroeder backward integration -> reverberation time (s) from the decay between -5 and -25 dB (T20 x 3).
  D.schroederRT = function (ir, sr, fromDb, toDb) {
    fromDb = fromDb == null ? -5 : fromDb; toDb = toDb == null ? -25 : toDb;
    var n = ir.length, edc = new Float64Array(n), s = 0, i;
    for (i = n - 1; i >= 0; i--) { s += ir[i] * ir[i]; edc[i] = s; }
    var tot = edc[0], xs = [], ys = [];
    for (i = 0; i < n; i++) {
      var db = 10 * Math.log10(edc[i] / tot + 1e-30);
      if (db <= fromDb && db >= toDb) { xs.push(i / sr); ys.push(db); }
      if (db < toDb) break;
    }
    if (xs.length < 2) return 0;
    var mx = 0, my = 0; for (i = 0; i < xs.length; i++) { mx += xs[i]; my += ys[i]; }
    mx /= xs.length; my /= xs.length;
    var sxy = 0, sxx = 0; for (i = 0; i < xs.length; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); }
    var slope = sxy / sxx; // dB per second
    return slope < 0 ? -60 / slope : 0;
  };

  /* Air absorption of the direct sound: about 4 dB per 100 m at 4 kHz, growing roughly with f^1.7 (R3 section 10);
     applied as one high-shelf whose cut equals the loss at 6 kHz. Returns null below 10 m (negligible). */
  D.airLossDb = function (f, dist) { return 0.04 * Math.pow(f / 4000, 1.7) * dist; };
  D.airCoefs = function (dist, sr) {
    if (!(dist > 10)) return null;
    return D.biquad('highshelf', 3000, 0.7071, sr, -D.airLossDb(6000, dist));
  };

  /* hrtfLite(x, sr, azDeg) -> [L, R]: Woodworth ITD (fractional delay on the far ear, 8-tap windowed sinc) and the
     Brown & Duda (1998) one-pole/one-zero spherical-head shadow per ear (alpha_min 0.1, theta_min 150 deg), plus a mild
     high-frequency cut for sources behind (no pinna model). */
  function shadow(sr, thetaDeg) {
    var a0 = 0.1, tmin = 150, alpha = (1 + a0 / 2) + (1 - a0 / 2) * Math.cos(thetaDeg / tmin * Math.PI);
    var w0 = C / 0.0875, K = 2 * sr; // H(s) = (1 + alpha s / 2w0) / (1 + s / 2w0), bilinear transform
    var nb0 = 1 + alpha * K / (2 * w0), nb1 = 1 - alpha * K / (2 * w0), na0 = 1 + K / (2 * w0), na1 = 1 - K / (2 * w0);
    return { b0: nb0 / na0, b1: nb1 / na0, b2: 0, a1: na1 / na0, a2: 0 };
  }
  function fracDelay(x, d) { // delay by d samples (d >= 0) with an 8-tap Blackman-windowed sinc
    var n = x.length, y = new Float32Array(n), di = Math.floor(d), fr = d - di, T = 4, h = new Float64Array(2 * T), i, k;
    for (k = 0; k < 2 * T; k++) {
      var u = k - T + 1 - fr, s = Math.abs(u) < 1e-9 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u);
      var wv = 0.42 + 0.5 * Math.cos(Math.PI * u / T) + 0.08 * Math.cos(2 * Math.PI * u / T);
      h[k] = s * (Math.abs(u) < T ? wv : 0);
    }
    for (i = 0; i < n; i++) {
      var acc = 0;
      for (k = 0; k < 2 * T; k++) { var j = i - di - (k - T + 1); if (j >= 0 && j < n) acc += h[k] * x[j]; }
      y[i] = acc;
    }
    return y;
  }
  D.hrtfLite = function (x, sr, azDeg) {
    var az = ((+azDeg || 0) % 360 + 540) % 360 - 180, rad = az * Math.PI / 180;
    // angle between the source direction and each ear's axis (right ear at +90 deg, left at -90 deg)
    var thR = Math.acos(D.clamp(Math.sin(rad), -1, 1)) * 180 / Math.PI, thL = 180 - thR;
    var l = D.filter(x, shadow(sr, thL)), r = D.filter(x, shadow(sr, thR));
    var back = Math.cos(rad) < 0 ? -Math.cos(rad) : 0;
    if (back > 0.05) { var hs = D.biquad('highshelf', 2500, 0.7071, sr, -4 * back); D.filterInPlace(l, hs); D.filterInPlace(r, hs); }
    var itd = D.itd(az) * sr; // > 0: source on the right, so the left ear is late
    if (Math.abs(itd) > 0.01) { if (itd > 0) l = fracDelay(l, itd); else r = fracDelay(r, -itd); }
    return [l, r];
  };
})(typeof window !== 'undefined' ? window : globalThis);
