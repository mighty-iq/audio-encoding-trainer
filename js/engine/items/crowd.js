/* Earshot engine — Crowd: follow the call-sign voice among 1–3 others over a background bed; report its word and
   number. Dials: tmr (each other voice at −tmr dB re the target), talkers, similar (other sex → same sex →
   similar pitch → near-twin), space (headphones only: separation of the others from the target). Variety
   (breadth) widens the voice pool, bed kinds, cue types (call sign, voice preview, location) and onset jitter.
   Bet: attention control and voice/spatial cue use against informational masking; masker variety (R3 §1). */
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
    var cand = list.filter(function (w) { return !ex[C.norm(w)] && X.has(v, kind, w); });
    return C.pick(rng, cand);
  }
  function dialVal(ex, id, setting) { var d = E.dialDef(ex, id); var i = setting.dials[id]; return d.values[Math.round(i)]; }

  function make(rng, setting, ctx) {
    ctx = ctx || {};
    var V = (ES.data && ES.data.vocab) || {}, breadth = ctx.breadth !== undefined ? ctx.breadth : 0.3;
    var dials = JSON.parse(JSON.stringify(setting.dials || {}));
    var tmr = dials.tmr !== undefined ? dials.tmr : 6;
    var nMask = dialVal('crowd', 'talkers', { dials: { talkers: dials.talkers || 0 } });
    var simLevel = Math.round(dials.similar || 0);
    var hp = !!ctx.headphones && dials.space !== undefined && dials.space !== null;
    var names = X.pool('name', V.names || [], 2), nouns = X.pool('word', V.nouns || [], 2), nums = X.pool('number', V.numbers || [], 2);
    var pool = X.voicePool({ kinds: ['name', 'word', 'number'], breadth: breadth, order: ctx.playerSeed || 'p', minN: 6, avoid: ctx.avoidVoices });
    if (pool.length < 2) throw new Error('crowd: not enough voices');
    var recent = ctx.recentVoices || [];
    var tPool = pool.filter(function (v) { return recent.indexOf(v) < 0; });
    var target = C.pick(rng, tPool.length ? tPool : pool);
    var tName = wordFor(rng, target, 'name', names), tWord = wordFor(rng, target, 'word', nouns), tNum = wordFor(rng, target, 'number', nums);
    var allVoices = X.voicePool({ kinds: ['name', 'word', 'number'], avoid: ctx.avoidVoices });
    var mk = X.maskers(rng, target, simLevel, nMask, simLevel >= 1 ? allVoices : pool, null, allVoices);
    dials.similar = mk.level;
    var usedN = [tName], usedW = [tWord], usedK = [tNum], talkers = [];
    mk.list.forEach(function (m) {
      var n = wordFor(rng, m.v, 'name', names, usedN), w = wordFor(rng, m.v, 'word', nouns, usedW), k = wordFor(rng, m.v, 'number', nums, usedK);
      if (!n || !w || !k) return;
      usedN.push(n); usedW.push(w); usedK.push(k);
      talkers.push({ v: m.v, fx: m.fx, name: n, word: w, num: k });
    });
    if (talkers.length < nMask) dials.talkers = Math.max(0, talkers.length - 1);
    // cue type: call sign by default; voice preview and location join as variety widens
    var cue = 'callsign';
    if (breadth >= 0.5 && C.chance(rng, 0.2)) cue = 'preview';
    var sep = hp ? dialVal('crowd', 'space', { dials: dials }) : 0;
    if (hp && sep >= 15 && breadth >= 0.4 && C.chance(rng, 0.15)) cue = 'location';
    var meta = X.clip, gap = 0.12, t0 = 0.45, parts = [], targetParts = [];
    if (cue === 'preview') {
      var pv = X.clipFor(target, 'name', tName);
      parts.push({ clip: pv, at: 0.25, db: 0, role: 'cue' });
      t0 = 0.25 + ((meta(pv) && meta(pv).dur) || 0.5) + 0.7;
    }
    var rot = hp && breadth >= 0.5 ? Math.round((rng.next() * 60 - 30)) : 0;
    var tAz = hp ? rot : 0;
    var seqT = C.sequence([X.clipFor(target, 'name', tName), X.clipFor(target, 'word', tWord), X.clipFor(target, 'number', tNum)],
      meta, t0, gap, { db: 0, role: 'target' });
    seqT.parts.forEach(function (p) { if (hp) p.az = tAz; parts.push(p); targetParts.push(JSON.parse(JSON.stringify(p))); });
    var end = seqT.end, jit = Math.min(0.25, 0.25 * breadth);
    talkers.forEach(function (m, i) {
      var start = t0 + (jit ? (rng.next() * 2 - 1) * jit : 0);
      var az = hp ? (rot + (i % 2 ? -1 : 1) * sep * (i === 2 ? 0.5 : 1)) : undefined;
      m.az = az;
      var sq = C.sequence([X.clipFor(m.v, 'name', m.name), X.clipFor(m.v, 'word', m.word), X.clipFor(m.v, 'number', m.num)],
        meta, Math.max(0.15, start), gap, { db: -tmr, role: 'masker' });
      sq.parts.forEach(function (p) { if (m.fx) p.fx = m.fx; if (hp) p.az = az; parts.push(p); });
      end = Math.max(end, sq.end);
    });
    var bedKinds = breadth < 0.3 ? ['babble'] : breadth < 0.6 ? ['babble', 'cafe', 'hum'] : ['babble', 'cafe', 'party', 'hum', 'street'];
    var b = X.bed(rng, bedKinds), beds = [];
    var bedDb = -tmr - 10;
    if (b) beds.push({ kind: b.kind === 'babble' ? 'babble' : 'ambience', bed: b.id, db: bedDb });
    else beds.push({ kind: 'babble', clips: X.babbleClips(rng, [target].concat(talkers.map(function (m) { return m.v; })), 6), db: bedDb });
    var room = null;
    if (breadth >= 0.6 && C.chance(rng, 0.3)) {
      room = X.room(rng, 0.3 + Math.round(rng.next() * 2) / 10, 1.5);
      parts.forEach(function (p) { p.room = true; }); beds.forEach(function (bb) { bb.room = true; });
      targetParts.forEach(function (p) { p.room = true; });
    }
    var audio = { out: { db: -20 }, dur: Math.round((end + 0.6) * 100) / 100, spatial: hp ? 'hrtf' : 'mono', parts: parts, beds: beds, room: room };
    var side = tAz < -10 ? 'on your left' : tAz > 10 ? 'on your right' : 'in front of you';
    var prompt = cue === 'preview' ? 'What did the voice you heard first say next?' : cue === 'location' ? 'What did the voice ' + side + ' say?' : 'What did ' + tName + ' say?';
    var spokenW = talkers.map(function (m) { return m.word; }), spokenK = talkers.map(function (m) { return m.num; });
    var s1 = C.slot(rng, { label: 'Word', answer: tWord, spoken: spokenW, pool: nouns, neighbours: X.neighbours });
    var s2 = C.slot(rng, { label: 'Number', answer: tNum, spoken: spokenK, pool: nums, neighbours: X.neighbours });
    var others = talkers.map(function (m) { return '“' + m.word + ', ' + m.num + '”'; }).join(' and ');
    var offs = targetParts.map(function (p) { var c = meta(p.clip); return (c && c.diff) || 0; });
    var offsetDb = Math.round((offs.reduce(function (a, x) { return a + x; }, 0) / Math.max(1, offs.length)) * 100) / 100;
    var ctxKey = (ctx.learner || E.learner).ctxKey('crowd', hp);
    return {
      id: 'crowd-' + C.seedOf(rng).toString(36), ex: 'crowd', seed: setting.seed || null,
      setting: { dials: dials, focus: setting.focus, anchor: !!setting.anchor, warmup: !!setting.warmup },
      audio: audio,
      question: { prompt: prompt, slots: [s1, s2] },
      feedback: { text: (cue === 'callsign' ? tName : 'Your voice') + ' said “' + tWord + ', ' + tNum + '”. ' + (others ? 'The others said ' + others + '.' : ''),
        replays: [{ label: 'Your voice alone', audio: { out: audio.out, dur: audio.dur, spatial: audio.spatial, parts: targetParts, beds: [], room: room } },
          { label: 'The mix again', audio: audio }] },
      picture: { voices: [{ id: 'v0', role: 'target', az: tAz, dist: 1, label: cue === 'callsign' ? tName : '' }].concat(talkers.map(function (m, i) {
        return { id: 'v' + (i + 1), role: 'other', az: hp ? m.az : 0, dist: 1, label: '' }; })), reveal: cue === 'location' },
      meta: { items: [tName, tWord, tNum], voices: [target].concat(talkers.map(function (m) { return m.v; })), family: null, probe: false,
        cue: cue, ctxKey: ctxKey, cond: hp ? 'hp' : 'base', offsetDb: offsetDb,
        maskers: talkers.map(function (m) { return { voice: m.v, name: m.name, word: m.word, num: m.num, near: !!m.fx }; }) }
    };
  }

  // Listen-only exposure (between sets): the target alone, then in the mix, with its words on screen.
  function exposure(rng, setting, ctx) {
    var t = make(rng, setting, ctx);
    return [{ text: t.feedback.text, audio: t.feedback.replays[0].audio }, { text: t.feedback.text, audio: t.audio }];
  }

  I.crowd = { make: make, exposure: exposure };
})(typeof window !== 'undefined' ? window : globalThis);
