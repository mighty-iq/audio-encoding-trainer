/* Earshot audio context: one AudioContext, created and resumed inside a user gesture; master chain
   gain -> limiter -> destination. Rendering never needs this context (it uses OfflineAudioContexts). MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var A = ES.audio = ES.audio || {};
  A.RENDER_SR = A.RENDER_SR || 16000; // the packs' native rate; every trial renders at this rate

  var ctx = null, masterGain = null, limiter = null, volDb = 0, subs = [];
  function AC() { return root.AudioContext || root.webkitAudioContext || null; }
  function db2g(db) { return Math.pow(10, db / 20); }
  function emit() { for (var i = 0; i < subs.length; i++) { try { subs[i](ctx ? ctx.state : 'none'); } catch (e) { /* listener error */ } } }
  function session() {
    // iOS 17+: a 'playback' session keeps sound on when the ring/silent switch is set to silent.
    try { var s = root.navigator && root.navigator.audioSession; if (s && s.type !== 'playback') s.type = 'playback'; } catch (e) { /* not supported */ }
  }
  function build() {
    masterGain = ctx.createGain();
    masterGain.gain.value = db2g(volDb);
    // Safety limiter for anything that bypasses the offline renderer (live scenes, UI sounds). Threshold 0 dBFS keeps
    // the compressor's automatic make-up gain at 0 dB, so levels below full scale pass unchanged.
    limiter = ctx.createDynamicsCompressor();
    try {
      limiter.threshold.value = 0; limiter.knee.value = 0; limiter.ratio.value = 20;
      limiter.attack.value = 0.002; limiter.release.value = 0.2;
    } catch (e) { /* older engines */ }
    masterGain.connect(limiter);
    limiter.connect(ctx.destination);
  }
  function resume() {
    if (!ctx || ctx.state === 'running' || ctx.state === 'closed') return;
    try { var p = ctx.resume(); if (p && p.catch) p.catch(function () { /* needs a gesture */ }); } catch (e) { /* ignore */ }
  }

  A.ctx = {
    outDb: -20, // output active level of every rendered trial, dBFS (10 log10 mean square re 1.0)
    supported: function () { return !!AC(); },
    // Create (first call) or resume the context. Call inside a user gesture (tap/click/key) so browsers allow sound.
    ensure: function () {
      if (!ctx) {
        var C = AC();
        if (!C) return null;
        session();
        try { ctx = new C({ latencyHint: 'interactive' }); } catch (e) { try { ctx = new C(); } catch (e2) { return null; } }
        build();
        try { ctx.onstatechange = emit; } catch (e) { /* ignore */ }
      }
      resume();
      return ctx;
    },
    // Unlock audio inside a gesture: resume and play one silent sample (iOS). Resolves with the state when the
    // context runs, or with the current state after timeoutMs (default 1500); never rejects.
    unlock: function (timeoutMs) {
      var c = A.ctx.ensure();
      if (!c) return Promise.resolve('unsupported');
      try {
        var b = c.createBuffer(1, 1, c.sampleRate), s = c.createBufferSource();
        s.buffer = b; s.connect(c.destination); s.start(0);
      } catch (e) { /* ignore */ }
      return new Promise(function (res) {
        if (c.state === 'running') return res('running');
        var t0 = Date.now(), iv = setInterval(function () {
          if (c.state === 'running' || Date.now() - t0 > (timeoutMs || 1500)) { clearInterval(iv); res(c.state); }
        }, 30);
      });
    },
    sampleRate: function () { return ctx ? ctx.sampleRate : A.RENDER_SR; },
    master: function () { A.ctx.ensure(); return masterGain; },
    raw: function () { return ctx; },
    state: function () { return ctx ? ctx.state : 'none'; },
    now: function () { return ctx ? ctx.currentTime : 0; },
    // Master volume trim in dB (user setting); returns the current value.
    volume: function (db) {
      if (db != null && isFinite(db)) {
        volDb = Math.max(-60, Math.min(12, +db));
        if (masterGain) { try { masterGain.gain.setTargetAtTime(db2g(volDb), ctx.currentTime, 0.02); } catch (e) { masterGain.gain.value = db2g(volDb); } }
      }
      return volDb;
    },
    onState: function (fn) { if (typeof fn === 'function') subs.push(fn); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
