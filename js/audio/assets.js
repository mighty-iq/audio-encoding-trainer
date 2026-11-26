/* Earshot audio assets: lazy decode of base64 clips from ES.packs into 16 kHz AudioBuffers, LRU cache (<= 60 s of
   audio), measured active levels. Decoding uses an OfflineAudioContext, so it needs no user gesture. MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var A = ES.audio = ES.audio || {};
  var D = A.dsp;

  var LIMIT_SEC = 60, cache = {}, total = 0, tick = 0, dctx = null;

  function OAC() { return root.OfflineAudioContext || root.webkitOfflineAudioContext || null; }
  // One decoding context at the render rate. If an engine refuses 16 kHz, fall back to 48/44.1 kHz and render there.
  function decodeCtx() {
    if (dctx) return dctx;
    var O = OAC(), rates = [A.RENDER_SR, 48000, 44100];
    if (O) for (var i = 0; i < rates.length && !dctx; i++) { try { dctx = new O(1, 1, rates[i]); } catch (e) { dctx = null; } }
    if (!dctx && A.ctx) dctx = A.ctx.ensure();
    if (!dctx) throw new Error('Web Audio is not available');
    if (dctx.sampleRate !== A.RENDER_SR) A.RENDER_SR = dctx.sampleRate;
    return dctx;
  }
  function b64ToArrayBuffer(s) {
    var bin = root.atob(s), n = bin.length, u = new Uint8Array(n);
    for (var i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
    return u.buffer;
  }
  // decodeAudioData in both forms (promise and the older callback form, e.g. old Safari).
  function decode(ab) {
    var c = decodeCtx();
    return new Promise(function (res, rej) {
      var done = false;
      function ok(b) { if (!done) { done = true; res(b); } }
      function bad(e) { if (!done) { done = true; rej(e instanceof Error ? e : new Error('decode failed')); } }
      try { var p = c.decodeAudioData(ab, ok, bad); if (p && typeof p.then === 'function') p.then(ok, bad); } catch (e) { bad(e); }
    });
  }
  function manifest() { return ES.data && ES.data.manifest && ES.data.manifest.clips ? ES.data.manifest.clips : {}; }
  function raw(id) {
    var m = manifest()[id], P = ES.packs || {};
    if (m && m.pack && P[m.pack] && P[m.pack][id]) return P[m.pack][id];
    for (var k in P) if (Object.prototype.hasOwnProperty.call(P, k) && P[k] && P[k][id]) return P[k][id];
    return null;
  }
  function evict() {
    if (total <= LIMIT_SEC) return;
    var ids = Object.keys(cache).filter(function (id) { return cache[id].buf && !cache[id].pin; });
    ids.sort(function (a, b) { return cache[a].t - cache[b].t; });
    for (var i = 0; i < ids.length && total > LIMIT_SEC; i++) { total -= cache[ids[i]].sec; delete cache[ids[i]]; }
  }
  function entry(id) {
    var e = cache[id];
    if (e) { e.t = ++tick; return e; }
    var d = raw(id);
    if (!d) return null;
    e = cache[id] = { t: ++tick, sec: 0, buf: null, adb: null, pin: false, p: null };
    e.p = decode(b64ToArrayBuffer(d)).then(function (b) {
      if (cache[id] !== e) return b; // released while decoding
      e.buf = b; e.sec = b.duration; total += e.sec; evict();
      return b;
    }, function (err) { if (cache[id] === e) delete cache[id]; throw new Error('cannot decode clip ' + id + ': ' + (err && err.message || err)); });
    return e;
  }

  A.assets = {
    limitSec: LIMIT_SEC,
    sampleRate: function () { decodeCtx(); return A.RENDER_SR; },
    has: function (id) { return !!cache[id] || !!raw(id); },
    meta: function (id) { return manifest()[id] || null; },
    // Promise<AudioBuffer> (mono, at the render rate).
    buffer: function (id) {
      var e = entry(id);
      return e ? e.p : Promise.reject(new Error('missing clip ' + id));
    },
    // Promise<Float32Array> (channel 0, shared with the cache: never modify it in place).
    samples: function (id) { return A.assets.buffer(id).then(function (b) { return b.getChannelData(0); }); },
    // Promise<number>: active level (dB, P.56-style) measured on the decoded clip, cached; manifest adb as fallback.
    level: function (id) {
      return A.assets.buffer(id).then(function (b) {
        var e = cache[id];
        if (e && e.adb != null) return e.adb;
        var lev = D.activeDb(b.getChannelData(0), b.sampleRate, { tail: D.SOURCE_TAIL }), m = manifest()[id];
        if (!(lev > D.FLOOR_DB + 1) && m && isFinite(m.adb)) lev = m.adb;
        if (e) e.adb = lev;
        return lev;
      });
    },
    // Decode ahead (e.g. during the previous trial's feedback). Resolves with {ok:[ids], failed:[{id, error}]}.
    preload: function (ids) {
      ids = (ids || []).filter(function (x, i, a) { return x && a.indexOf(x) === i; });
      var ok = [], failed = [];
      return Promise.all(ids.map(function (id) {
        return A.assets.level(id).then(function () { ok.push(id); }, function (e) { failed.push({ id: id, error: String(e && e.message || e) }); });
      })).then(function () { return { ok: ok, failed: failed }; });
    },
    release: function (ids) {
      (ids || []).forEach(function (id) { var e = cache[id]; if (e) { if (e.buf) total -= e.sec; delete cache[id]; } });
    },
    pin: function (ids, on) { (ids || []).forEach(function (id) { if (cache[id]) cache[id].pin = on !== false; }); },
    stats: function () { return { seconds: Math.round(total * 100) / 100, clips: Object.keys(cache).length, limitSec: LIMIT_SEC }; },
    setLimit: function (sec) { if (sec > 0) { LIMIT_SEC = sec; A.assets.limitSec = sec; evict(); } return LIMIT_SEC; },
    clear: function () { cache = {}; total = 0; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
