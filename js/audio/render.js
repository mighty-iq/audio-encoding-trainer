/* Earshot trial renderer: ES.audio.render(spec, {seed}) -> Promise<{buffer, report}> (CONTRACTS §4/§5) and
   ES.audio.play(buffer) -> {stop, ended}. Every part's direct sound, its room sound and every bed become separate
   stereo stems; each stem is calibrated by measurement, so the levels asked for are the levels delivered.
   Levels (dB, active speech level for parts, RMS over the target's span for beds) are re the reference, where the
   target is 0, measured at the ears (mean of both ears' power). In a room (levels 'ear', the default) each part's
   direct + room sound arrives at its db and the room only sets DRR = 20 log10(dc / dist) (6 dB less per doubling)
   and the colour; with levels 'source' a part's db holds at 1 m and its direct sound falls 6 dB per doubling while
   the room sound stays constant. The mix is set to out.db (active level) and limited to peaks <= -1 dBFS.
   MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var A = ES.audio = ES.audio || {};
  var D = A.dsp, P = A.prep, N = A.native;

  function now() { return root.performance && root.performance.now ? root.performance.now() : Date.now(); }
  function r2(x) { return x == null || !isFinite(x) ? null : Math.round(x * 100) / 100; }
  function mark(c, k) { var t = now(); c.tm[k] = Math.round((t - c.tl) * 10) / 10; c.tl = t; }
  function uniq(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }

  A.render = function (spec, opts) {
    var t0 = now();
    return Promise.resolve().then(function () { return run(spec || {}, opts || {}, t0); });
  };
  // Clip ids a spec needs (for ES.audio.assets.preload ahead of the trial).
  A.render.clips = function (spec) {
    var a = (spec && spec.audio) || spec || {}, ids = [];
    (a.parts || []).forEach(function (p) { if (p && p.clip) ids.push(p.clip); });
    (a.beds || []).forEach(function (b) { if (b) ids = ids.concat(P.bedClips(b)); });
    if (a.room && a.room.ir) ids = ids.concat(a.room.ir);
    return uniq(ids);
  };

  function run(spec, opts, t0) {
    var a = spec.audio || spec, warnings = [], warn = function (m) { if (warnings.indexOf(m) < 0) warnings.push(m); };
    var seed = opts.seed != null ? opts.seed : spec.seed != null ? spec.seed : 1, rng = D.rng(seed);
    var sr = A.assets.sampleRate(), spatial = a.spatial === 'hrtf' || a.spatial === 'ild' ? a.spatial : 'mono';
    if (spatial === 'hrtf' && !N.supported()) { spatial = 'ild'; warn('no OfflineAudioContext: ild used'); }
    var outDb = a.out && a.out.db != null ? +a.out.db : A.ctx.outDb, room = P.roomInfo(a.room);
    var parts = (a.parts || []).filter(function (p) { return p && p.clip; }), beds = (a.beds || []).filter(Boolean);
    var partIds = parts.map(function (p) { return p.clip; });
    return Promise.all(A.render.clips(a).map(function (id) {
      return Promise.all([A.assets.samples(id), A.assets.level(id)]).then(function (r) { return { id: id, x: r[0], lev: r[1] }; },
        function (e) { if (partIds.indexOf(id) >= 0) throw e; warn(String(e && e.message || e)); return null; });
    })).then(function (list) {
      var clipData = {};
      list.forEach(function (d) { if (d) clipData[d.id] = d; });
      var c = { seed: seed, rng: rng, sr: sr, spatial: spatial, outDb: outDb, room: room, warn: warn, opts: opts, tm: {}, tl: t0 };
      mark(c, 'load');
      return mixdown(a, parts, beds, clipData, c);
    }).then(function (res) {
      res.report.ms = Math.round(now() - t0);
      res.report.warnings = warnings;
      return res;
    });
  }

  function mixdown(a, parts, beds, clipData, c) {
    var sr = c.sr, room = c.room, REF = P.REF, warn = c.warn;
    var labels = P.labels(parts, function (p) { return (p.role || 'target') + ':' + p.clip; });
    // 1. sources: fx, then scaled to the working level REF (active level)
    var srcs = parts.map(function (p, i) {
      var d = clipData[p.clip], rng = D.fork(c.rng, 'part:' + labels[i]);
      var key = p.fx && p.fx.length ? c.seed + '|' + labels[i] + '|' + JSON.stringify(p.fx) : null;
      var y = P.applyFx(d.x, sr, p.fx, rng, warn, key), lev = key ? D.activeDb(y, sr, { tail: D.SOURCE_TAIL }) : d.lev;
      if (!(lev > D.FLOOR_DB + 1)) { warn('silent part ' + p.clip); lev = REF; }
      var inRoom = !!(room && p.room), dist = inRoom ? (p.dist != null ? Math.max(0.1, +p.dist) : room.dist) : null;
      return { p: p, i: i, role: p.role || 'target', u: D.scale(y, D.db2g(REF - lev)), at: Math.max(0, Math.round((+p.at || 0) * sr)),
        inRoom: inRoom, dist: dist, db: +p.db || 0 };
    });
    var useRoom = room && (srcs.some(function (s) { return s.inRoom; }) || beds.some(function (b) { return b.room; }));
    var ir = useRoom ? P.rir(room, sr, clipData) : null, irUse = ir && (c.spatial === 'mono' ? [ir[0], ir[0]] : ir);
    var contentEnd = 0;
    srcs.forEach(function (s) { contentEnd = Math.max(contentEnd, s.at + s.u.length); });
    var tail = useRoom ? Math.round(Math.min(1.0, 0.5 * room.rt60) * sr) : 0;
    var len = a.dur ? Math.max(1, Math.round(a.dur * sr)) : Math.max(Math.round(0.5 * sr), contentEnd + tail + Math.round(0.15 * sr));
    // target span (for bed levels and the report)
    var tA = Infinity, tB = 0, targetDb = 0, haveTarget = false;
    srcs.forEach(function (s) { if (s.role === 'target') { if (!haveTarget) targetDb = s.db; haveTarget = true; tA = Math.min(tA, s.at); tB = Math.max(tB, s.at + s.u.length); } });
    if (!haveTarget) { tA = 0; tB = len; } else tB = Math.min(tB, len);
    mark(c, 'fx');
    // 2. stems
    var stems = [], jobs = [], stereo = c.spatial !== 'mono';
    srcs.forEach(function (s) {
      var dir = s.u, airLoss = 0, distDb = 0;
      if (s.inRoom) {
        distDb = 20 * Math.log10(1 / s.dist);
        var ac = D.airCoefs(s.dist, sr);
        if (ac) { dir = D.filter(s.u, ac); airLoss = D.p2db(D.energy(s.u)) - D.p2db(D.energy(dir)); }
      }
      var st = { kind: 'dir', src: s, role: s.role, eIn: D.energy(dir), airLoss: airLoss,
        want: s.db + (room && room.levels === 'source' ? distDb : 0) };
      if (c.spatial === 'hrtf') { st.job = jobs.length; jobs.push({ type: 'pan', input: dir, at: s.at, az: +s.p.az || 0 }); }
      else if (c.spatial === 'ild') { var lr = D.hrtfLite(dir, sr, +s.p.az || 0); st.ch = [D.place(len, lr[0], s.at), D.place(len, lr[1], s.at)]; }
      else { var m = D.place(len, dir, s.at); st.ch = [m, m]; }
      stems.push(st); s.dirStem = st;
      if (s.inRoom) {
        var rv = { kind: 'rev', src: s, role: s.role, dir: st, job: jobs.length };
        jobs.push({ type: 'conv', input: s.u, at: s.at, ir: irUse });
        stems.push(rv); s.revStem = rv;
      }
    });
    var extra = {};
    if (beds.some(function (b) { return (b.kind || 'ssn') === 'ssn' && (b.from === 'target' || b.from === 'parts'); })) {
      var tl = [], pl = [];
      srcs.forEach(function (s) { var l = D.ltasOf(s.u, sr); pl.push(l); if (s.role === 'target') tl.push(l); });
      extra.targetLtas = D.ltasMean(tl.length ? tl : pl); extra.partsLtas = D.ltasMean(pl);
    }
    var bedLabels = P.labels(beds, function (b) { return 'bed:' + (b.kind || 'ssn'); });
    beds.forEach(function (b, j) {
      var inRoom = !!(room && b.room), ch = P.makeBed(b, len, sr, stereo && !inRoom, D.fork(c.rng, bedLabels[j]), clipData, extra, warn);
      var st = { kind: 'bed', role: 'bed', bed: b, want: targetDb + (+b.db || 0) };
      if (inRoom) { st.job = jobs.length; jobs.push({ type: 'conv', input: P.mono(ch), at: 0, ir: irUse }); }
      else st.ch = ch.length === 1 ? [ch[0], ch[0]] : ch;
      stems.push(st);
    });
    mark(c, 'stems');
    // 3. native pass (HRTF, rooms)
    return N.run(jobs, len, sr).then(function (out) {
      mark(c, 'native');
      stems.forEach(function (st) {
        if (st.job == null) return;
        st.ch = out[st.job];
        if (st.kind === 'dir' && st.eIn > 0 && !(D.energy(st.ch) > 0)) { // HRTF panner gave silence: light head model
          var j = jobs[st.job], lr = D.hrtfLite(j.input, sr, j.az);
          st.ch = [D.place(len, lr[0], j.at), D.place(len, lr[1], j.at)];
          warn('HRTF panner produced no output; ITD/ILD head model used');
        }
      });
      return finish(stems, srcs, len, tA, tB, c, room);
    });
  }

  function finish(stems, srcs, len, tA, tB, c, room) {
    var sr = c.sr, REF = P.REF, i;
    // 4. calibration by measurement. Direct sound in mono: the source sits at REF - airLoss, so the gain is the
    // wanted level. Spatialised (ild, hrtf): the active level of the stereo stem is measured.
    stems.forEach(function (st) {
      if (st.kind !== 'dir') return;
      if (c.spatial === 'mono') { st.g = st.eIn > 0 ? D.db2g(st.want) : 0; return; }
      var lv = D.activeDb(st.ch, sr);
      st.g = lv > D.FLOOR_DB + 1 ? D.db2g(REF + st.want - st.airLoss - lv) : 0;
    });
    // Room sound: energy re the direct sound without air absorption = (dist / dc)^2, i.e. DRR = 20 log10(dc / dist).
    stems.forEach(function (st) {
      if (st.kind === 'rev') {
        var s = st.src, eDir = D.energy(st.dir.ch) * st.dir.g * st.dir.g * Math.pow(10, st.dir.airLoss / 10);
        var eRev = D.energy(st.ch);
        st.g = eRev > 0 ? Math.sqrt(eDir * Math.pow(s.dist / room.dc, 2) / eRev) : 0;
        st.drrDb = 20 * Math.log10(room.dc / s.dist);
      } else if (st.kind === 'bed') {
        crest(st, sr);
        var ms = D.meanSquare(st.ch, tA, tB);
        st.g = ms > 0 ? D.db2g(REF + st.want) / Math.sqrt(ms) : 0;
      }
    });
    // Parts in the room: measure direct + room sound together; with levels 'ear' scale both to the part's db.
    srcs.forEach(function (s) {
      var d = s.dirStem, r = s.revStem;
      if (!r) { s.rxRel = d.g ? d.want - d.airLoss : D.FLOOR_DB; return; }
      var SL = new Float32Array(len), SR = new Float32Array(len);
      D.addInto(SL, d.ch[0], 0, d.g); D.addInto(SR, d.ch[1], 0, d.g); D.addInto(SL, r.ch[0], 0, r.g); D.addInto(SR, r.ch[1], 0, r.g);
      var lv = D.activeDb([SL, SR], sr);
      if (room.levels === 'ear' && lv > D.FLOOR_DB + 1) { var k = D.db2g(REF + s.db - lv); d.g *= k; r.g *= k; s.rxRel = s.db; }
      else s.rxRel = lv - REF;
    });
    mark(c, 'calib');
    // 5. mix
    var L = new Float32Array(len), R = new Float32Array(len);
    stems.forEach(function (st) { if (st.g) { D.addInto(L, st.ch[0], 0, st.g); D.addInto(R, st.ch[1], 0, st.g); } });
    // 6. output level, limiter, hard ceiling (a numerical guard only)
    var lev = D.activeDb([L, R], sr), G = lev > D.FLOOR_DB + 1 ? D.db2g(c.outDb - lev) : 1;
    D.scaleInPlace(L, G); D.scaleInPlace(R, G);
    var lim = D.limiterGain([L, R], sr, { ceilDb: -1, lookMs: 5, relMs: 80 });
    D.applyGain([L, R], lim.gain);
    var ceil = D.db2g(-1);
    for (i = 0; i < len; i++) {
      if (L[i] > ceil) L[i] = ceil; else if (L[i] < -ceil) L[i] = -ceil;
      if (R[i] > ceil) R[i] = ceil; else if (R[i] < -ceil) R[i] = -ceil;
    }
    mark(c, 'mix');
    var res = { buffer: N.makeBuffer([L, R], sr), report: makeReport(stems, srcs, len, tA, tB, c, room, G, lim, [L, R]) };
    mark(c, 'report');
    res.report.tm = c.tm;
    if (c.opts.stems) res.stems = roleStems(stems, len, G, lim.gain);
    if (c.opts.stems === 'all') res.stemList = stems.filter(function (st) { return st.g; }).map(function (st) {
      var ch = [D.scale(st.ch[0], st.g * G), D.scale(st.ch[1], st.g * G)];
      D.applyGain(ch, lim.gain);
      return { kind: st.kind, role: st.role, clip: st.src ? st.src.p.clip : st.bed.kind, ch: ch };
    });
    return res;
  }

  /* Beds may carry transients (dishes, doors) far above their RMS; at a fixed output level those would drive the
     output limiter and shift the SNR. So each bed's peaks are held at most CREST_DB above its own RMS first (linked
     look-ahead limiter), and the bed is calibrated after that. Gaussian beds (ssn, pink, babble) are rarely touched. */
  var CREST_DB = 15;
  function crest(st, sr) {
    var same = st.ch[0] === st.ch[1], ch = same ? [st.ch[0]] : st.ch;
    var lim = D.limiterGain(ch, sr, { ceilDb: D.rmsDb(ch) + CREST_DB, lookMs: 3, relMs: 40 });
    if (!lim.gain) { st.crestDb = 0; return; }
    ch = ch.map(function (x) { return new Float32Array(x); }); // the bed arrays may be shared (mono): copy first
    D.applyGain(ch, lim.gain);
    st.ch = same ? [ch[0], ch[0]] : ch;
    st.crestDb = lim.reductionDb;
  }

  function makeReport(stems, srcs, len, tA, tB, c, room, G, lim, mix) {
    var sr = c.sr, REF = P.REF, gdb = 20 * Math.log10(G);
    function limDbOf(list) { // level change from the limiter on a group of stems (energy ratio)
      var e0 = 0, e1 = 0;
      list.forEach(function (st) { if (st && st.g) { e0 += D.meanSquare(st.ch) * st.g * st.g; e1 += D.meanSquareGained(st.ch, lim.gain) * st.g * st.g; } });
      return e0 > 0 && lim.gain ? 10 * Math.log10(e1 / e0) : 0;
    }
    var parts = srcs.map(function (s) {
      var rel = s.rxRel + limDbOf([s.dirStem, s.revStem]);
      return { role: s.role, clip: s.p.clip, db: r2(rel), abs: REF + gdb + rel, dist: s.dist,
        drrDb: s.revStem ? r2(s.revStem.drrDb) : null, airDb: s.dirStem.airLoss ? r2(-s.dirStem.airLoss) : 0 };
    });
    var crestDb = 0;
    stems.forEach(function (st) { if (st.kind === 'bed' && st.crestDb < crestDb) crestDb = st.crestDb; });
    // the target: measured directly on its summed stems (the most important number)
    var tLev = null;
    if (srcs.some(function (s) { return s.role === 'target'; })) {
      var TL = new Float32Array(len), TR = new Float32Array(len);
      stems.forEach(function (st) { if (st.src && st.src.role === 'target' && st.g) { D.addInto(TL, st.ch[0], 0, st.g * G); D.addInto(TR, st.ch[1], 0, st.g * G); } });
      D.applyGain([TL, TR], lim.gain);
      tLev = D.activeDb([TL, TR], sr);
    }
    var mk = parts.filter(function (p) { return p.role === 'masker'; }), mMax = null, mSum = 0;
    mk.forEach(function (p) { mMax = mMax == null ? p.abs : Math.max(mMax, p.abs); mSum += Math.pow(10, p.abs / 10); });
    var bedMs = 0, nb = 0;
    stems.forEach(function (st) { if (st.kind === 'bed' && st.g) { bedMs += D.meanSquareGained(st.ch, lim.gain, tA, tB) * st.g * st.g * G * G; nb++; } });
    var bedDb = nb ? D.p2db(bedMs) : null, t0 = srcs.filter(function (s) { return s.role === 'target' && s.inRoom; })[0];
    return {
      snrDb: tLev != null && bedDb != null ? r2(tLev - bedDb) : null,       // target active level vs beds' RMS
      tmrDb: tLev != null && mMax != null ? r2(tLev - mMax) : null,        // vs the loudest masker
      tmrAllDb: tLev != null && mk.length ? r2(tLev - D.p2db(mSum)) : null, // vs all maskers together
      outDb: r2(D.activeDb(mix, sr)), peakDb: r2(D.peakDb(mix)), limitDb: r2(lim.reductionDb), bedCrestDb: r2(crestDb),
      targetDb: r2(tLev), bedDb: r2(bedDb), // dBFS at the output
      drrDb: t0 ? r2(20 * Math.log10(room.dc / t0.dist)) : null, dc: room ? r2(room.dc) : null,
      rt60: room ? r2(room.rt60) : null, levels: room ? room.levels : null,
      dur: r2(len / sr), span: [tA / sr, tB / sr], sr: sr, spatial: c.spatial, seed: c.seed,
      parts: parts.map(function (p) { return { role: p.role, clip: p.clip, db: p.db, dist: p.dist, drrDb: p.drrDb, airDb: p.airDb }; })
    };
  }

  // Stems summed by role at the final scale, limiter included: {target:[L,R], masker:[L,R], bed:[L,R], ...}.
  function roleStems(stems, len, G, gain) {
    var out = {};
    stems.forEach(function (st) {
      if (!st.g) return;
      var o = out[st.role] || (out[st.role] = [new Float32Array(len), new Float32Array(len)]);
      D.addInto(o[0], st.ch[0], 0, st.g * G); D.addInto(o[1], st.ch[1], 0, st.g * G);
    });
    Object.keys(out).forEach(function (k) { D.applyGain(out[k], gain); });
    return out;
  }

  // ---- playback (one trial buffer at a time) ----
  var current = null;
  A.play = function (buffer, opts) {
    opts = opts || {};
    var c = A.ctx.ensure(), settle, ended = new Promise(function (res) { settle = res; });
    if (!c || !buffer) { settle({ ok: false, reason: c ? 'no-buffer' : 'no-audio' }); return { stop: function () {}, ended: ended, duration: 0 }; }
    if (current && opts.exclusive !== false) current.stop();
    var src = c.createBufferSource(), done = false, wd = null, h;
    src.buffer = buffer;
    src.connect(A.ctx.master());
    function fin(r) { if (done) return; done = true; if (wd) clearTimeout(wd); if (current === h) current = null; settle(r); }
    src.onended = function () { fin({ ok: true }); };
    var when = c.currentTime + (opts.delay == null ? 0.04 : Math.max(0, opts.delay));
    src.start(when);
    // a suspended context never fires onended: resolve anyway shortly after the expected end
    wd = setTimeout(function () { fin({ ok: false, reason: 'timeout', state: c.state }); }, (buffer.duration + 2.5) * 1000);
    h = { stop: function () { try { src.stop(); } catch (e) { /* already stopped */ } fin({ ok: true, stopped: true }); },
      ended: ended, startTime: when, duration: buffer.duration };
    current = h;
    return h;
  };
  A.stop = function () { if (current) current.stop(); };
})(typeof window !== 'undefined' ? window : globalThis);
