/* Earshot engine — Far: a room cue (the same talker in the same room, ≥ 1 s; room adaptation acts within 1–3 s:
   Brandewie & Zahorik 2010, R3 §10) then an everyday phrase from a distance in a simulated room with room
   noise; report two of its words. Dials: dist (direct-to-reverberant ratio), rt60, noise (speech vs noise at the
   ear). Variety: more voices, more room types, and room switching between trials (switching costs 1–7 points:
   Vlahou 2021), widening with accuracy. Bet: room adaptation trained across many rooms (Vlahou 2019). */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var E = ES.engine, I = E.items, C = I.common, X = I.data;
  var SIZES = ['small', 'medium', 'large', 'hall'];
  var BEDS = { small: ['hum'], medium: ['cafe', 'hum'], large: ['babble', 'station', 'cafe'], hall: ['hall', 'babble', 'station'] };

  function val(id, i) { var d = E.dialDef('far', id); return d.values[Math.max(d.min, Math.min(d.max, Math.round(i)))]; }

  function make(rng, setting, ctx) {
    ctx = ctx || {};
    var V = (ES.data && ES.data.vocab) || {}, breadth = C.breadthOf(setting, ctx);
    var dials = JSON.parse(JSON.stringify(setting.dials || {}));
    var distM = val('dist', dials.dist || 0), rt = val('rt60', dials.rt60 || 0), snr = dials.noise !== undefined ? dials.noise : 20;
    var A = I.adapt, items = A.farItems(), withMat = {};
    A.voicesWith(items).forEach(function (v) { withMat[v] = 1; });
    var answers = X.keyPool('far', items, function (it) { return it.keys.map(function (k) { return it.words[k]; }); });
    var pool = X.voicePool({ filter: function (vo, v) { return withMat[v]; }, breadth: breadth, order: ctx.playerSeed || 'p', minN: 4, avoid: ctx.avoidVoices });
    var idx = X.idx(); idx.poolCache = idx.poolCache || {};
    var ok = idx.poolCache['far:items'] || (idx.poolCache['far:items'] = items.filter(function (it) {
      return it.keys.length >= 2 && it.keys.every(function (k) { return answers.indexOf(C.norm(it.words[k])) >= 0; });
    }));
    var hit = X.itemVoice(rng, ok, 'any', pool, C.recentOf(ctx));
    if (!hit) throw new Error('far: no phrase available');
    // carrier: another sentence by the same voice in the same room
    var carriers = X.kindsOf(hit.voice, 'sentence').concat(X.kindsOf(hit.voice, 'phrase')).filter(function (id) { return id !== hit.clip; });
    var carrier = C.pick(rng, carriers);
    // room: keep the last room unless switching (probability grows with breadth); size follows reverberation
    var sizeIdx = Math.min(3, Math.max(0, Math.floor(dials.rt60 / 2.6)));
    var size = SIZES[sizeIdx];
    if (breadth >= 0.5 && C.chance(rng, 0.4)) size = SIZES[Math.min(3, Math.max(0, sizeIdx + (C.chance(rng, 0.5) ? 1 : -1)))];
    size = X.fitSize(size, distM);
    var last = ctx.lastRoom || C.memo(ctx).lastRoom, room;
    if (last && last.size === size && !C.chance(rng, 0.8 * breadth)) room = { rt60: rt, dist: distM, size: size, seed: last.seed };
    else room = X.room(rng, rt, distM, size);
    size = room.size;
    var meta = X.clip, t = 0.35, parts = [];
    if (carrier) {
      parts.push({ clip: carrier, at: t, db: 0, role: 'cue', room: true });
      t += ((meta(carrier) && meta(carrier).dur) || 1.2) + 0.45;
    }
    var hp = !!ctx.headphones, az = hp && breadth >= 0.4 ? Math.round(rng.next() * 60 - 30) : 0;
    parts.push({ clip: hit.clip, at: Math.round(t * 1000) / 1000, db: 0, role: 'target', room: true, az: az });
    var end = t + ((meta(hit.clip) && meta(hit.clip).dur) || 1.5);
    var b = X.bed(rng, BEDS[size]) || X.bed(rng);
    var beds = b ? [{ kind: 'ambience', bed: b.id, db: -snr }] : [{ kind: 'pink', db: -snr }];
    var audio = { out: { db: -20 }, dur: Math.round((end + 0.7) * 100) / 100, spatial: hp ? 'hrtf' : 'mono', parts: parts, beds: beds, room: room };
    var k1 = hit.item.words[hit.item.keys[0]], k2 = hit.item.words[hit.item.keys[1]];
    var carrierWords = carrier ? (meta(carrier).words || []) : [];
    var avoid1 = [k2].concat(carrierWords), avoid2 = [k1].concat(carrierWords);
    var dist = idx.poolCache['far:dist'] || (idx.poolCache['far:dist'] = [0, 1].map(function (j) {
      return C.answerDist(ok, function (it) { return C.norm(it.words[it.keys[j]]); });
    }));
    var cs = hit.item.kind === 'phrase';
    var s1 = C.slot(rng, { label: cs ? 'Word' : 'First word', answer: k1, pool: dist[0].support, draw: dist[0].draw, neighbours: X.neighbours, avoid: avoid1 });
    var s2 = C.slot(rng, { label: cs ? 'Number' : 'Second word', answer: k2, pool: dist[1].support, draw: dist[1].draw, neighbours: X.neighbours, avoid: avoid2 });
    // a slot needs three or more possible answers in this build; else it is not asked
    var slots = [s1, s2].filter(function (sl, j) { return dist[j].support.length >= 3 && sl.options.length >= 2; });
    if (!slots.length) slots = [s1];
    var near = { out: audio.out, dur: audio.dur, spatial: audio.spatial, beds: [],
      parts: [{ clip: hit.clip, at: 0.3, db: 0, role: 'target' }], room: null };
    near.dur = Math.round((0.3 + ((meta(hit.clip) && meta(hit.clip).dur) || 1.5) + 0.5) * 100) / 100;
    var c = meta(hit.clip);
    C.remember(ctx, hit.voice, room);
    return {
      id: 'far-' + C.seedOf(rng).toString(36), ex: 'far', seed: setting.seed || null,
      setting: { dials: dials, focus: setting.focus, anchor: !!setting.anchor, warmup: !!setting.warmup },
      audio: audio,
      question: { prompt: cs ? 'What did the voice say after the first phrase?' : 'Which words did the voice say after the first sentence?', slots: slots },
      feedback: { text: '“' + hit.item.text + '”, from ' + distM + ' m in a ' + size + ' room (' + rt + ' s echo).',
        replays: [{ label: 'Up close', audio: near }, { label: 'Again from ' + distM + ' m', audio: audio }] },
      picture: { voices: [{ id: 'v0', role: 'target', az: az, dist: distM, label: '' }], room: { size: size, rt60: rt } },
      meta: { items: [k1, k2], voices: [hit.voice], family: null, probe: false, ctxKey: 'far', cond: 'room:' + size,
        room: room, offsetDb: (c && c.diff) || 0, text: hit.item.text }
    };
  }
  function exposure(rng, setting, ctx) {
    var t = make(rng, setting, ctx);
    return [{ text: t.meta.text, audio: t.feedback.replays[0].audio }, { text: t.meta.text, audio: t.audio }];
  }
  I.far = { make: make, exposure: exposure, ready: function () { return I.adapt.ready('far'); } };
})(typeof window !== 'undefined' ? window : globalThis);
