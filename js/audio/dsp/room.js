/* Earshot audio DSP: synthetic rooms (shoebox early reflections + decorrelated exponential tail), critical distance,
   air absorption, and a light head model (ITD + ILD) used when no PannerNode HRTF is available. Pure; MIT. */
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
  // Reverberation time per octave band re the nominal rt60 (mid frequencies): high frequencies decay faster.
  D.RT_BANDS = [[125, 1.15], [250, 1.08], [500, 1.0], [1000, 1.0], [2000, 0.9], [4000, 0.75], [8000, 0.6]];

  // Woodworth ITD (s) for azimuth (deg; front/back symmetric), head radius 8.75 cm.
  D.itd = function (azDeg) {
    var lat = Math.asin(Math.sin(azDeg * Math.PI / 180));
    return 0.0875 / C * (Math.abs(lat) + Math.sin(Math.abs(lat))) * (lat < 0 ? -1 : 1);
  };

  /* rir(sr, {rt60, size, seed, maxSec}) -> [L, R], each channel with unit energy (sum of squares = 1). The direct
     sound is NOT included (the renderer adds it through the spatialiser); sample 0 is the direct sound's arrival.
     Early part: image sources of a shoebox up to order 3 (listener and source at fixed canonical positions, 2 m
     apart), each with Woodworth ITD and a simple broadband ILD. Tail: independent noise per ear and octave band
     (2nd-order band-pass), each with its own exponential decay (RT_BANDS), faded in from the first reflection over
     the mixing time sqrt(V) ms, at a power that matches the reflections' power around the start of the tail. */
  D.rir = function (sr, o) {
    o = o || {};
    var rt60 = D.clamp(+o.rt60 || 0.5, 0.1, 12), dm = D.roomDims(o.size), rng = D.rng(o.seed == null ? 'room' : 'room:' + o.seed);
    var alpha = D.clamp(0.161 * dm.V / (dm.S * rt60), 0.01, 0.95), beta = Math.sqrt(1 - alpha);
    var maxRT = rt60 * D.RT_BANDS[0][1], len = Math.round(Math.min(o.maxSec || 4, maxRT * 1.0 + 0.1) * sr);
    var L = new Float32Array(len), R = new Float32Array(len);
    // canonical geometry: listener at 40 % length, 45 % width, 1.2 m; source 2 m ahead (+x), 0.3 m to the side.
    var lx = 0.4 * dm.l, ly = 0.45 * dm.w, lz = Math.min(1.2, dm.h * 0.45);
    var sxp = Math.min(lx + Math.min(2, 0.35 * dm.l), dm.l - 0.3), syp = ly + 0.3, szp = Math.min(1.6, dm.h * 0.6);
    var r0 = Math.hypot(sxp - lx, syp - ly, szp - lz), refl = [], ord = 3, tEarly = 0.1;
    for (var a = -ord; a <= ord; a++) for (var b = -ord; b <= ord; b++) for (var c = -ord; c <= ord; c++) {
      for (var p = 0; p < 8; p++) {
        var px = p & 1, py = (p >> 1) & 1, pz = (p >> 2) & 1;
        var n = Math.abs(a - px) + Math.abs(a) + Math.abs(b - py) + Math.abs(b) + Math.abs(c - pz) + Math.abs(c);
        if (n === 0 || n > ord) continue;
        var ix = (1 - 2 * px) * sxp + 2 * a * dm.l, iy = (1 - 2 * py) * syp + 2 * b * dm.w, iz = (1 - 2 * pz) * szp + 2 * c * dm.h;
        var dx = ix - lx, dy = iy - ly, dz = iz - lz, r = Math.sqrt(dx * dx + dy * dy + dz * dz), dt = (r - r0) / C;
        if (dt <= 0 || dt > tEarly) continue;
        var az = Math.atan2(-dy, dx) * 180 / Math.PI; // listener faces +x; +az to the right (-y)
        refl.push({ t: dt, g: Math.pow(beta, n) * r0 / r, az: az });
      }
    }
    var tFirst = Infinity, eEarly = 0, i, k;
    for (k = 0; k < refl.length; k++) {
      var f = refl[k], it = D.itd(f.az), ild = D.db2g(3 * Math.sin(f.az * Math.PI / 180)); // right ear louder for +az
      put(R, (f.t - Math.min(0, it)) * sr, f.g * ild); put(L, (f.t + Math.max(0, it)) * sr, f.g / ild);
      eEarly += f.g * f.g; if (f.t < tFirst) tFirst = f.t;
    }
    if (!isFinite(tFirst)) tFirst = 0.003;
    var tMix = D.clamp(Math.sqrt(dm.V) / 1000, 0.005, 0.12), tEnd = tFirst + tMix + 0.02;
    // reflection power per second over [tFirst, tEnd] sets the tail's starting power
    var eWin = 0; for (k = 0; k < refl.length; k++) if (refl[k].t <= tEnd) eWin += refl[k].g * refl[k].g;
    var p0 = eWin / Math.max(1e-3, tEnd - tFirst) / sr; // per-sample power at the tail's start
    var tail = [new Float32Array(len), new Float32Array(len)];
    for (var ch = 0; ch < 2; ch++) {
      var acc = tail[ch], crng = D.fork(rng, 'ch' + ch);
      for (var bnd = 0; bnd < D.RT_BANDS.length; bnd++) {
        var fc = D.RT_BANDS[bnd][0];
        if (fc > sr * 0.45) continue;
        var rtb = rt60 * D.RT_BANDS[bnd][1], decay = Math.exp(-6.9078 / (rtb * sr));
        var nz = D.white(len, D.fork(crng, 'b' + bnd));
        D.filterInPlace(nz, D.biquad('bandpass', fc, Math.SQRT2, sr));
        var env = 1, s0 = Math.floor(tFirst * sr);
        for (i = 0; i < len; i++) {
          if (i >= s0) acc[i] += nz[i] * env;
          env *= decay;
        }
      }
      var nm = Math.floor(tMix * sr), st = Math.floor(tFirst * sr);
      for (i = 0; i < st && i < len; i++) acc[i] = 0;
      for (i = 0; i < nm && st + i < len; i++) acc[st + i] *= 0.5 - 0.5 * Math.cos(Math.PI * (i + 0.5) / nm);
    }
    // scale the tail so its power at the start matches p0 (measured over the 20 ms after the fade-in)
    var a0 = Math.floor((tFirst + tMix) * sr), a1 = Math.min(len, a0 + Math.round(0.02 * sr));
    var pt = a1 > a0 ? D.meanSquare(tail, a0, a1) : 1, gt = pt > 0 ? Math.sqrt(p0 / pt) : 1;
    for (i = 0; i < len; i++) { L[i] += tail[0][i] * gt; R[i] += tail[1][i] * gt; }
    // unit energy per channel
    var eL = 0, eR = 0;
    for (i = 0; i < len; i++) { eL += L[i] * L[i]; eR += R[i] * R[i]; }
    D.scaleInPlace(L, 1 / Math.sqrt(eL || 1)); D.scaleInPlace(R, 1 / Math.sqrt(eR || 1));
    return [L, R];
    function put(arr, pos, g) { // fractional-delay impulse (linear split over two samples)
      var i0 = Math.floor(pos), fr = pos - i0;
      if (i0 >= 0 && i0 < arr.length) arr[i0] += g * (1 - fr);
      if (i0 + 1 >= 0 && i0 + 1 < arr.length) arr[i0 + 1] += g * fr;
    }
  };

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

  /* hrtfLite(x, sr, azDeg) -> [L, R]: Woodworth ITD (fractional delay on the far ear, 16-tap windowed sinc) and the
     Brown & Duda (1998) one-pole/one-zero spherical-head shadow per ear (alpha_min 0.1, theta_min 150 deg), plus a mild
     high-frequency cut for sources behind (no pinna model). */
  function shadow(sr, thetaDeg) {
    var a0 = 0.1, tmin = 150, alpha = (1 + a0 / 2) + (1 - a0 / 2) * Math.cos(thetaDeg / tmin * Math.PI);
    var w0 = C / 0.0875, K = 2 * sr; // H(s) = (1 + alpha s / 2w0) / (1 + s / 2w0), bilinear transform
    var nb0 = 1 + alpha * K / (2 * w0), nb1 = 1 - alpha * K / (2 * w0), na0 = 1 + K / (2 * w0), na1 = 1 - K / (2 * w0);
    return { b0: nb0 / na0, b1: nb1 / na0, b2: 0, a1: na1 / na0, a2: 0 };
  }
  function fracDelay(x, d) { // delay by d samples (d >= 0) with a 16-tap Blackman-windowed sinc
    var n = x.length, y = new Float32Array(n), di = Math.floor(d), fr = d - di, T = 8, h = new Float64Array(2 * T), i, k;
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
