/* Earshot render preparation: fx chains on clips, beds (speech-shaped noise, babble, ambience, pink), room parameters
   and cached room responses. Pure JS on Float32Arrays; used by render.js and live.js. MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var A = ES.audio = ES.audio || {};
  var D = A.dsp;
  var P = A.prep = A.prep || {};

  P.REF = -20; // working level (dB) of every calibrated source before the final normalisation

  // Stable labels role:clip#k, so a part's random stream does not depend on its position in the list
  // (a "target alone" replay processes the target exactly as in the mix).
  P.labels = function (items, keyFn) {
    var seen = {};
    return items.map(function (it) { var k = keyFn(it); seen[k] = (seen[k] || 0) + 1; return k + '#' + seen[k]; });
  };

  // ---- fx chains ----
  var fxCache = [], FX_CACHE = 8;
  P.fxTypes = ['wsola', 'resample', 'vocode', 'whisper', 'band', 'tilt', 'gate', 'mask', 'lowpass', 'highpass'];
  P.applyFx = function (x, sr, fx, rng, warn, key) {
    if (!fx || !fx.length) return x;
    if (key) for (var c = 0; c < fxCache.length; c++) if (fxCache[c].key === key) return fxCache[c].y;
    var y = x;
    for (var i = 0; i < fx.length; i++) {
      var f = fx[i] || {}, r = D.fork(rng, 'fx' + i + ':' + f.type);
      switch (f.type) {
        case 'wsola': { // rate = speed factor (CONTRACTS §12 R2): 2 = twice as fast; valid 0.67-3
          var speed = f.rate != null ? +f.rate : f.speed != null ? +f.speed : 1;
          if (!(speed >= 0.67 && speed <= 3)) warn('wsola rate ' + speed + ' outside 0.67-3 (rate = speed factor); clamped');
          y = D.wsola(y, sr, D.clamp(speed || 1, 0.67, 3)); break;
        }
        case 'resample': y = D.resample(y, D.clamp(+f.ratio || 1, 0.5, 2)); break;
        case 'vocode': y = D.vocode(y, sr, f, r); break;
        case 'whisper': y = D.whisper(y, sr, f, r); break;
        case 'band': y = D.band(y, sr, f.lo || 0, f.hi || sr / 2, f.order); break;
        case 'tilt': y = D.tilt(y, sr, f.db != null ? f.db : f.dbPerOct || 0, f.pivot); break;
        case 'gate': y = D.gate(y, sr, f, r); break;
        case 'mask': // one lost stretch [t0, t1] s: noise at db re the part's active level, or silence; 10 ms ramps
          y = D.gate(y, sr, { gaps: [[+f.t0 || 0, +f.t1 || 0]], fill: f.fill === 'silence' ? 'silence' : 'noise',
            fillDb: f.db == null ? 0 : +f.db, rampMs: f.rampMs == null ? 10 : f.rampMs }, r);
          break;
        case 'lowpass': y = D.lowpass(y, sr, f.f || f.hz || 4000, f.order); break;
        case 'highpass': y = D.highpass(y, sr, f.f || f.hz || 100, f.order); break;
        default: warn('unknown fx type ' + f.type + ' (ignored)');
      }
    }
    if (key) { fxCache.unshift({ key: key, y: y }); if (fxCache.length > FX_CACHE) fxCache.pop(); }
    return y;
  };

  /* ---- rooms ----
     room: {rt60 (s, mid frequencies), dist (m), size ('small'|'medium'|'large'|'hall' or a length in m; see
     ES.audio.dsp.roomDims), seed,
     levels: 'ear' (default: every db is as received at the ear, the room only shapes DRR and colour) | 'source'
     (part db at 1 m from the talker; the direct sound falls 6 dB per doubling of distance, so distance also costs
     level against beds), ir: clipId | [idL, idR] (a measured response; its direct sound is cut and re-added)} */
  P.roomInfo = function (room) {
    if (!room) return null;
    var rt60 = D.clamp(+room.rt60 || 0.5, 0.1, 12), size = room.size == null ? 'medium' : room.size, seed = room.seed == null ? 1 : room.seed;
    var ir = room.ir ? [].concat(room.ir) : null;
    return {
      rt60: rt60, size: size, seed: seed, dims: D.roomDims(size), dc: D.critDist(rt60, size), ir: ir, rtGiven: room.rt60 != null,
      levels: room.levels === 'source' ? 'source' : 'ear',
      dist: room.dist == null ? 2 : Math.max(0.1, +room.dist), key: rt60 + '|' + JSON.stringify(size) + '|' + seed + '|' + (ir ? ir.join(',') : '')
    };
  };
  /* Room model for the renderer (see dsp/reverb.js), cached by room and rate. A measured response (room.ir) becomes a
     model without separate early taps: its direct sound (up to 2.5 ms after the peak) is cut, the rest is the room
     sound at half rate; one clip serves both ears. */
  var modelCache = [], MODEL_CACHE = 6;
  P.measuredModel = function (chs, sr) {
    var ir = chs.map(function (x) {
      var pk = 0, pi = 0, i;
      for (i = 0; i < x.length; i++) { var v = Math.abs(x[i]); if (v > pk) { pk = v; pi = i; } }
      var cut = pi + Math.round(0.0025 * sr), fd = Math.max(1, Math.round(0.001 * sr)), y = new Float32Array(Math.max(2, x.length - pi));
      for (i = cut; i < x.length; i++) y[i - pi] = x[i] * (i - cut < fd ? (i - cut + 0.5) / fd : 1);
      return y;
    });
    if (ir.length === 1) ir = [ir[0], ir[0]];
    var model = { sr: sr, len: ir[0].length, early: [], tail: [D.decimate2(ir[0]), D.decimate2(ir[1])], G: {}, measured: true };
    var comp = D.composeRir(model);
    for (var ch = 0; ch < 2; ch++) D.scaleInPlace(model.tail[ch], 1 / Math.sqrt(D.energy(comp[ch]) || 1));
    model.rt60 = D.clamp(D.schroederRT(D.composeRir(model)[0], sr) || 0.5, 0.1, 12);
    return model;
  };
  P.roomModel = function (info, sr, clipData) {
    var key = info.key + '|' + sr, hit = null;
    for (var m = 0; m < modelCache.length; m++) if (modelCache[m].key === key) { hit = modelCache.splice(m, 1)[0]; modelCache.unshift(hit); break; }
    if (!hit) {
      var model = null;
      if (info.ir && clipData) {
        var have = info.ir.filter(function (id) { return clipData[id]; });
        if (have.length) model = P.measuredModel(have.map(function (id) { return clipData[id].x; }), sr);
      }
      if (!model) model = D.roomModel(sr, { rt60: info.rt60, size: info.size, seed: info.seed });
      hit = { key: key, model: model };
      modelCache.unshift(hit);
      if (modelCache.length > MODEL_CACHE) modelCache.pop();
    }
    if (hit.model.measured && !info.rtGiven) { info.rt60 = hit.model.rt60; info.dc = D.critDist(info.rt60, info.size); }
    return hit.model;
  };

  // ---- beds ----
  /* clipData: {id: {x: Float32Array, lev: dB}}; extra: {targetLtas, partsLtas}; model: a room model when the bed is in
     the room. Returns channels ([m] or [L, R]). In a room, stationary noise (ssn, pink) is the same noise coloured
     by the room's long-term spectrum (no convolution needed); babble and ambience are reverberated (mono in). */
  P.makeBed = function (bed, n, sr, stereo, rng, clipData, extra, warn, model) {
    var kind = bed.kind || 'ssn', ch;
    if (kind === 'ssn' || kind === 'pink') {
      var ltas = kind === 'pink' ? D.LTAS_PINK : bed.ltas || (bed.from === 'target' && extra.targetLtas) ||
        (bed.from === 'parts' && extra.partsLtas) || (ES.data && ES.data.ltas) || null;
      if (model) ltas = D.ltasSum(ltas || D.LTAS_DEFAULT, D.roomColour(model));
      ch = kind === 'pink' && !model ? D.pink(n, rng, { stereo: stereo }) : D.ssn(n, sr, ltas, rng, { stereo: stereo });
      if (!stereo) ch = [ch];
    } else if (model) {
      var dry = P.makeBed(bed, n, sr, false, rng, clipData, extra, warn, null)[0], w = D.reverb(dry, model);
      ch = stereo ? [w[0].subarray(0, n).slice(), w[1].subarray(0, n).slice()] : [w[0].subarray(0, n).slice()];
    } else if (kind === 'babble') {
      ch = babble(bed, n, sr, stereo, rng, clipData, warn);
    } else if (kind === 'ambience') {
      ch = ambience(bed, n, sr, stereo, rng, clipData, warn);
    } else {
      warn('unknown bed kind ' + kind + '; speech-shaped noise used');
      ch = D.ssn(n, sr, null, rng, { stereo: stereo }); if (!stereo) ch = [ch];
    }
    var fade = Math.round((bed.fadeMs == null ? 50 : bed.fadeMs) * sr / 1000);
    for (var c = 0; c < ch.length; c++) D.fade(ch[c], fade, fade);
    return ch;
  };
  P.bedClips = function (bed) {
    if (bed.kind === 'babble') return (bed.clips || []).slice();
    if (bed.kind === 'ambience') return [bed.bed || (bed.clips && bed.clips[0])].filter(Boolean);
    return [];
  };
  /* Babble: N talkers, each at equal active level, looped from a random offset to the bed's length (20 ms crossfades).
     Stereo: each talker gets an azimuth spread around the listener (seeded), as an integer-sample ITD and a broadband
     ILD up to 4 dB, which makes a diffuse crowd at almost no cost. */
  function babble(bed, n, sr, stereo, rng, clipData, warn) {
    var ids = P.bedClips(bed).filter(function (id) { if (clipData[id]) return true; warn('babble clip missing: ' + id); return false; });
    var L = new Float32Array(n), R = stereo ? new Float32Array(n) : null, N = ids.length;
    if (!N) { warn('babble bed without clips; speech-shaped noise used'); var s = D.ssn(n, sr, null, rng, { stereo: stereo }); return stereo ? s : [s]; }
    var azs = [];
    for (var k = 0; k < N; k++) azs.push(-180 + 360 * (k + 0.5) / N + (rng.next() - 0.5) * 20);
    rng.shuffle ? rng.shuffle(azs) : null;
    for (k = 0; k < N; k++) {
      var d = clipData[ids[k]], g = D.db2g(-d.lev), off = Math.floor(rng.next() * d.x.length);
      var y = D.loopTo(d.x, n, off, Math.round(0.02 * sr));
      if (!stereo) { D.addInto(L, y, 0, g); continue; }
      var az = azs[k], itd = Math.round(D.itd(az) * sr), ild = D.db2g(4 * Math.sin(az * Math.PI / 180));
      D.addInto(R, y, Math.max(0, -itd), g * ild);
      D.addInto(L, y, Math.max(0, itd), g / ild);
    }
    return stereo ? [L, R] : [L];
  }
  // Ambience: a named bed clip looped from a random offset (50 ms crossfades); stereo uses a second offset half a
  // clip away for the right ear (decorrelated).
  function ambience(bed, n, sr, stereo, rng, clipData, warn) {
    var id = P.bedClips(bed)[0], d = id && clipData[id];
    if (!d) { warn('ambience clip missing: ' + id + '; pink noise used'); var s = D.pink(n, rng, { stereo: stereo }); return stereo ? s : [s]; }
    var m = d.x.length, off = Math.floor(rng.next() * m), xf = Math.round(0.05 * sr);
    var L = D.loopTo(d.x, n, off, xf);
    if (!stereo) return [L];
    return [L, D.loopTo(d.x, n, (off + (m >> 1)) % m, xf)];
  }

  // Mono version of a channel list (mean).
  P.mono = function (ch) {
    if (ch.length === 1) return ch[0];
    var n = ch[0].length, y = new Float32Array(n);
    for (var c = 0; c < ch.length; c++) for (var i = 0; i < n; i++) y[i] += ch[c][i] / ch.length;
    return y;
  };
})(typeof window !== 'undefined' ? window : globalThis);
