/* Earshot native render pass: HRTF panning (PannerNode) in one OfflineAudioContext, each job written to its own
   pair of output channels (a stem), plus AudioBuffer helpers. Rooms render in JS (dsp/reverb.js): Chrome's
   ConvolverNode took 40-70 ms for four 3 s stems. A 'conv' job ({type:'conv', input, at, ir:[L, R]}) is kept for
   measured responses that must stay full-band. MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var A = ES.audio = ES.audio || {};
  var N = A.native = A.native || {};

  function OAC() { return root.OfflineAudioContext || root.webkitOfflineAudioContext || null; }
  N.supported = function () { return !!OAC(); };

  function offline(ch, len, sr) {
    var O = OAC();
    if (!O) throw new Error('OfflineAudioContext is not available');
    try { return new O({ numberOfChannels: ch, length: len, sampleRate: sr }); } catch (e) { return new O(ch, len, sr); }
  }
  /* Contexts in flight are held here until they finish (an unreferenced context must not be collected mid-render),
     and a render that never completes rejects after a timeout, so the caller falls back instead of waiting forever. */
  var inflight = [];
  N.inflight = function () { return inflight.length; };
  function startRendering(oc, timeoutMs) {
    inflight.push(oc);
    return new Promise(function (res, rej) {
      var done = false, to = setTimeout(function () { fin(null, new Error('offline render timed out')); }, timeoutMs || 10000);
      function fin(b, e) {
        if (done) return;
        done = true; clearTimeout(to);
        var i = inflight.indexOf(oc); if (i >= 0) inflight.splice(i, 1);
        if (e) rej(e); else res(b);
      }
      oc.oncomplete = function (ev) { fin(ev.renderedBuffer); };
      try {
        var p = oc.startRendering();
        if (p && typeof p.then === 'function') p.then(function (b) { fin(b); }, function (e) { fin(null, e || new Error('offline render failed')); });
      } catch (e) { fin(null, e); }
    });
  }
  // AudioBuffer from channel arrays (constructor where available, else createBuffer on a scratch context).
  var scratch = {};
  N.makeBuffer = function (chs, sr) {
    var len = chs[0].length, b = null;
    try { if (typeof root.AudioBuffer === 'function') b = new root.AudioBuffer({ length: len, numberOfChannels: chs.length, sampleRate: sr }); } catch (e) { b = null; }
    if (!b) { var key = sr + ':' + chs.length; scratch[key] = scratch[key] || offline(chs.length, 1, sr); b = scratch[key].createBuffer(chs.length, len, sr); }
    for (var c = 0; c < chs.length; c++) {
      if (b.copyToChannel) b.copyToChannel(chs[c], c); else b.getChannelData(c).set(chs[c]);
    }
    return b;
  };
  function setPos(p, x, y, z) {
    if (p.positionX) { p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z; } else p.setPosition(x, y, z);
  }
  function panner(oc, az) {
    var p = oc.createPanner(), r = az * Math.PI / 180;
    p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = 1; p.rolloffFactor = 0; p.maxDistance = 10000;
    setPos(p, Math.sin(r), 0, -Math.cos(r)); // listener at the origin facing -z; +x is to the right
    return p;
  }

  /* jobs: [{type:'pan', input: Float32Array, at: samples, az} | {type:'conv', input, at, ir: [L, R]}] (see above)
     Resolves with [[L, R], ...] in job order (full length `len`); HRTF stems are shifted by the measured panner
     latency so direct sound and reflections line up. */
  N.run = function (jobs, len, sr) {
    if (!jobs.length) return Promise.resolve([]);
    var batches = [], B = 16;
    for (var i = 0; i < jobs.length; i += B) batches.push(jobs.slice(i, i + B));
    var needPan = jobs.some(function (j) { return j.type === 'pan'; });
    function go(lat) { return Promise.all(batches.map(function (b) { return runBatch(b, len, sr, lat); })).then(function (parts) { return [].concat.apply([], parts); }); }
    // with the latency known, rendering starts now (synchronously), so the caller's JS work overlaps the audio thread
    if (!needPan || latCache[sr] != null) { try { return go(needPan ? latCache[sr] : 0); } catch (e) { return Promise.reject(e); } }
    return N.hrtfLatency(sr).then(go);
  };
  function runBatch(jobs, len, sr, lat) {
    var oc = offline(2 * jobs.length, len, sr), merger = oc.createChannelMerger(2 * jobs.length);
    merger.connect(oc.destination);
    jobs.forEach(function (job, k) {
      var src = oc.createBufferSource();
      src.buffer = N.makeBuffer([job.input], sr);
      var node;
      if (job.type === 'pan') node = panner(oc, job.az || 0);
      else {
        node = oc.createConvolver();
        node.normalize = false;
        node.buffer = N.makeBuffer(job.ir, sr);
      }
      src.connect(node);
      var sp = oc.createChannelSplitter(2);
      node.connect(sp);
      sp.connect(merger, 0, 2 * k);
      sp.connect(merger, 1, 2 * k + 1);
      var at = (job.at || 0) + (job.type === 'pan' ? -lat : 0); // start HRTF jobs early by the panner latency
      if (at >= 0) src.start(at / sr);
      else src.start(0, -at / sr);
    });
    return startRendering(oc, 4000 + 3000 * len / sr).then(function (out) {
      return jobs.map(function (job, k) { return [out.getChannelData(2 * k), out.getChannelData(2 * k + 1)]; });
    });
  }

  /* HRIR table: for a static source the HRTF panner is a fixed filter, so its impulse response is captured once per
     5 degrees of azimuth (72 pairs, a few small offline renders) and trials apply it in JS (dsp: convStereo). This
     keeps the browser's own HRTF while each trial skips the native pass. Kernels: HRIR_LEN samples starting HRIR_PRE
     samples before the latency-compensated arrival (at 16 kHz the panner's energy lies within ~70 samples).
     Resolves {get(az) -> {az, L, R}, lat, pre}; rejects (and can be retried) when the panner gives no output. */
  N.HRIR_STEP = 5; N.HRIR_LEN = 128; N.HRIR_PRE = 16;
  var tables = {};
  N.hrirTable = function (sr) {
    if (tables[sr]) return tables[sr];
    var p = tables[sr] = N.hrtfLatency(sr).then(function (lat) {
      if (N.hrtfOk === false) throw new Error('HRTF panner gives no output');
      var azs = [], batches = [], at = 64, len = at + lat + N.HRIR_LEN + 64, one = new Float32Array(1), az;
      one[0] = 1;
      for (az = -180; az < 180; az += N.HRIR_STEP) azs.push(az);
      for (var i = 0; i < azs.length; i += 16) batches.push(azs.slice(i, i + 16));
      return Promise.all(batches.map(function (b) {
        var oc = offline(2 * b.length, len, sr), merger = oc.createChannelMerger(2 * b.length), imp = N.makeBuffer([one], sr);
        merger.connect(oc.destination);
        b.forEach(function (a, k) {
          var src = oc.createBufferSource(), pn = panner(oc, a), sp = oc.createChannelSplitter(2);
          src.buffer = imp; src.connect(pn); pn.connect(sp); sp.connect(merger, 0, 2 * k); sp.connect(merger, 1, 2 * k + 1);
          src.start(at / sr);
        });
        return startRendering(oc, 20000).then(function (out) {
          var s0 = at + lat - N.HRIR_PRE;
          return b.map(function (a, k) {
            return { az: a, L: out.getChannelData(2 * k).slice(s0, s0 + N.HRIR_LEN), R: out.getChannelData(2 * k + 1).slice(s0, s0 + N.HRIR_LEN) };
          });
        });
      })).then(function (lists) {
        var map = {}, ok = true;
        [].concat.apply([], lists).forEach(function (e) { map[e.az] = e; if (!(A.dsp.energy([e.L, e.R]) > 0)) ok = false; });
        if (!ok) throw new Error('HRTF panner gives no output');
        return { lat: lat, pre: N.HRIR_PRE, step: N.HRIR_STEP, get: function (a) {
          var k = Math.round((((+a || 0) % 360 + 540) % 360 - 180) / N.HRIR_STEP) * N.HRIR_STEP;
          return map[k >= 180 ? k - 360 : k];
        } };
      });
    });
    p.catch(function () { if (tables[sr] === p) delete tables[sr]; });
    return p;
  };

  // Bulk delay of the HRTF panner at azimuth 0 (samples), measured once per sample rate with an impulse.
  var latCache = {};
  N.hrtfLatency = function (sr) {
    if (latCache[sr] != null) return Promise.resolve(latCache[sr]);
    var len = 2048, at = 256, oc = offline(2, len, sr), x = new Float32Array(1);
    x[0] = 1;
    var src = oc.createBufferSource(); src.buffer = N.makeBuffer([x], sr);
    var p = panner(oc, 0); src.connect(p); p.connect(oc.destination); src.start(at / sr);
    return startRendering(oc).then(function (out) {
      var L = out.getChannelData(0), R = out.getChannelData(1), best = 0, bi = at;
      for (var i = 0; i < len; i++) { var v = Math.abs(L[i]) + Math.abs(R[i]); if (v > best) { best = v; bi = i; } }
      latCache[sr] = best > 0 ? Math.max(0, bi - at) : 0;
      N.hrtfOk = best > 0;
      return latCache[sr];
    }, function () { latCache[sr] = 0; N.hrtfOk = false; return 0; });
  };
})(typeof window !== 'undefined' ? window : globalThis);
