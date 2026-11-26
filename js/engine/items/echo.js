/* Earshot engine — Echo: a message heard once in café or party noise (names, places, times, days, numbers,
   things to bring), a pause, then 2–3 questions. Dials: snr, details per message, rate (WSOLA speed-up), delay
   before the questions. Foils that occur elsewhere in the message are labelled 'context' (a binding error: right
   word, wrong question). Bet: listening under memory load on real-life content (bridging). */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var E = ES.engine, I = E.items, C = I.common, X = I.data;

  function val(id, i) { var d = E.dialDef('echo', id); return d.values[Math.max(d.min, Math.min(d.max, Math.round(i)))]; }
  function catPools(V) {
    var idx = X.idx(); idx.poolCache = idx.poolCache || {};
    if (idx.poolCache['echo:cats']) return idx.poolCache['echo:cats'];
    var out = {}, seen = {};
    I.adapt.echoItems().forEach(function (it) {
      (it.facts || []).forEach(function (f) {
        var k = f.cat + '|' + C.norm(f.value);
        if (seen[k] || X.isProbeWord(f.value)) return;
        seen[k] = 1; (out[f.cat] = out[f.cat] || []).push(f.value);
      });
    });
    var extra = V.echoValues || {};
    Object.keys(extra).forEach(function (cat) {
      (extra[cat] || []).forEach(function (v) { var k = cat + '|' + C.norm(v); if (!seen[k] && !X.isProbeWord(v)) { seen[k] = 1; (out[cat] = out[cat] || []).push(v); } });
    });
    idx.poolCache['echo:cats'] = out;
    return out;
  }
  function cap(w) { w = String(w || ''); return w.charAt(0).toUpperCase() + w.slice(1); }
  function fallbackMessages() {
    var idx = X.idx(); idx.poolCache = idx.poolCache || {};
    if (idx.poolCache['echo:fb']) return idx.poolCache['echo:fb'];
    var nums = {}; I.adapt.callsign().forEach(function (p) { nums[p.number] = 1; });
    var withNum = Object.keys(nums).length >= 3;
    var out = I.adapt.fallbackItems().map(function (it) {
      var f = [{ cat: 'caller', value: cap(it.words[0]), q: 'Who was calling?' }, { cat: 'word', value: it.words[1], q: 'Which word did they say?' }];
      if (withNum) f.push({ cat: 'number', value: it.words[2], q: 'Which number?' });
      return { id: it.id, text: it.text, words: it.words, facts: f, kind: it.kind };
    });
    idx.poolCache['echo:fb'] = out;
    return out;
  }
  function catPoolsOf(items) {
    var out = {}, seen = {};
    items.forEach(function (it) { it.facts.forEach(function (f) { var k = f.cat + '|' + C.norm(f.value); if (!seen[k]) { seen[k] = 1; (out[f.cat] = out[f.cat] || []).push(f.value); } }); });
    return out;
  }
  function contains(text, phrase) { return (' ' + C.norm(text) + ' ').indexOf(' ' + C.norm(phrase) + ' ') >= 0; }

  function make(rng, setting, ctx) {
    ctx = ctx || {};
    var V = (ES.data && ES.data.vocab) || {}, breadth = C.breadthOf(setting, ctx);
    var dials = JSON.parse(JSON.stringify(setting.dials || {}));
    var snr = dials.snr !== undefined ? dials.snr : 10, nDet = val('details', dials.details || 0), rate = val('rate', dials.rate || 0), delay = val('delay', dials.delay || 0);
    var cats = catPools(V);
    // Relaxation (meta.relaxed): (1) all voices with material; (2) the build's call-sign phrases as two- or
    // three-detail messages (who called, which word, which number when the build has ≥ 3 numbers).
    var A = I.adapt, all = A.echoItems(), withMat = {}, relaxed = [];
    if (!A.voicesWith(all).length) { all = fallbackMessages(); relaxed.push('call-sign phrases'); cats = catPoolsOf(all); }
    A.voicesWith(all).forEach(function (v) { withMat[v] = 1; });
    var cand = [];
    for (var off = 0; off < 4 && !cand.length; off++) cand = all.filter(function (it) { return Math.abs(it.facts.length - nDet) === off; });
    var pool = X.voicePool({ filter: function (vo, v) { return withMat[v]; }, breadth: breadth, order: ctx.playerSeed || 'p', minN: 4, avoid: ctx.avoidVoices });
    var hit = X.itemVoice(rng, cand, 'any', pool, C.recentOf(ctx));
    if (!hit) { hit = X.itemVoice(rng, cand, 'any', Object.keys(withMat), []); if (hit) relaxed.push('all voices'); }
    if (!hit) throw new Error('echo: no speech material in this build');
    var it = hit.item, actual = it.facts.length;
    dials.details = Math.max(0, Math.min(3, actual - 2));
    var fx = rate > 1.001 ? [{ type: 'wsola', rate: rate }] : null;
    var c = X.clip(hit.clip), dur = (c.dur || 3) / (rate || 1);
    var part = { clip: hit.clip, at: 0.6, db: 0, role: 'target' };
    if (fx) part.fx = fx;
    var bo = { avoid: [hit.voice], talkers: X.bedTalkers(rng, breadth), db: -snr };
    var beds = [X.bedSpec(rng, breadth < 0.4 ? ['cafe'] : ['cafe', 'party', 'babble'], bo) || X.bedSpec(rng, ['babble'], bo) || { kind: 'ssn', db: -snr }];
    var audio = { out: { db: -20 }, dur: Math.round((0.6 + dur + 0.8) * 100) / 100, spatial: 'mono', parts: [part], beds: beds, room: null };
    C.remember(ctx, hit.voice, null);
    var nQ = Math.min(3, actual), facts = C.sample(rng, it.facts.filter(function (f) { return cats[f.cat] && cats[f.cat].length >= 4; }), nQ);
    var slots = facts.map(function (f) {
      var others = it.facts.filter(function (g) { return g !== f && g.cat === f.cat; }).map(function (g) { return g.value; });
      var idx = X.idx(), dk = 'echo:dist:' + actual + ':' + f.cat;
      var dist = idx.poolCache[dk] || (idx.poolCache[dk] = C.answerDist(cand.filter(function (m) { return m.facts.length === actual; }), function (m) {
        var g = m.facts.filter(function (x) { return x.cat === f.cat; })[0]; return g ? g.value : undefined; }));
      var sl = C.slot(rng, { label: f.q, answer: f.value, pool: dist.support.length >= 4 ? dist.support : cats[f.cat], draw: dist.draw, freq: dist.freq, neighbours: X.neighbours, avoid: others, type: f.cat === 'number' ? 'number' : undefined });
      Object.keys(sl.foils).forEach(function (o) { if (contains(it.text, o)) sl.foils[o] = 'context'; });
      sl.cat = f.cat;
      return sl;
    });
    return {
      id: 'echo-' + C.seedOf(rng).toString(36), ex: 'echo', seed: setting.seed || null,
      setting: { dials: dials, focus: setting.focus, anchor: !!setting.anchor, warmup: !!setting.warmup },
      audio: audio,
      question: { prompt: 'Questions about the message', delayMs: Math.round(delay * 1000), slots: slots },
      feedback: { text: '“' + it.text + '”', replays: [{ label: 'Hear it again', audio: audio, showText: true }] },
      picture: { voices: [{ id: 'v0', role: 'target', az: 0, dist: 1, label: '' }] },
      meta: { items: facts.map(function (f) { return f.value; }), voices: [hit.voice], family: null, probe: false, ctxKey: 'echo', cond: 'base', relaxed: relaxed,
        offsetDb: c.diff || 0, text: it.text, facts: it.facts }
    };
  }
  I.echo = { make: make, ready: function () { return I.adapt.ready('echo'); } };
})(typeof window !== 'undefined' ? window : globalThis);
