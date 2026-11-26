/* Earshot engine — Seek: drag the listener through a noisy scene to find a faint voice that repeats a word and
   grows clearer up close, then name the word. Played live by ES.audio.live (not rendered offline). Field units
   −1…1 on both axes; the listener starts at the bottom centre. Dials: snr (voice vs bed up close), decoys
   (other voices calling other words), size (how close counts as found), gap (pause between calls). With
   headphones and wider variety the scene adds the head-turn view (turning toward the talker improves the better
   ear). Bet: sound-guided movement (audiomotor loop) and head-turn practice — under-tested (R3 §3, §9).
   audio.live (read by ES.audio.live.scene): bed, target, decoys, found (field units: how close counts as found; the
   locate slot's r), spatial, seed, start, headTurn; `radius` (metres per field unit) is left to the scene's default.
   meta.preview: another clip by the target voice whose words are none of the scene's (relaxed: not its called
   words), so the player knows whom to seek; its words are never options. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var E = ES.engine, I = E.items, C = I.common, X = I.data;

  function val(id, i) { var d = E.dialDef('seek', id); return d.values[Math.max(d.min, Math.min(d.max, Math.round(i)))]; }
  function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
  function place(rng, avoid, minD, startPt) {
    for (var t = 0; t < 200; t++) {
      var p = { x: Math.round((rng.next() * 1.7 - 0.85) * 1000) / 1000, y: Math.round((rng.next() * 1.7 - 0.85) * 1000) / 1000 };
      if (startPt && dist(p, startPt) < 0.7) continue;
      if (avoid.every(function (q) { return dist(p, q) >= minD; })) return p;
    }
    return null;
  }

  function wordsOf(id) { var c = X.clip(id) || {}; return (c.words && c.words.length ? c.words : C.norm(c.text).split(' ')).map(C.norm).filter(Boolean); }
  // Preview clip: same voice, none of the scene's words (target and decoys); relaxed: none of the called words.
  function previewOf(rng, v, scene, called) {
    var bad = {}, hot = {};
    scene.forEach(function (id) { wordsOf(id).forEach(function (w) { bad[w] = 1; }); });
    called.forEach(function (w) { hot[C.norm(w)] = 1; });
    var kinds = ['phrase', 'sentence', 'word'], loose = null;
    for (var i = 0; i < kinds.length; i++) {
      var cand = X.kindsOf(v, kinds[i]).filter(function (id) { return scene.indexOf(id) < 0; });
      var ok = cand.filter(function (id) { return !wordsOf(id).some(function (w) { return bad[w]; }); });
      if (ok.length) return { clip: C.pick(rng, ok), relaxed: false };
      if (!loose) { var lo = cand.filter(function (id) { return !wordsOf(id).some(function (w) { return hot[w]; }); }); if (lo.length) loose = lo; }
    }
    return loose ? { clip: C.pick(rng, loose), relaxed: true } : null;
  }

  function make(rng, setting, ctx) {
    ctx = ctx || {};
    var V = (ES.data && ES.data.vocab) || {}, breadth = C.breadthOf(setting, ctx);
    var dials = JSON.parse(JSON.stringify(setting.dials || {}));
    var snr = dials.snr !== undefined ? dials.snr : 10, nDec = val('decoys', dials.decoys || 0), r = val('size', dials.size || 0), gap = val('gap', dials.gap || 0);
    var A = I.adapt, phrase = A.phraseMode();
    var nouns = phrase ? A.callsign().map(function (p) { return p.word; }).filter(function (w, i, a) { return a.indexOf(w) === i; }) : X.pool('word', V.nouns || [], 2);
    var pool = X.voicePool({ filter: function (vo, v) { return phrase ? A.callsignBy(v).length > 0 : X.kindsOf(v, 'word').length > 0; }, breadth: breadth, order: ctx.playerSeed || 'p', minN: 5, avoid: ctx.avoidVoices });
    var recent = C.recentOf(ctx) || [], tp = pool.filter(function (v) { return recent.indexOf(v) < 0; });
    var tv = C.pick(rng, tp.length ? tp : pool);
    var used = [], start = { x: 0, y: -0.9 };
    var clipOf = {};
    function wordOf(v) {
      if (phrase) {
        var ps = A.callsignBy(v).filter(function (p) { return used.indexOf(p.word) < 0; }), p = C.pick(rng, ps);
        if (!p) return null;
        used.push(p.word); clipOf[v + '|' + p.word] = p.clip; return p.word;
      }
      for (var k = 0; k < 40; k++) { var w = nouns[C.ri(rng, nouns.length)]; if (used.indexOf(C.norm(w)) < 0 && X.has(v, 'word', w)) { used.push(C.norm(w)); clipOf[v + '|' + C.norm(w)] = X.clipFor(v, 'word', w); return w; } }
      return null;
    }
    var tw = wordOf(tv);
    var tpos = place(rng, [], 0, start);
    var target = { clip: clipOf[tv + '|' + C.norm(tw)], x: tpos.x, y: tpos.y, db: snr, gapMs: Math.round(gap * 1000) };
    var others = X.voicePool({ filter: function (vo, v) { return phrase ? A.callsignBy(v).length > 0 : X.kindsOf(v, 'word').length > 0; }, avoid: [tv].concat(ctx.avoidVoices || []) });
    var decoys = [], spots = [tpos], dvs = C.sample(rng, others, nDec);
    dvs.forEach(function (v) {
      var w = wordOf(v), p = place(rng, spots, Math.max(3 * r, 0.45), start);
      if (!w || !p) return;
      spots.push(p);
      decoys.push({ clip: clipOf[v + '|' + C.norm(w)], x: p.x, y: p.y, db: snr - 1, gapMs: Math.round(gap * 1000 * (0.8 + 0.4 * rng.next())), word: w, voice: v });
    });
    if (decoys.length < nDec) dials.decoys = decoys.length;
    C.remember(ctx, tv, null);
    var b = X.bed(rng, breadth < 0.4 ? ['babble'] : ['babble', 'party', 'cafe', 'station']);
    var hp = !!ctx.headphones, relaxed = [];
    var pv = previewOf(rng, tv, [target.clip].concat(decoys.map(function (d) { return d.clip; })), [tw].concat(decoys.map(function (d) { return d.word; })));
    if (!pv) relaxed.push('no preview'); else if (pv.relaxed) relaxed.push('preview shares a name or number');
    var sid = C.seedOf(rng), spatial = hp ? 'hrtf' : 'ild';
    var live = { bed: b ? { kind: b.kind === 'babble' ? 'babble' : 'ambience', bed: b.id, db: 0 } : { kind: 'pink', db: 0 },
      target: target, decoys: decoys.map(function (d) { return { clip: d.clip, x: d.x, y: d.y, db: d.db, gapMs: d.gapMs }; }),
      found: r, spatial: spatial, seed: setting.seed != null ? String(setting.seed) : 'seek-' + sid.toString(36), start: start, headTurn: hp && breadth >= 0.5 };
    var audio = { out: { db: -20 }, spatial: spatial, parts: [], beds: [], room: null, live: live };
    var pc = X.idx().poolCache = X.idx().poolCache || {}, dist = phrase ? pc['seek:dist'] || (pc['seek:dist'] = C.answerDist(A.callsign(), function (p) { return p.word; })) : null;
    var w2 = C.slot(rng, { label: 'Which word was it calling?', answer: tw, spoken: decoys.map(function (d) { return d.word; }), pool: dist ? dist.support : nouns, draw: dist && dist.draw, freq: dist && dist.freq, neighbours: X.neighbours, avoid: pv ? wordsOf(pv.clip) : [] });
    var loc = { label: 'Find the voice', kind: 'locate', answer: { x: tpos.x, y: tpos.y, r: r }, gamma: Math.round(Math.PI * r * r / 4 * 1000) / 1000, options: [], foils: {} };
    return {
      id: 'seek-' + sid.toString(36), ex: 'seek', seed: setting.seed || null,
      setting: { dials: dials, focus: setting.focus, anchor: !!setting.anchor, warmup: !!setting.warmup },
      audio: audio,
      question: { prompt: 'Find the voice that keeps calling one word, then name the word.', slots: [loc, w2] },
      feedback: { text: 'It was calling “' + tw + '”.', replays: [] },
      picture: { voices: [{ id: 'v0', role: 'target', x: tpos.x, y: tpos.y, label: '' }].concat(decoys.map(function (d, i) { return { id: 'v' + (i + 1), role: 'other', x: d.x, y: d.y, label: '' }; })), reveal: false },
      meta: { items: [tw], voices: [tv].concat(decoys.map(function (d) { return d.voice; })), family: null, probe: false, ctxKey: 'seek', cond: hp ? 'hp' : 'base',
        decoyWords: decoys.map(function (d) { return d.word; }), offsetDb: (X.clip(target.clip) || {}).diff || 0,
        preview: pv ? pv.clip : null, relaxed: relaxed }
    };
  }
  I.seek = { make: make, ready: function () { return I.adapt.ready('seek'); } };
})(typeof window !== 'undefined' ? window : globalThis);
