/* Earshot engine — Repair: a sentence in which one word is lost under a noise burst or a gap, while the rest of
   the sentence may be broken up by periodic gating; choose the lost word. Dials: gap (share of the word lost),
   context (sentence predictability), gate (how much of the sentence survives), fill (noise-filled gaps help
   restoration; silence is hardest: Benard & Başkent 2013). Variety: early or late lost words (context after or
   before the gap). Feedback: the whole sentence, then the broken one again with its words.
   Bet: a general strategy (hold the sentence, then repair it) plus dip listening (R3 §4, §6). */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var E = ES.engine, I = E.items, C = I.common, X = I.data;

  function val(id, i) { var d = E.dialDef('repair', id); return d.values[Math.max(d.min, Math.min(d.max, Math.round(i)))]; }
  var PRED = ['hi', 'mid', 'lo'];

  function make(rng, setting, ctx) {
    ctx = ctx || {};
    var V = (ES.data && ES.data.vocab) || {}, breadth = C.breadthOf(setting, ctx);
    var dials = JSON.parse(JSON.stringify(setting.dials || {}));
    var g = val('gap', dials.gap || 0), pred = val('context', dials.context || 0), gate = val('gate', dials.gate || 0), fill = val('fill', dials.fill || 0);
    // Relaxation (meta.relaxed): (1) all voices with material; (2) the build's call-sign phrases with word times,
    // losing their word (little context: recorded as context level 'lo').
    var A = I.adapt, all = A.repairItems().filter(function (it) { return it.key >= 0 && it.words && it.words[it.key]; }), withMat = {}, relaxed = [];
    var timed = function (list) { return list.filter(function (it) { return A.clipsOf(it).some(function (id) { var c = X.clip(id); return c.wt && c.wt[it.key]; }); }); };
    if (!timed(all).length) {
      all = A.fallbackItems().map(function (it) { return { id: it.id, text: it.text, words: it.words, key: it.keys[0], pred: 'lo', alts: [], foils: null, kind: it.kind }; });
      relaxed.push('call-sign phrases');
    }
    A.voicesWith(all).forEach(function (v) { withMat[v] = 1; });
    var answers = X.keyPool('repair', all, function (it) { return [it.words[it.key]].concat(it.alts || []); });
    var pool = X.voicePool({ filter: function (vo, v) { return withMat[v]; }, breadth: breadth, order: ctx.playerSeed || 'p', minN: 4, avoid: ctx.avoidVoices });
    var want = PRED.indexOf(pred), cand = [];
    for (var off = 0; off < 3 && !cand.length; off++) {
      cand = all.filter(function (it) { return Math.abs(PRED.indexOf(it.pred) - want) === off; });
      // low variety: lost word near the end (context before it); later both positions
      if (breadth < 0.4) { var late = cand.filter(function (it) { return it.key >= it.words.length / 2; }); if (late.length) cand = late; }
    }
    var withTimes = cand.filter(function (it) { return true; });
    var hit = null, tries = 0;
    while (!hit && tries++ < 6) {
      var h = X.itemVoice(rng, withTimes, 'any', pool, C.recentOf(ctx));
      if (h && X.clip(h.clip).wt && X.clip(h.clip).wt[h.item.key]) hit = h;
      else if (h) withTimes = withTimes.filter(function (it) { return it !== h.item; });
      if (!withTimes.length) break;
    }
    if (!hit) { var hb = X.itemVoice(rng, timed(cand.length ? cand : all), 'any', Object.keys(withMat), []); if (hb && X.clip(hb.clip).wt && X.clip(hb.clip).wt[hb.item.key]) { hit = hb; relaxed.push('all voices'); } }
    if (!hit) throw new Error('repair: no timed speech in this build');
    dials.context = PRED.indexOf(hit.item.pred) >= 0 ? PRED.indexOf(hit.item.pred) : dials.context;
    var c = X.clip(hit.clip), wt = c.wt[hit.item.key], w0 = wt[0], w1 = wt[1], lost = (w1 - w0) * g;
    var t0 = w0 + (w1 - w0 - lost) / 2, t1 = t0 + lost;
    var fx = [{ type: 'mask', t0: Math.round(t0 * 1000) / 1000, t1: Math.round(t1 * 1000) / 1000, fill: fill.fill, db: fill.db !== undefined ? fill.db : null }];
    if (gate.rate > 0) fx.push({ type: 'gate', rateHz: gate.rate, duty: gate.duty, fill: fill.fill === 'noise' ? 'noise' : 'silence' });
    var part = { clip: hit.clip, at: 0.35, db: 0, role: 'target', fx: fx };
    var audio = { out: { db: -20 }, dur: Math.round((0.35 + (c.dur || 2) + 0.5) * 100) / 100, spatial: 'mono', parts: [part], beds: [], room: null };
    var clear = { out: audio.out, dur: audio.dur, spatial: 'mono', parts: [{ clip: hit.clip, at: 0.35, db: 0, role: 'target' }], beds: [], room: null };
    // foils follow the answers of the same candidate list the item came from (same level, same variety filter)
    var key = hit.item.words[hit.item.key], lvlItems = cand.filter(function (it) { return it.pred === hit.item.pred; });
    var idx = X.idx(); idx.poolCache = idx.poolCache || {};
    var dk = 'repair:dist:' + hit.item.pred + ':' + (breadth < 0.4 ? 'late' : 'any') + ':' + lvlItems.length;
    var dist = idx.poolCache[dk] || (idx.poolCache[dk] = C.answerDist(lvlItems, function (it) { return C.norm(it.words[it.key]); }));
    var s1 = C.slot(rng, { label: 'Lost word', answer: key, pool: hit.item.foils ? dist.support.concat(hit.item.foils) : dist.support, draw: dist.draw, freq: dist.freq, neighbours: X.neighbours, context: hit.item.alts || [], prefer: hit.item.foils || null,
      avoid: hit.item.words.filter(function (w, i) { return i !== hit.item.key; }) });
    C.remember(ctx, hit.voice, null);
    var shown = hit.item.words.map(function (w, i) { return i === hit.item.key ? '[' + w + ']' : w; }).join(' ');
    return {
      id: 'repair-' + C.seedOf(rng).toString(36), ex: 'repair', seed: setting.seed || null,
      setting: { dials: dials, focus: setting.focus, anchor: !!setting.anchor, warmup: !!setting.warmup },
      audio: audio,
      question: { prompt: 'Which word was lost?', slots: [s1] },
      feedback: { text: shown, replays: [{ label: 'The whole sentence', audio: clear }, { label: 'Again with the gap', audio: audio, showText: true }] },
      picture: { voices: [{ id: 'v0', role: 'target', az: 0, dist: 1, label: '' }] },
      meta: { items: [key], voices: [hit.voice], family: null, probe: false, ctxKey: 'repair', cond: 'base', pred: hit.item.pred, key: hit.item.key, relaxed: relaxed,
        ctx: hit.item.key >= hit.item.words.length / 2 ? 'before' : 'after',
        keyPos: hit.item.key / Math.max(1, hit.item.words.length - 1), offsetDb: c.diff || 0, text: hit.item.text }
    };
  }
  function exposure(rng, setting, ctx) {
    var t = make(rng, setting, ctx);
    return [{ text: t.meta.text, audio: t.feedback.replays[0].audio }, { text: t.meta.text, audio: t.audio }];
  }
  I.repair = { make: make, exposure: exposure, ready: function () { return I.adapt.ready('repair'); } };
})(typeof window !== 'undefined' ? window : globalThis);
