/* Earshot engine — Crowd: follow the call-sign voice among 1–3 others over a background bed; report its word and
   number. Dials: tmr (each other voice at −tmr dB re the target), talkers, similar (other sex → same sex →
   similar pitch → near-twin), space (headphones only: separation of the others from the target). Variety
   (breadth) widens the voice pool, bed kinds, cue types (call sign, voice preview, location) and onset jitter.
   Material: separate name/word/number clips, or whole call-sign phrases ("Daisy, dish, three.") when the build
   has those only (items/adapt.js). Bet: attention control and voice/spatial cue use against informational
   masking; masker variety for generality (R3 §1). */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var E = ES.engine, I = E.items, C = I.common, X = I.data;

  function wordFor(rng, v, kind, list, exclude) {
    var ex = {}; (exclude || []).forEach(function (w) { ex[C.norm(w)] = 1; });
    for (var t = 0; t < 40 && list.length; t++) {
      var w = list[C.ri(rng, list.length)];
      if (!ex[C.norm(w)] && X.has(v, kind, w)) return w;
    }
    return C.pick(rng, list.filter(function (w) { return !ex[C.norm(w)] && X.has(v, kind, w); }));
  }
  function dialVal(id, i) { var d = E.dialDef('crowd', id); return d.values[Math.max(d.min, Math.min(d.max, Math.round(i)))]; }
  function cap(w) { w = String(w || ''); return w.charAt(0).toUpperCase() + w.slice(1); }
  // a phrase of voice v whose name, word and number all differ from those already used
  function phraseFor(rng, v, used, askNum) {
    var ok = I.adapt.callsignBy(v).filter(function (p) { return used.n.indexOf(p.name) < 0 && used.w.indexOf(p.word) < 0 && (!askNum || used.k.indexOf(p.number) < 0); });
    return C.pick(rng, ok);
  }

  function make(rng, setting, ctx) {
    ctx = ctx || {};
    var V = (ES.data && ES.data.vocab) || {}, breadth = C.breadthOf(setting, ctx), A = I.adapt, phrase = A.phraseMode();
    var dials = JSON.parse(JSON.stringify(setting.dials || {}));
    var tmr = typeof dials.tmr === 'number' ? dials.tmr : 6, nMask = dialVal('talkers', dials.talkers || 0), simLevel = Math.round(dials.similar || 0);
    var hp = !!ctx.headphones && dials.space !== undefined && dials.space !== null;
    var has3 = function (v) { return phrase ? A.callsignBy(v).length > 0 : (X.kindsOf(v, 'name').length && X.kindsOf(v, 'word').length && X.kindsOf(v, 'number').length); };
    var pool = X.voicePool({ filter: function (vo, v) { return has3(v); }, breadth: breadth, order: ctx.playerSeed || 'p', minN: phrase ? 4 : 6, avoid: ctx.avoidVoices });
    if (pool.length < 2) throw new Error('crowd: not enough voices');
    var recent = C.recentOf(ctx), tPool = pool.filter(function (v) { return recent.indexOf(v) < 0; });
    var target = C.pick(rng, tPool.length ? tPool : pool);
    var allVoices = X.voicePool({ filter: function (vo, v) { return has3(v); }, avoid: ctx.avoidVoices });
    var names = X.pool('name', V.names || [], 2), nouns = X.pool('word', V.nouns || [], 2), nums = X.pool('number', V.numbers || [], 2);
    var pc = X.idx().poolCache = X.idx().poolCache || {};
    var dist = phrase ? pc['crowd:dist'] || (pc['crowd:dist'] = [C.answerDist(A.callsign(), function (p) { return p.word; }), C.answerDist(A.callsign(), function (p) { return p.number; })]) : null;
    // a slot is asked only when this build has at least three different answers for it
    var askNum = !dist || dist[1].support.length >= 3;
    var used = { n: [], w: [], k: [] }, tal = [], T;
    if (phrase) {
      var tp = C.pick(rng, A.callsignBy(target));
      T = { v: target, name: tp.name, word: tp.word, num: tp.number, clips: [tp.clip], text: tp.text };
    } else {
      var tn = wordFor(rng, target, 'name', names), tw = wordFor(rng, target, 'word', nouns), tk = wordFor(rng, target, 'number', nums);
      T = { v: target, name: tn, word: tw, num: tk, clips: [X.clipFor(target, 'name', tn), X.clipFor(target, 'word', tw), X.clipFor(target, 'number', tk)], text: cap(tn) + ', ' + tw + ', ' + tk + '.' };
    }
    used.n.push(T.name); used.w.push(T.word); used.k.push(T.num);
    var mk = X.maskers(rng, target, simLevel, nMask, simLevel >= 1 ? allVoices : pool, null, allVoices);
    dials.similar = mk.level;
    var twinLost = false, tv0 = X.voice(target);
    mk.list.forEach(function (m) {
      var e;
      if (phrase) {
        var taken = tal.some(function (t) { return t.v === m.v && !t.fx && !m.fx; });
        var p = taken ? null : phraseFor(rng, m.v, used, askNum), mv = m.v, fx = m.fx;
        if (!p) {
          // another voice of the same kind (same sex from level 1 up, other sex at level 0)
          if (fx) twinLost = true;
          var alt = C.shuffle(rng, allVoices.filter(function (v) { return v !== target && !tal.some(function (t) { return t.v === v; }) && !mk.list.some(function (o) { return o.v === v && o !== m; }) && ((X.voice(v).sex === tv0.sex) === (mk.level >= 1)); }));
          for (var q = 0; q < alt.length && !p; q++) { p = phraseFor(rng, alt[q], used, askNum); if (p) { mv = alt[q]; fx = null; } }
          if (!p) return;
        }
        e = { v: mv, fx: fx, name: p.name, word: p.word, num: p.number, clips: [p.clip] };
      }
      else {
        var n = wordFor(rng, m.v, 'name', names, used.n), w = wordFor(rng, m.v, 'word', nouns, used.w), k = wordFor(rng, m.v, 'number', nums, used.k);
        if (!n || !w || !k) return;
        e = { v: m.v, fx: m.fx, name: n, word: w, num: k, clips: [X.clipFor(m.v, 'name', n), X.clipFor(m.v, 'word', w), X.clipFor(m.v, 'number', k)] };
      }
      used.n.push(e.name); used.w.push(e.word); used.k.push(e.num); tal.push(e);
    });
    if (twinLost && !tal.some(function (t) { return t.v === target; })) dials.similar = Math.min(dials.similar, 2);
    if (!tal.length) throw new Error('crowd: no masker phrase available');
    if (tal.length < nMask) dials.talkers = Math.max(0, tal.length - 1);
    var sep = hp ? dialVal('space', dials.space) : 0, cue = 'callsign';
    if (breadth >= 0.5 && C.chance(rng, 0.2)) cue = 'preview';
    if (hp && sep >= 15 && breadth >= 0.4 && C.chance(rng, 0.15)) cue = 'location';
    var meta = X.clip, gap = 0.12, t0 = 0.45, parts = [], targetParts = [];
    if (cue === 'preview') {
      var pv = phrase ? (C.pick(rng, A.callsignBy(target).filter(function (p) { return p.clip !== T.clips[0]; })) || {}).clip : X.clipFor(target, 'name', T.name);
      if (pv) { parts.push({ clip: pv, at: 0.25, db: 0, role: 'cue' }); t0 = 0.25 + ((meta(pv) && meta(pv).dur) || 0.5) + 0.7; } else cue = 'callsign';
    }
    var rot = hp && breadth >= 0.5 ? Math.round(rng.next() * 60 - 30) : 0, tAz = hp ? rot : 0;
    var seqT = C.sequence(T.clips, meta, t0, gap, { db: 0, role: 'target' });
    seqT.parts.forEach(function (p) { if (hp) p.az = tAz; parts.push(p); targetParts.push(JSON.parse(JSON.stringify(p))); });
    var end = seqT.end, jit = Math.min(0.25, 0.25 * breadth);
    tal.forEach(function (m, i) {
      var start = t0 + (jit ? (rng.next() * 2 - 1) * jit : 0), az = hp ? (rot + (i % 2 ? -1 : 1) * sep * (i === 2 ? 0.5 : 1)) : undefined;
      m.az = az;
      var sq = C.sequence(m.clips, meta, Math.max(0.15, start), gap, { db: -tmr, role: 'masker' });
      sq.parts.forEach(function (p) { if (m.fx) p.fx = m.fx; if (hp) p.az = az; parts.push(p); });
      end = Math.max(end, sq.end);
    });
    var b = X.bed(rng, breadth < 0.3 ? ['babble'] : breadth < 0.6 ? ['babble', 'cafe', 'hum'] : ['babble', 'cafe', 'party', 'hum', 'street']), bedDb = -tmr - 10;
    var bab = b ? null : X.babbleClips(rng, [target].concat(tal.map(function (m) { return m.v; })), 6);
    var beds = [b ? { kind: b.kind === 'babble' ? 'babble' : 'ambience', bed: b.id, db: bedDb } : bab.length ? { kind: 'babble', clips: bab, db: bedDb } : { kind: 'ssn', db: bedDb }];
    var room = null;
    if (breadth >= 0.6 && C.chance(rng, 0.3)) {
      room = X.room(rng, 0.3 + Math.round(rng.next() * 2) / 10, 1.5);
      parts.forEach(function (p) { p.room = true; }); beds.forEach(function (bb) { bb.room = true; }); targetParts.forEach(function (p) { p.room = true; });
    }
    var audio = { out: { db: -20 }, dur: Math.round((end + 0.6) * 100) / 100, spatial: hp ? 'hrtf' : 'mono', parts: parts, beds: beds, room: room };
    var side = tAz < -10 ? 'on your left' : tAz > 10 ? 'on your right' : 'in front of you', CS = cap(T.name);
    var prompt = cue === 'preview' ? 'What did the voice you heard first say next?' : cue === 'location' ? 'What did the voice ' + side + ' say?' : 'What did ' + CS + ' say?';
    var s1 = C.slot(rng, { label: 'Word', answer: T.word, spoken: tal.map(function (m) { return m.word; }), pool: dist ? dist[0].support : nouns, draw: dist && dist[0].draw, neighbours: X.neighbours });
    var s2 = C.slot(rng, { label: 'Number', answer: T.num, spoken: tal.map(function (m) { return m.num; }), pool: dist ? dist[1].support : nums, draw: dist && dist[1].draw, neighbours: X.neighbours });
    var others = tal.map(function (m) { return '“' + m.word + ', ' + m.num + '”'; }).join(' and '), said = { v0: [T.name, T.word, T.num] };
    tal.forEach(function (m, i) { said['v' + (i + 1)] = [m.name, m.word, m.num]; });
    var offs = targetParts.map(function (p) { var c = meta(p.clip); return (c && c.diff) || 0; });
    var offsetDb = Math.round((offs.reduce(function (a, x) { return a + x; }, 0) / Math.max(1, offs.length)) * 100) / 100;
    C.remember(ctx, target, null);
    var ctxKey = E.lrOf(ctx.learner).ctxKey('crowd', hp);
    return {
      id: 'crowd-' + C.seedOf(rng).toString(36), ex: 'crowd', seed: setting.seed || null,
      setting: { dials: dials, focus: setting.focus, anchor: !!setting.anchor, warmup: !!setting.warmup },
      audio: audio,
      question: { prompt: prompt, slots: askNum ? [s1, s2] : [s1] },
      feedback: { text: (cue === 'callsign' ? CS : 'Your voice') + ' said “' + T.word + ', ' + T.num + '”. ' + (others ? 'The others said ' + others + '.' : ''),
        replays: [{ label: 'Your voice alone', audio: { out: audio.out, dur: audio.dur, spatial: audio.spatial, parts: targetParts, beds: [], room: room } },
          { label: 'The mix again', audio: audio }] },
      picture: { voices: [{ id: 'v0', role: 'target', az: tAz, dist: 1, label: cue === 'callsign' ? CS : '' }].concat(tal.map(function (m, i) {
        return { id: 'v' + (i + 1), role: 'other', az: hp ? m.az : 0, dist: 1, label: '' }; })), reveal: cue === 'location' },
      meta: { items: [T.name, T.word, T.num], voices: [target].concat(tal.map(function (m) { return m.v; })), family: null, probe: false,
        cue: cue, ctxKey: ctxKey, cond: hp ? 'hp' : 'base', offsetDb: offsetDb, text: T.text, callSign: CS, said: said, phrase: phrase,
        maskers: tal.map(function (m) { return { voice: m.v, name: m.name, word: m.word, num: m.num, near: !!m.fx }; }) }
    };
  }

  // Listen-only exposure (between sets): the target alone, then in the mix, with its words on screen.
  function exposure(rng, setting, ctx) {
    var t = make(rng, setting, ctx);
    return [{ text: t.feedback.text, audio: t.feedback.replays[0].audio }, { text: t.feedback.text, audio: t.audio }];
  }
  I.crowd = { make: make, exposure: exposure, ready: function () { return I.adapt.ready('crowd'); } };
})(typeof window !== 'undefined' ? window : globalThis);
