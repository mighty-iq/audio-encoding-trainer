/* ES.ui.sound — the shell's tiny player (demo trials, the volume reference). It shares the audio engine's
   context when ES.audio is present, else owns one. Without working sound it waits out the duration, so a
   session can still be walked through (the result says silent:true). Call unlock() inside a tap. */
(function (ES, win) {
  'use strict';
  var U = ES.core.util;
  var own = null, lastSilent = false;

  function engineCtx() {
    var A = ES.audio && ES.audio.ctx;
    if (!A || typeof A.ensure !== 'function') return null;
    try {
      var c = A.ensure();
      if (c && typeof c.createBufferSource === 'function') return c;
      if (typeof A.get === 'function') { c = A.get(); if (c && typeof c.createBufferSource === 'function') return c; }
    } catch (e) { /* fall back to our own */ }
    return null;
  }
  function ctx() {
    var c = engineCtx();
    if (c) return c;
    if (!own) {
      var AC = win.AudioContext || win.webkitAudioContext;
      if (!AC) return null;
      try { own = new AC(); } catch (e) { own = null; }
    }
    return own;
  }
  function dest(c) {
    var A = ES.audio && ES.audio.ctx;
    if (c !== own && A && typeof A.master === 'function') {
      try { var m = A.master(); if (m && typeof m.connect === 'function') return m; } catch (e) { /* ignore */ }
    }
    return c.destination;
  }
  /** Inside a user gesture: create/resume the context and play one silent sample (iOS). → Promise<bool running> */
  function unlock() {
    var c = ctx();
    if (!c) return Promise.resolve(false);
    try { if (ES.audio && ES.audio.ctx && typeof ES.audio.ctx.unlock === 'function') ES.audio.ctx.unlock(); } catch (e) { /* ignore */ }
    try { if (c.state !== 'running' && c.resume) c.resume(); } catch (e) { /* ignore */ }
    try {
      var b = c.createBuffer(1, 1, c.sampleRate || 44100), s = c.createBufferSource();
      s.buffer = b; s.connect(c.destination); s.start(0);
    } catch (e) { /* ignore */ }
    return new Promise(function (res) { setTimeout(function () { res(c.state === 'running'); }, 60); });
  }
  function toBuffer(c, pcm) {
    if (pcm && typeof pcm.getChannelData === 'function') return pcm;
    var n = pcm.L.length, b = c.createBuffer(2, Math.max(1, n), pcm.sr);
    b.getChannelData(0).set(pcm.L);
    b.getChannelData(1).set(pcm.R || pcm.L);
    return b;
  }
  function durOf(pcm) { return pcm && typeof pcm.duration === 'number' ? pcm.duration : pcm && pcm.L ? pcm.L.length / pcm.sr : 0; }
  /** Play once. pcm = {L, R, sr} or an AudioBuffer. → { stop(), ended: Promise<{silent}>, silent, dur } */
  function play(pcm, opts) {
    opts = opts || {};
    var dur = durOf(pcm), c = ctx(), timer = null, src = null, finished = false, resolveEnd;
    var ended = new Promise(function (r) { resolveEnd = r; });
    function finish(silent) { if (finished) return; finished = true; if (timer) clearTimeout(timer); resolveEnd({ silent: silent }); }
    var silent = !c;
    if (c && c.state !== 'running') { try { c.resume(); } catch (e) { /* ignore */ } silent = c.state !== 'running'; }
    if (!silent) {
      try {
        src = c.createBufferSource();
        src.buffer = toBuffer(c, pcm);
        var g = c.createGain();
        g.gain.value = typeof opts.gain === 'number' ? opts.gain : 1;
        src.connect(g); g.connect(dest(c));
        src.onended = function () { finish(false); };
        src.start();
      } catch (e) { silent = true; src = null; }
    }
    lastSilent = silent;
    // Safety net: a suspended or broken context never ends a trial on its own.
    timer = setTimeout(function () { finish(silent); }, Math.round(dur * 1000) + (silent ? 0 : 1500));
    return {
      silent: silent, dur: dur, ended: ended,
      stop: function () { try { if (src) src.stop(); } catch (e) { /* ignore */ } finish(silent); }
    };
  }
  function info() {
    var A = ES.audio && ES.audio.ctx, c = own || (A && typeof A.raw === 'function' ? safe(A.raw) : A && typeof A.get === 'function' ? safe(A.get) : null);
    if (!c) return null;
    return { sampleRate: c.sampleRate, baseMs: U.round((c.baseLatency || 0) * 1000, 1), outMs: U.round((c.outputLatency || 0) * 1000, 1),
      state: c.state, engine: c === own ? 'shell' : 'audio engine', silent: lastSilent };
  }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

  /** Pink noise (Kellet filter), rms dBFS, 30 ms fades: the volume reference. Seeded. */
  function pink(seconds, sr, rmsDb, rng) {
    var n = Math.round(seconds * sr), x = new Float32Array(n), b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, i;
    for (i = 0; i < n; i++) {
      var w = rng.next() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856; b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
      x[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362; b6 = w * 0.115926;
    }
    var s = 0;
    for (i = 0; i < n; i++) s += x[i] * x[i];
    var g = Math.pow(10, rmsDb / 20) / Math.sqrt(s / n || 1), f = Math.round(0.03 * sr);
    for (i = 0; i < n; i++) {
      var e = i < f ? i / f : i > n - f ? (n - i) / f : 1;
      x[i] *= g * e;
    }
    return { L: x, R: x, sr: sr, duration: n / sr };
  }

  ES.ui.sound = { ctx: ctx, unlock: unlock, play: play, info: info, pink: pink, available: function () { return !!ctx(); } };
})(window.ES, window);
