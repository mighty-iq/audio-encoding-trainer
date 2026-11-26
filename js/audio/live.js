/* Earshot live scene (Seek): a looping bed, a looping target voice and decoys in real time; the listener moves and
   turns, and gains and directions follow smoothly (setTargetAtTime). Accepts the engine's TrialSpec `audio.live`:
   {bed:{kind, db, bed?, clips?}, target:{clip, x, y, db, gapMs}, decoys:[{clip, x, y, db, gapMs}], radius,
   headTurn, spatial?, refDist?, minDist?}. Positions are field units (-1..1; +x right, +y ahead/up), `radius` is the
   metres per field unit (default 10). A source's db holds at refDist (1 m) and falls 6 dB per doubling of distance;
   the bed's db is its RMS re a source at refDist with db 0; that reference plays at ES.audio.ctx.outDb (-20 dBFS).
   Heading: degrees clockwise from +y (0 = facing up/ahead, 90 = facing +x). MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var A = ES.audio = ES.audio || {};
  var D = A.dsp, P = A.prep, N = A.native;
  A.live = A.live || {};

  function setPos(p, x, y, z, t, tau) {
    if (p.positionX && p.positionX.setTargetAtTime) {
      p.positionX.setTargetAtTime(x, t, tau); p.positionY.setTargetAtTime(y, t, tau); p.positionZ.setTargetAtTime(z, t, tau);
    } else p.setPosition(x, y, z);
  }

  A.live.scene = function (cfg) {
    cfg = (cfg && cfg.audio && cfg.audio.live) || (cfg && cfg.live) || cfg || {};
    var radius = +cfg.radius > 0 ? +cfg.radius : 10, refDist = cfg.refDist || 1, minDist = cfg.minDist || 0.5;
    var spatial = cfg.spatial === 'hrtf' || cfg.spatial === 'ild' ? cfg.spatial : 'mono', tau = (cfg.smoothMs || 60) / 1000;
    var rng = D.rng(cfg.seed == null ? 'live' : cfg.seed), voices = [];
    if (cfg.target) voices.push({ spec: cfg.target, role: 'target' });
    (cfg.decoys || []).forEach(function (d) { if (d) voices.push({ spec: d, role: 'decoy' }); });
    var c = null, out = null, nodes = [], bedNode = null, started = false, stopped = false, pos = { x: 0, y: 0, h: 0 };

    function load() {
      var ids = voices.map(function (v) { return v.spec.clip; });
      if (cfg.bed) ids = ids.concat(P.bedClips(cfg.bed));
      ids = ids.filter(function (x, i, a) { return x && a.indexOf(x) === i; });
      return Promise.all(ids.map(function (id) {
        return Promise.all([A.assets.samples(id), A.assets.level(id)]).then(function (r) { return { id: id, x: r[0], lev: r[1] }; });
      })).then(function (list) { var m = {}; list.forEach(function (d) { m[d.id] = d; }); return m; });
    }
    function build(clipData) {
      var sr = A.assets.sampleRate(), REF = A.ctx.outDb;
      out = c.createGain(); out.gain.value = 0; out.connect(A.ctx.master());
      if (cfg.bed) { // bed: seamless loop (ssn and pink are periodic by construction; others are crossfaded)
        var b = cfg.bed, kind = b.kind || 'ssn', stereo = spatial !== 'mono', ch, n = 1 << 17;
        if (kind === 'ssn' || kind === 'pink') {
          ch = kind === 'ssn' ? D.ssn(n, sr, b.ltas || (ES.data && ES.data.ltas) || null, D.fork(rng, 'bed'), { stereo: stereo, loop: true })
            : D.pink(n, D.fork(rng, 'bed'), { stereo: stereo, loop: true });
          if (!stereo) ch = [ch];
        } else {
          var xf = Math.round(0.25 * sr);
          ch = P.makeBed(Object.assign({}, b, { fadeMs: 0 }), n + xf, sr, stereo, D.fork(rng, 'bed'), clipData, {}, function () {});
          ch = ch.map(function (x) { return D.makeLoop(x, xf); });
        }
        var ms = D.meanSquare(ch), k = ms > 0 ? D.db2g(REF + (+b.db || 0)) / Math.sqrt(ms) : 0;
        ch = ch.map(function (x) { return D.scale(x, k); });
        var bs = c.createBufferSource(); bs.buffer = N.makeBuffer(ch.length === 1 ? [ch[0], ch[0]] : ch, sr); bs.loop = true;
        bs.connect(out); bedNode = bs;
      }
      voices.forEach(function (v, i) {
        var d = clipData[v.spec.clip], gap = Math.round(((v.spec.gapMs == null ? 600 : +v.spec.gapMs) / 1000) * sr);
        var y = new Float32Array(d.x.length + Math.max(0, gap));
        y.set(D.scale(d.x, D.db2g(REF + (+v.spec.db || 0) - d.lev)));
        var src = c.createBufferSource(); src.buffer = N.makeBuffer([y], sr); src.loop = true;
        var g = c.createGain(); g.gain.value = 0;
        src.connect(g);
        var pan = null;
        if (spatial !== 'mono') {
          pan = c.createPanner(); pan.panningModel = spatial === 'hrtf' ? 'HRTF' : 'equalpower';
          pan.distanceModel = 'inverse'; pan.refDistance = 1; pan.rolloffFactor = 0;
          g.connect(pan); pan.connect(out);
        } else g.connect(out);
        nodes.push({ v: v, src: src, g: g, pan: pan, offset: D.fork(rng, 'v' + i).next() * y.length / sr, gain: 0, az: 0, dist: 0 });
      });
    }
    function update(t, immediate) {
      nodes.forEach(function (nd) {
        var dx = ((+nd.v.spec.x || 0) - pos.x) * radius, dy = ((+nd.v.spec.y || 0) - pos.y) * radius;
        var dist = Math.max(minDist, Math.sqrt(dx * dx + dy * dy)), g = Math.min(refDist / minDist, refDist / dist);
        var az = Math.atan2(dx, dy) * 180 / Math.PI - pos.h, r = az * Math.PI / 180;
        nd.gain = g; nd.az = ((az % 360) + 540) % 360 - 180; nd.dist = dist;
        if (immediate) nd.g.gain.setValueAtTime(g, t); else nd.g.gain.setTargetAtTime(g, t, tau);
        if (nd.pan) setPos(nd.pan, Math.sin(r), 0, -Math.cos(r), t, immediate ? 0.001 : tau);
      });
    }

    var h = {
      // Start (call from a user gesture or after ES.audio.ctx.unlock()). Resolves when sound is scheduled.
      start: function () {
        if (started) return h.ready;
        started = true;
        c = A.ctx.ensure();
        if (!c) { h.ready = Promise.reject(new Error('Web Audio is not available')); return h.ready; }
        h.ready = load().then(function (clipData) {
          if (stopped) return h;
          build(clipData);
          var t = c.currentTime + 0.05;
          update(t, true);
          if (bedNode) bedNode.start(t, D.fork(rng, 'bedoff').next() * bedNode.buffer.duration);
          nodes.forEach(function (nd) { nd.src.start(t, nd.offset); });
          out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(1, t + 0.3);
          return h;
        });
        return h.ready;
      },
      stop: function () {
        if (stopped) return;
        stopped = true;
        if (!c || !out) return;
        var t = c.currentTime;
        try { out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(0, t + 0.25); } catch (e) { /* ignore */ }
        var all = nodes.map(function (n) { return n.src; }).concat(bedNode ? [bedNode] : []);
        all.forEach(function (s) { try { s.stop(t + 0.3); } catch (e) { /* not started */ } });
        setTimeout(function () { try { out.disconnect(); } catch (e) { /* ignore */ } }, 400);
      },
      // Move the listener (field units) and turn the head (degrees clockwise from +y).
      listener: function (x, y, headingDeg) {
        pos.x = +x || 0; pos.y = +y || 0; pos.h = +headingDeg || 0;
        if (c && nodes.length) update(c.currentTime, false);
      },
      // Target level re the bed (dB) at a field position: db + 20 log10(refDist / dist) - bed db.
      snrAt: function (x, y) {
        if (!cfg.target) return null;
        var dx = ((+cfg.target.x || 0) - x) * radius, dy = ((+cfg.target.y || 0) - y) * radius;
        var dist = Math.max(minDist, Math.sqrt(dx * dx + dy * dy));
        return (+cfg.target.db || 0) + 20 * Math.log10(refDist / dist) - (cfg.bed ? +cfg.bed.db || 0 : -Infinity);
      },
      state: function () {
        return { started: started, stopped: stopped, listener: { x: pos.x, y: pos.y, h: pos.h }, spatial: spatial,
          voices: nodes.map(function (n) { return { role: n.v.role, clip: n.v.spec.clip, gainDb: 20 * Math.log10(n.gain || 1e-9), az: n.az, dist: n.dist }; }) };
      },
      ready: null
    };
    return h;
  };
})(typeof window !== 'undefined' ? window : globalThis);
