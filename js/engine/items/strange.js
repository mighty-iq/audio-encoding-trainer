/* Earshot engine — Strange voices: semantically unpredictable phrases (context cannot replace listening:
   Loebach 2010) from unusual talkers; report two words. One family per trial, each with its own severity ladder
   (easy-to-hard ramp: Guediche 2016): accent (accented voices; accent trials run in babble because accent costs
   grow as SNR falls: Stringer & Iverson 2019), fast (WSOLA time compression), whisper, phone line, muffled,
   vocoded. Feedback pops out: degraded → words on screen → degraded again (Davis 2005). The held-out family
   for the New-voice probe (tone-vocoded speech) is never generated here. Bet: adapting to new voices (R2). */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var E = ES.engine, I = E.items, C = I.common, X = I.data;
  var NATIVE = { us: 1, gb: 1, au: 1, ca: 1, ie: 1, nz: 1 };

  function familyOf(dials) {
    var a = E.dials.strange;
    for (var i = 0; i < a.length; i++) if (dials[a[i].id] !== undefined && dials[a[i].id] !== null) return a[i];
    return null;
  }
  function isAccented(vo) { return !!vo && !I.adapt.isNative(vo); }

  function make(rng, setting, ctx) {
    ctx = ctx || {};
    var V = (ES.data && ES.data.vocab) || {}, breadth = C.breadthOf(setting, ctx);
    var dials = JSON.parse(JSON.stringify(setting.dials || {}));
    var d = (setting.focus && E.dialDef('strange', setting.focus) && dials[setting.focus] !== undefined && dials[setting.focus] !== null ? E.dialDef('strange', setting.focus) : null) ||
      familyOf(dials) || E.dialDef('strange', ctx.family || 'vocoded');
    if (dials[d.id] === undefined || dials[d.id] === null) dials[d.id] = 0;
    Object.keys(dials).forEach(function (k) { if (k !== d.id) delete dials[k]; });
    var lvl = Math.max(d.min, Math.min(d.max, Math.round(dials[d.id]))), v = d.values[lvl];
    dials[d.id] = lvl;
    // Relaxation (recorded in meta.relaxed): (1) call-sign phrases when the build has no sentences for Strange;
    // (2) accent family without accented voices → the next family at the same level; (3) all voices with material.
    var A = I.adapt, items = A.susItems(), withMat = {}, relaxed = [], fb = false;
    if (!A.voicesWith(items).length) { items = A.fallbackItems(); fb = true; relaxed.push('call-sign phrases'); }
    A.voicesWith(items).forEach(function (v) { withMat[v] = 1; });
    if (d.id === 'accent' && !Object.keys(withMat).some(function (v) { return isAccented(X.voice(v)); })) {
      var alt = E.dials.strange.filter(function (x) { return x.id !== 'accent'; })[0];
      relaxed.push('accent → ' + alt.id + ' (no accented voices)');
      delete dials[d.id]; d = alt; lvl = Math.max(d.min, Math.min(d.max, lvl)); v = d.values[lvl]; dials[d.id] = lvl;
    }
    var answers = X.keyPool(fb ? 'strange:fb' : 'strange', items, function (it) { return it.keys.map(function (k) { return it.words[k]; }); });
    var pool, filter;
    if (d.id === 'accent') {
      // accented voices of the wanted strength (nearest tier available); the accent pool widens with breadth
      var tierOk = function (vo) { return isAccented(vo) && Math.abs((vo.tier || 2) - v.tier) === 0; };
      filter = function (vo) { return tierOk(vo); };
      pool = X.voicePool({ filter: function (vo, v) { return withMat[v] && filter(vo); }, order: ctx.playerSeed || 'p' });
      if (pool.length < 2) pool = X.voicePool({ filter: function (vo, v) { return withMat[v] && isAccented(vo); }, order: ctx.playerSeed || 'p' });
      var accents = C.uniq(pool.map(function (x) { return X.voice(x).accent; }));
      var nAcc = Math.max(1, Math.round(1 + breadth * (accents.length - 1)));
      var keepAcc = ctx.accent && accents.indexOf(ctx.accent) >= 0 ? [ctx.accent] : accents.slice(0, nAcc);
      pool = pool.filter(function (x) { return keepAcc.indexOf(X.voice(x).accent) >= 0; });
    } else {
      pool = X.voicePool({ filter: function (vo, v) { return withMat[v] && !isAccented(vo); }, order: ctx.playerSeed || 'p' });
      var nKeep = Math.max(3, Math.round(3 + breadth * (pool.length - 3)));
      pool = pool.slice(0, nKeep);
    }
    var idx = X.idx(); idx.poolCache = idx.poolCache || {};
    var ik = fb ? 'strange:fb:items' : 'strange:items';
    var ok = idx.poolCache[ik] || (idx.poolCache[ik] = items.filter(function (it) {
      return it.keys && it.keys.length >= 2 && it.keys.every(function (k) { return answers.indexOf(C.norm(it.words[k])) >= 0; });
    }));
    var hit = X.itemVoice(rng, ok, 'any', pool, C.recentOf(ctx));
    if (!hit) { hit = X.itemVoice(rng, ok, 'any', Object.keys(withMat), []); if (hit) relaxed.push('all voices'); }
    if (!hit) throw new Error('strange: no speech material in this build');
    var fx = [], beds = [];
    if (d.id === 'fast') fx.push({ type: 'wsola', rate: v });
    if (d.id === 'whisper') fx.push({ type: 'whisper' });
    if (d.id === 'phone') fx.push({ type: 'band', lo: v.lo, hi: v.hi });
    if (d.id === 'muffled') fx.push({ type: 'lowpass', f: v });
    if (d.id === 'vocoded') fx.push({ type: 'vocode', bands: v, carrier: 'noise' });
    var snr = d.id === 'accent' ? v.snr : d.id === 'whisper' ? v : d.id === 'phone' ? v.snr : null;
    if (snr !== null && snr !== undefined) {
      if (d.id === 'phone') beds.push({ kind: 'pink', db: -snr });
      else {
        var b = X.bed(rng, ['babble']);
        beds.push(b ? { kind: 'babble', bed: b.id, db: -snr } : { kind: 'babble', clips: X.babbleClips(rng, [hit.voice], 6), db: -snr });
      }
    }
    var meta = X.clip, dur = (meta(hit.clip) && meta(hit.clip).dur) || 1.6;
    if (d.id === 'fast') dur = dur / v;
    var part = { clip: hit.clip, at: 0.35, db: 0, role: 'target' };
    if (fx.length) part.fx = fx;
    var audio = { out: { db: -20 }, dur: Math.round((0.35 + dur + 0.5) * 100) / 100, spatial: 'mono', parts: [part], beds: beds, room: null };
    var k1 = hit.item.words[hit.item.keys[0]], k2 = hit.item.words[hit.item.keys[1]];
    var dk = fb ? 'strange:fb:dist' : 'strange:dist';
    var dist = idx.poolCache[dk] || (idx.poolCache[dk] = [0, 1].map(function (j) {
      return C.answerDist(ok, function (it) { return C.norm(it.words[it.keys[j]]); });
    }));
    var s1 = C.slot(rng, { label: fb ? 'Word' : 'First word', answer: k1, pool: dist[0].support, draw: dist[0].draw, freq: dist[0].freq, neighbours: X.neighbours, avoid: [k2] });
    var s2 = C.slot(rng, { label: fb ? 'Number' : 'Second word', answer: k2, pool: dist[1].support, draw: dist[1].draw, freq: dist[1].freq, neighbours: X.neighbours, avoid: [k1], type: fb ? 'number' : undefined });
    var slots = [s1, s2].filter(function (sl, j) { return dist[j].support.length >= 3 && sl.options.length >= 2; });
    if (!slots.length) slots = [s1];
    var vo = X.voice(hit.voice), c = meta(hit.clip);
    C.remember(ctx, hit.voice, null);
    var cond = d.id === 'accent' ? 'accent:' + (vo.accent || '?') : d.id;
    return {
      id: 'strange-' + C.seedOf(rng).toString(36), ex: 'strange', seed: setting.seed || null,
      setting: { dials: dials, focus: d.id, anchor: !!setting.anchor, warmup: !!setting.warmup },
      audio: audio,
      question: { prompt: 'Which words did you hear?', slots: slots },
      feedback: { text: '“' + hit.item.text + '”', popout: true, levelLabel: d.levels[lvl],
        replays: [{ label: 'Again, with the words', audio: audio, showText: true }] },
      picture: { voices: [{ id: 'v0', role: 'target', az: 0, dist: 1, label: '' }] },
      meta: { items: [k1, k2], voices: [hit.voice], family: d.id, levelLabel: d.levels[lvl], probe: false, ctxKey: 'strange', cond: cond,
        accent: vo.accent, synthetic: vo.src === 'kokoro' || vo.src === 'piper-libritts', offsetDb: (c && c.diff) || 0, text: hit.item.text, relaxed: relaxed }
    };
  }
  // Listen-only exposure: words first, then the degraded phrase (text before sound helps: Sohoglu 2014).
  function exposure(rng, setting, ctx) {
    var out = [];
    for (var i = 0; i < 3; i++) { var t = make(rng.fork('x' + i), setting, ctx); out.push({ text: t.meta.text, textFirst: true, audio: t.audio }); }
    return out;
  }
  I.strange = { ready: function () { return I.adapt.ready('strange'); }, make: make, exposure: exposure, families: function () { return E.dials.strange.map(function (d) { return d.id; }); } };
})(typeof window !== 'undefined' ? window : globalThis);
