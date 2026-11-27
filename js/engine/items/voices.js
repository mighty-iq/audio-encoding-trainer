/* Earshot engine — Voices: meet a cast of named voices, then tell who is talking (quiet → noise), and find a
   known voice in a crowd ("What did Maya say?"). Voice familiarity builds in 10–60 minutes (Holmes 2021, R3 §7).
   Dials: cast (how many voices to choose from; guess rate 1/cast), similar (mixed → same sex → similar pitch),
   snr (babble), length (sentence → few words → one word). Tasks: 'meet' (introduces a new cast member; does not
   move thresholds), 'who' (main), 'find' (joins as variety widens). ctx.met lists met voice ids; without it the
   learner's own record of met voices is used. Recordings of people the player knows stay in js/ex (never here). */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var E = ES.engine, I = E.items, C = I.common, X = I.data;

  function val(id, i) { var d = E.dialDef('voices', id); return d.values[Math.max(d.min, Math.min(d.max, Math.round(i)))]; }
  function castVoices() {
    var idx = X.idx(); idx.poolCache = idx.poolCache || {};
    if (idx.poolCache['voices:cast']) return idx.poolCache['voices:cast'];
    var out = idx.voices.filter(function (v) { var vo = idx.vdat[v]; return vo.cast && vo.cast.name && I.adapt.anyClips(v); });
    idx.poolCache['voices:cast'] = out;
    return out;
  }
  function nameOf(v) { var vo = X.voice(v), n = vo && vo.cast ? vo.cast.name : v; return n.charAt(0).toUpperCase() + n.slice(1); }
  function similarTo(t, v) {
    var a = X.voice(t), b = X.voice(v), s = X.semis(a.f0, b.f0);
    return a.sex === b.sex && s !== null && Math.abs(s) < 2;
  }
  function choose(rng, target, pool, k, lvl) {
    var tv = X.voice(target), cand = pool.filter(function (v) { return v !== target; });
    if (lvl >= 1) {
      var same = cand.filter(function (v) { return X.voice(v).sex === tv.sex; });
      if (lvl >= 2) same.sort(function (a, b) { return Math.abs(X.semis(X.voice(a).f0, tv.f0) || 0) - Math.abs(X.semis(X.voice(b).f0, tv.f0) || 0); });
      if (same.length >= k - 1) return { list: lvl >= 2 ? C.shuffle(rng, same.slice(0, k - 1)) : C.sample(rng, same, k - 1), level: lvl };
      if (lvl >= 2 && same.length) return { list: same.concat(C.sample(rng, cand.filter(function (v) { return same.indexOf(v) < 0; }), k - 1 - same.length)), level: 0 };
    }
    return { list: C.sample(rng, cand, k - 1), level: 0 };
  }
  function utterance(rng, v, len, nouns) {
    var words = X.kindsOf(v, 'word'), sents = X.kindsOf(v, 'sentence').concat(X.kindsOf(v, 'phrase'));
    if (len === 'word' && words.length) return [C.pick(rng, words)];
    if (len === 'phrase' && words.length >= 2) return C.sample(rng, words, 2);
    if (sents.length) return [C.pick(rng, sents)];
    return [C.pick(rng, words.length ? words : X.kindsOf(v, 'intro'))];
  }

  function make(rng, setting, ctx) {
    ctx = ctx || {};
    var V = (ES.data && ES.data.vocab) || {}, breadth = C.breadthOf(setting, ctx);
    var dials = JSON.parse(JSON.stringify(setting.dials || {}));
    var k = val('cast', dials.cast || 0), lvl = Math.round(dials.similar || 0), snr = dials.snr !== undefined ? dials.snr : 30, len = val('length', dials.length || 0);
    var cast = castVoices(), lr = E.lrOf(ctx.learner);
    var met = (ctx.met || Object.keys((lr.state && lr.state.cast) || {})).filter(function (v) { return cast.indexOf(v) >= 0; });
    var meta = X.clip, nouns = X.pool('word', V.nouns || [], 2), A = I.adapt, phr = A.phraseMode();
    // a 'find' friend needs a call-sign phrase (or a word clip of the noun pool): never a find trial without one (M2)
    function wordsOf(v) { return nouns.filter(function (w) { return X.has(v, 'word', w); }); }
    function findable(v) { return phr ? A.callsignBy(v).length > 0 : wordsOf(v).length > 0; }
    var allMet = cast.length > 0 && cast.every(function (v) { return met.indexOf(v) >= 0; });
    var task = ctx.task || (met.length < Math.max(2, k) && !allMet ? 'meet' : breadth >= 0.4 && C.chance(rng, 0.25) ? 'find' : 'who');
    // ladder (meta.relaxed): 'who' needs two met voices, else 'find' (all met, one findable) or 'meet'; 'find' needs a
    // met voice that has a phrase, else 'who' (two met) or 'meet'; 'meet' with a one-voice cast uses stand-in names
    var relaxed = [], canWho = met.length >= 2, canFind = met.some(findable);
    if (task === 'who' && !canWho) { task = canFind && allMet ? 'find' : 'meet'; relaxed.push('who → ' + task); }
    if (task === 'find' && !canFind) { task = canWho ? 'who' : 'meet'; relaxed.push('find → ' + task); }
    var parts = [], beds = [], slots, target, prompt, fb, others = [], setOut = { dials: dials, focus: setting.focus, anchor: !!setting.anchor, warmup: !!setting.warmup };
    if (task === 'meet') {
      var order = C.shuffle(ES.core.rng('cast:' + (ctx.playerSeed || 'p')), cast);
      target = order.filter(function (v) { return met.indexOf(v) < 0; })[0] || C.pick(rng, cast);
      var intro = X.kindsOf(target, 'intro'), clip0 = intro.length ? intro[0] : utterance(rng, target, 'sentence', nouns)[0];
      parts.push({ clip: clip0, at: 0.3, db: 0, role: 'target' });
      var namesPool = cast.map(nameOf);
      if (namesPool.length < 2) {
        namesPool = namesPool.concat((V.names || []).map(function (n) { return n.charAt(0).toUpperCase() + n.slice(1); }).filter(function (n) { return C.norm(n) !== C.norm(nameOf(target)); }).slice(0, 3));
        relaxed.push('meet with stand-in names');
      }
      slots = [C.slot(rng, { label: 'Who was that?', answer: nameOf(target), pool: namesPool, neighbours: function () { return []; } })];
      prompt = 'Meet a new voice.';
      fb = 'That was ' + nameOf(target) + '. You will hear this voice again.';
      setOut.noUpdate = true;
    } else if (task === 'who') {
      var recent = C.recentOf(ctx) || [], tp = met.filter(function (v) { return recent.indexOf(v) < 0; });
      target = C.pick(rng, tp.length ? tp : met);
      var ch = choose(rng, target, met, Math.min(k, met.length), lvl);
      others = ch.list; dials.similar = Math.min(lvl, ch.level === 0 && lvl > 0 ? 0 : lvl);
      dials.cast = Math.max(0, Math.min(4, others.length + 1 - 2));
      var seq = C.sequence(utterance(rng, target, len, nouns), meta, 0.35, 0.15, { db: 0, role: 'target' });
      parts = seq.parts;
      var opts = [target].concat(others), foils = {};
      // 'similar': a voice close to the talker's (same sex, < 2 semitones apart), not a sound-alike word
      others.forEach(function (v) { foils[nameOf(v)] = similarTo(target, v) ? 'similar' : 'random'; });
      slots = [{ label: 'Who is talking?', options: C.shuffle(rng, opts.map(nameOf)), answer: nameOf(target), foils: foils }];
      prompt = 'Who is talking?';
      fb = 'That was ' + nameOf(target) + '.';
    } else {
      target = C.pick(rng, met.filter(findable));
      var nOther = Math.max(1, Math.min(3, k - 1)), used = [];
      var tw = null, tclip = null;
      if (phr) { var tp = C.pick(rng, A.callsignBy(target)); tw = tp.word; tclip = tp.clip; }
      else { tw = C.pick(rng, wordsOf(target)); tclip = X.clipFor(target, 'word', tw); }
      used.push(C.norm(tw));
      parts.push({ clip: tclip, at: 0.4, db: 0, role: 'target' });
      // the crowd from the other met voices first, so their words follow the answer mix of the foils (review ST-03)
      var crowdAll = X.voicePool({ filter: function (vo, v) { return phr ? A.callsignBy(v).length > 0 : X.kindsOf(v, 'word').length > 0; }, avoid: [target] });
      var crowd = C.sample(rng, met.filter(function (v) { return v !== target && findable(v); }), nOther), spoken = [];
      if (crowd.length < nOther) crowd = crowd.concat(C.sample(rng, crowdAll.filter(function (v) { return crowd.indexOf(v) < 0; }), nOther - crowd.length));
      crowd.forEach(function (v) {
        if (phr) {
          var cp = C.pick(rng, A.callsignBy(v).filter(function (p) { return used.indexOf(p.word) < 0; }));
          if (cp) { used.push(cp.word); spoken.push(cp.word); parts.push({ clip: cp.clip, at: 0.4 + rng.next() * 0.1, db: -snr, role: 'masker' }); others.push(v); }
          return;
        }
        for (var b2 = 0; b2 < 40; b2++) {
          var w2 = nouns[C.ri(rng, nouns.length)];
          if (used.indexOf(C.norm(w2)) < 0 && X.has(v, 'word', w2)) { used.push(C.norm(w2)); spoken.push(w2); parts.push({ clip: X.clipFor(v, 'word', w2), at: 0.4 + rng.next() * 0.1, db: -snr, role: 'masker' }); others.push(v); break; }
        }
      });
      // foils follow the words reachable from the friends that can be asked about (review ST-03)
      var csAll = phr ? A.callsign() : null, dv = phr ? X.slotDist('voices:w', X.reach('voices:cs', csAll, met.filter(findable), function (p) { return [p.clip]; }), csAll, function (p) { return p.word; }) : null;
      slots = [C.slot(rng, { label: 'What did ' + nameOf(target) + ' say?', answer: tw, spoken: spoken, pool: dv ? dv.support : nouns, draw: dv && dv.draw, freq: dv && dv.freq, neighbours: X.neighbours })];
      prompt = 'Find ' + nameOf(target) + ' in the crowd.';
      fb = nameOf(target) + ' said “' + tw + '”.';
    }
    if ((task === 'who' || (task === 'find' && !others.length)) && snr < 30) {
      beds.push(X.bedSpec(rng, ['babble', 'cafe'], { avoid: [target].concat(others), talkers: X.bedTalkers(rng, breadth), db: -snr }) || { kind: 'pink', db: -snr });
    }
    C.remember(ctx, target, null);
    var end = 0.5;
    parts.forEach(function (p) { end = Math.max(end, p.at + ((meta(p.clip) && meta(p.clip).dur) || 0.6)); });
    var audio = { out: { db: -20 }, dur: Math.round((end + 0.5) * 100) / 100, spatial: 'mono', parts: parts, beds: beds, room: null };
    var tparts = parts.filter(function (p) { return p.role === 'target'; });
    return {
      id: 'voices-' + C.seedOf(rng).toString(36), ex: 'voices', seed: setting.seed || null,
      setting: setOut, audio: audio,
      question: { prompt: prompt, slots: slots },
      feedback: { text: fb, replays: task === 'meet' ? [] : [{ label: nameOf(target) + ' alone', audio: { out: audio.out, dur: audio.dur, spatial: 'mono', parts: tparts, beds: [], room: null } }] },
      picture: { voices: [{ id: 'v0', role: 'target', az: 0, dist: 1, label: task === 'who' ? '' : nameOf(target) }] },
      meta: { items: [slots[0].answer], voices: [target].concat(others), family: null, probe: false, ctxKey: 'voices', cond: task, task: task,
        cast: [target].concat(task === 'who' ? others : []), newVoice: task === 'meet' ? target : null, offsetDb: 0, relaxed: relaxed }
    };
  }
  I.voices = { make: make, cast: castVoices, nameOf: nameOf, ready: function () { return I.adapt.ready('voices'); } };
})(typeof window !== 'undefined' ? window : globalThis);
