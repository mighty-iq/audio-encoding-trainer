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
  function contains(text, phrase) { return (' ' + C.norm(text) + ' ').indexOf(' ' + C.norm(phrase) + ' ') >= 0; }

  function make(rng, setting, ctx) {
    ctx = ctx || {};
    var V = (ES.data && ES.data.vocab) || {}, breadth = C.breadthOf(setting, ctx);
    var dials = JSON.parse(JSON.stringify(setting.dials || {}));
    var snr = dials.snr !== undefined ? dials.snr : 10, nDet = val('details', dials.details || 0), rate = val('rate', dials.rate || 0), delay = val('delay', dials.delay || 0);
    var cats = catPools(V);
    var A = I.adapt, all = A.echoItems(), withMat = {};
    A.voicesWith(all).forEach(function (v) { withMat[v] = 1; });
    var cand = [];
    for (var off = 0; off < 4 && !cand.length; off++) cand = all.filter(function (it) { return Math.abs(it.facts.length - nDet) === off; });
    var pool = X.voicePool({ filter: function (vo, v) { return withMat[v]; }, breadth: breadth, order: ctx.playerSeed || 'p', minN: 4, avoid: ctx.avoidVoices });
    var hit = X.itemVoice(rng, cand, 'any', pool, C.recentOf(ctx));
    if (!hit) throw new Error('echo: no message');
    var it = hit.item, actual = it.facts.length;
    dials.details = Math.max(0, Math.min(3, actual - 2));
    var fx = rate > 1.001 ? [{ type: 'wsola', rate: rate }] : null;
    var c = X.clip(hit.clip), dur = (c.dur || 3) / (rate || 1);
    var part = { clip: hit.clip, at: 0.6, db: 0, role: 'target' };
    if (fx) part.fx = fx;
    var b = X.bed(rng, breadth < 0.4 ? ['cafe'] : ['cafe', 'party', 'babble']);
    var beds = [b ? { kind: b.kind === 'babble' ? 'babble' : 'ambience', bed: b.id, db: -snr } : { kind: 'babble', clips: X.babbleClips(rng, [hit.voice], 6), db: -snr }];
    var audio = { out: { db: -20 }, dur: Math.round((0.6 + dur + 0.8) * 100) / 100, spatial: 'mono', parts: [part], beds: beds, room: null };
    C.remember(ctx, hit.voice, null);
    var nQ = Math.min(3, actual), facts = C.sample(rng, it.facts.filter(function (f) { return cats[f.cat] && cats[f.cat].length >= 4; }), nQ);
    var slots = facts.map(function (f) {
      var others = it.facts.filter(function (g) { return g !== f && g.cat === f.cat; }).map(function (g) { return g.value; });
      var idx = X.idx(), dk = 'echo:dist:' + actual + ':' + f.cat;
      var dist = idx.poolCache[dk] || (idx.poolCache[dk] = C.answerDist(cand.filter(function (m) { return m.facts.length === actual; }), function (m) {
        var g = m.facts.filter(function (x) { return x.cat === f.cat; })[0]; return g ? g.value : undefined; }));
      var sl = C.slot(rng, { label: f.q, answer: f.value, pool: dist.support.length >= 4 ? dist.support : cats[f.cat], draw: dist.draw, neighbours: X.neighbours, avoid: others });
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
      meta: { items: facts.map(function (f) { return f.value; }), voices: [hit.voice], family: null, probe: false, ctxKey: 'echo', cond: 'base',
        offsetDb: c.diff || 0, text: it.text, facts: it.facts }
    };
  }
  I.echo = { make: make, ready: function () { return I.adapt.ready('echo'); } };
})(typeof window !== 'undefined' ? window : globalThis);
