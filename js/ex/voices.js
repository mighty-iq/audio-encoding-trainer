/* Earshot — Voices (exercise view; CONTRACTS §11). Meet a cast of named voices, then tell who is talking (quiet →
   noise) and find a voice you know in a crowd. The shell's Play screen runs it from the engine's TrialSpecs
   (js/engine/items/voices.js: tasks 'meet', 'who', 'find'); this module supplies the copy, the tutorial (meet,
   meet, who), strategy cards and the presentation hooks:
   - meet: the name and what the voice does on screen, up to three clips of the voice (more listening, more
     familiarity: R3 §7), "tap the name"; the trial never moves a threshold (engine: setting.noUpdate).
   - who: after a miss, a pitch comparison from the stimulus data and the two voices one after the other (every
     option's voice is a replay; the first two are buttons, review() picks the auto ones).
   - find: the crowd drawn around the voice you know; a word from another voice is named as such.
   Voices from the player's life live in js/ex/voices-own.js (screen 'voices-own'). Helpers: ES.ex._kit. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.ex = ES.ex || {};
  function K() { return ES.ex._kit; }
  function X() { return ES.engine && ES.engine.items && ES.engine.items.data; }

  var M = {
    id: 'voices', name: 'Voices',
    short: 'Get to know a cast of voices, then pick one out by ear.',
    card: { trains: 'Get to know a cast of voices, then pick your friend out of a crowd. Option: record people you know (stays on your phone).',
      bet: 'fast voice familiarity, trained on voices from your own life' },
    bet: 'Fast voice familiarity: getting to know new voices quickly, and getting quicker at it, practised on a cast and on voices from your own life.',
    betNew: true,
    view: 'keyword', feedback: 'standard',
    strategies: ['voices.cues', 'voices.ten', 'voices.follow'],
    tips: [
      'Each new voice introduces itself first. Listen to how it sounds, not only to what it says: pitch, pace, the size of the voice.',
      'After a miss you hear the right voice, then the one you picked. Side by side is how two voices come apart.',
      'A voice you know is easier to follow in a crowd. In one study about ten minutes of practice telling voices apart already made a new voice easier to follow.'
    ],
    helpData: function () {
      return {
        goal: 'Meet a cast of voices, each with a name. Then hear a voice and tap who is talking, first in quiet, later in noise. Sometimes you find a voice you know in a crowd and tap what it said.',
        dials: {
          cast: 'How many voices you choose from.',
          similar: 'How alike those voices are, from mixed to the same sex with a similar pitch.',
          snr: 'How loud the voice is against the noise around it. 30 dB is close to quiet.',
          length: 'How much of the voice you hear: a sentence, a few words or one word.'
        },
        why: 'Familiar voices are easier to follow: in one study a familiar voice raised scores by about 10 points against a competing talker, and about ten minutes of practice telling voices apart already gave a measurable benefit. Voices bets that meeting many new voices also makes you quicker at learning the next one. Nobody has tested that yet; your check-ins help find out.'
      };
    }
  };

  /* ---- voices and names ---- */
  function vdat(v) { var D = ES.data && ES.data.voices; return (D && D[v]) || null; }
  function nameOf(v) {
    var G = ES.engine && ES.engine.items && ES.engine.items.voices;
    if (G && typeof G.nameOf === 'function') { try { return G.nameOf(v); } catch (e) { /* fall through */ } }
    var d = vdat(v), n = d && d.cast && d.cast.name ? d.cast.name : String(v);
    return n.charAt(0).toUpperCase() + n.slice(1);
  }
  function blurbOf(v) { var d = vdat(v); return d && d.cast && d.cast.blurb ? String(d.cast.blurb) : ''; }
  function f0Of(v) { var d = vdat(v); return d && typeof d.f0 === 'number' ? d.f0 : null; }
  function hz(f) { return 'about ' + Math.round(f / 5) * 5 + ' Hz'; }
  function clipMeta(id) { var m = ES.data && ES.data.manifest && ES.data.manifest.clips; return (m && m[id]) || null; }
  function durOf(id) { var c = clipMeta(id); return c && c.dur ? c.dur : 1.5; }
  function taskOf(t) { return (t.meta && t.meta.task) || 'who'; }
  function targetOf(t) { var m = t.meta || {}; return m.newVoice || (m.voices && m.voices[0]) || null; }
  /** A clip by voice v of the same kind as `like` (else any speech clip), never one in `not`. */
  function clipBy(v, like, not, rng) {
    var x = X();
    if (!x) return null;
    var kinds = [], k0 = clipMeta(like) && clipMeta(like).kind;
    if (k0) kinds.push(k0);
    ['sentence', 'phrase', 'intro', 'word'].forEach(function (k) { if (kinds.indexOf(k) < 0) kinds.push(k); });
    for (var i = 0; i < kinds.length; i++) {
      var ids = (x.kindsOf(v, kinds[i]) || []).filter(function (c) { return (not || []).indexOf(c) < 0; });
      if (ids.length) return ids[rng ? rng.int(0, ids.length - 1) : 0];
    }
    return null;
  }
  function solo(t, clip, label) {
    return { label: label, audio: { out: (t.audio && t.audio.out) || { db: -20 }, dur: Math.round((durOf(clip) + 0.5) * 100) / 100, spatial: 'mono',
      parts: [{ clip: clip, at: 0.2, db: 0, role: 'target' }], beds: [], room: null }, voice: null };
  }
  function rngOf(t, label) { return ES.core && ES.core.rng ? ES.core.rng('voices:' + (t.seed || t.id) + ':' + label) : null; }

  /* ---- presentation hooks ---- */
  function prepMeet(t) {
    var v = targetOf(t), name = nameOf(v), blurb = blurbOf(v), parts = (t.audio && t.audio.parts) || [];
    t.question.prompt = 'Meet ' + name + (blurb ? ': ' + blurb.charAt(0).toLowerCase() + blurb.slice(1) : '.') + ' Listen, then tap the name.';
    // up to three clips of the new voice, one after another (more of the voice, same single trial)
    var first = parts[0] && parts[0].clip, have = first ? [first] : [], r = rngOf(t, 'meet');
    for (var i = 0; i < 2 && v; i++) { var c = clipBy(v, first, have, r); if (c) have.push(c); }
    if (have.length > 1) {
      var at = 0.3;
      t.audio.parts = have.map(function (c) { var p = { clip: c, at: Math.round(at * 1000) / 1000, db: 0, role: 'target' }; at += durOf(c) + 0.45; return p; });
      t.audio.dur = Math.round((at + 0.3) * 100) / 100;
    }
    t.picture = { voices: [{ id: 'v0', role: 'target', az: 0, dist: 1.2, label: name }], maxDist: 2, labels: false, title: 'A new voice: ' + name };
    t.feedback = t.feedback || {};
    t.feedback.replays = [{ label: name + ' again', audio: t.audio }];
  }
  function prepWho(t) {
    var m = t.meta || {}, v = targetOf(t), name = nameOf(v), noisy = !!(t.audio && t.audio.beds && t.audio.beds.length);
    t.question.prompt = noisy ? 'Who is talking through the noise? Tap the name.' : 'Who is talking? Tap the name.';
    var vs = [{ id: 'v0', role: 'target', az: 0, dist: 1.2, label: '?' }];
    if (noisy) [[-120, 2.4], [70, 2.2], [160, 2.7]].forEach(function (p, i) { vs.push({ id: 'n' + i, role: 'other', az: p[0], dist: p[1], label: '' }); });
    t.picture = { voices: vs, maxDist: 2.8, labels: false, title: 'Someone you have met is talking' + (noisy ? ', in noise' : '') };
    var first = t.audio && t.audio.parts && t.audio.parts[0] && t.audio.parts[0].clip, r = rngOf(t, 'who');
    var alone = K() ? K().findReplay(t, /alone/i) : null;
    var reps = [{ label: name + (noisy ? ' alone' : ' again'), audio: alone ? alone.audio : t.audio, voice: v }];
    // every other option's voice, closest in pitch first (the second button), for the side-by-side after a miss
    var f = f0Of(v) || 0, others = (m.cast || []).filter(function (o) { return o !== v; });
    others.sort(function (a, b) { return Math.abs((f0Of(a) || 0) - f) - Math.abs((f0Of(b) || 0) - f); });
    others.forEach(function (o) {
      var c = clipBy(o, first, [], r);
      if (c) { var s = solo(t, c, 'Compare: ' + nameOf(o)); s.voice = o; reps.push(s); }
    });
    if (reps.length < 2) reps.push({ label: 'Again', audio: t.audio, voice: null });
    t.feedback = t.feedback || {};
    t.feedback.replays = reps;
  }
  function prepFind(t) {
    var k = K(), v = targetOf(t), name = nameOf(v), parts = (t.audio && t.audio.parts) || [];
    var others = parts.filter(function (p) { return p.role === 'masker'; }).length;
    t.question.prompt = 'Find ' + name + ' among the voices and tap the word ' + name + ' said.';
    var vs = [{ id: 'v0', role: 'target', az: 0, dist: 1.5, label: name }];
    for (var i = 0; i < others; i++) vs.push({ id: 'v' + (i + 1), role: 'other', az: 0, dist: 1.5, label: '' });
    if (k) k.clusterSamePlace(vs, 1.5);
    t.picture = { voices: vs, maxDist: 2.6, labels: false, title: name + ' and ' + others + (others === 1 ? ' other voice' : ' other voices') + ', all from the same place' };
    var alone = k ? k.findReplay(t, /alone/i) : null;
    t.feedback = t.feedback || {};
    t.feedback.replays = [{ label: name + ' alone', audio: alone ? alone.audio : (k ? k.audioAlone(t.audio) : t.audio) }, { label: 'The crowd again', audio: t.audio }];
  }
  M.prepare = function (t) {
    if (!t || t._exB || t.ex !== 'voices' || !t.question) return t;
    t._exB = true;
    var task = taskOf(t);
    if (task === 'meet') prepMeet(t); else if (task === 'find') prepFind(t); else prepWho(t);
    return t;
  };
  function pitchLine(a, b) {
    var fa = f0Of(a), fb = f0Of(b), na = nameOf(a), nb = nameOf(b);
    if (!fa || !fb) return na + ' and ' + nb + ' differ in more than pitch: listen for pace and voice quality.';
    var st = 12 * Math.log(fa / fb) / Math.LN2;
    if (Math.abs(st) < 2) return na + ' and ' + nb + ' are close in pitch (' + (hz(fa) === hz(fb) ? 'both ' + hz(fa) : hz(fa) + ' and ' + hz(fb)) + '): listen for pace and voice quality.';
    return na + '’s voice sits ' + (st > 0 ? 'higher' : 'lower') + ' (' + hz(fa) + ') than ' + nb + '’s (' + hz(fb) + ').';
  }
  /** Feedback per task. meet: who they are; who: the pitch comparison and both voices (auto) after a miss; find:
      the word from another voice. Returns {text, words, auto}. */
  M.review = function (t, result) {
    var k = K();
    if (!k || !result || !result.slots || !result.slots[0]) return null;
    var task = taskOf(t), v = targetOf(t), name = nameOf(v), r = result.slots[0];
    if (task === 'meet') {
      var bl = blurbOf(v);
      return { text: (bl ? 'That was ' + name + '. ' + bl : 'That was ' + name + '.') + ' You will hear this voice again.', words: null, auto: [] };
    }
    if (task === 'find') {
      if (r.correct) return { text: name + ' said ' + k.q(r.answer) + '. You found the voice you know.', words: null, auto: [] };
      var line = r.foil === 'masker' ? k.q(r.picked) + ' came from another voice; ' + name + ' said ' + k.q(r.answer) + '.' : k.missLine(t, 0, r, name);
      return { text: line + ' Hear ' + name + ' alone, then the crowd again.', words: null, auto: [0, 1] };
    }
    if (r.correct) return { text: 'That was ' + name + '.', words: null, auto: [] };
    var reps = (t.feedback && t.feedback.replays) || [], picked = null, pi = -1;
    reps.forEach(function (x, i) { if (x && x.voice && nameOf(x.voice) === String(r.picked) && x.voice !== v) { picked = x.voice; pi = i; } });
    var text = 'That was ' + name + (r.picked != null ? ', not ' + r.picked + '.' : '.');
    if (picked) text += ' ' + pitchLine(v, picked) + ' Hear ' + name + ', then ' + nameOf(picked) + '.';
    return { text: text, words: null, auto: pi >= 0 ? [0, pi] : [0] };
  };
  M.helpBody = function (el) {
    addCards();
    K().helpBody(M, el);
    var U = ES.core.util;
    if (!ES.ui.inSet && ES.ui.screens && ES.ui.screens['voices-own']) {
      el.appendChild(U.el('p', { class: 'help-why' }, 'You can also add voices from your own life: a recording or a voice note, made with the speaker’s permission. They stay on this device.'));
      el.appendChild(ES.ui.button('Voices from your life', { kind: 'secondary', small: true, attrs: { 'data-own-link': '' },
        onClick: function () { if (ES.ui.closeSheets) ES.ui.closeSheets(); ES.core.router.go('voices-own'); } }));
    }
    return el;
  };
  M.openHelp = function (opts) { addCards(); return K().openHelp(M, opts); };

  /* ---- two-minute tutorial: meet two voices, then tell them apart. Own tutorialTrial: the generator gets
     ctx.task and ctx.met (the voices met in the earlier steps of this run), so the 'who' step uses them. ---- */
  var tut = { byStep: {} };
  function playerSeed() { var L = ES.engine && ES.engine.learner; return L && L.state && L.state.seed ? L.state.seed : 'p'; }
  M.tutorialTrial = function (step, i, rng) {
    var G = ES.engine && ES.engine.items && ES.engine.items.voices, k = K();
    if (!G || typeof G.make !== 'function' || !k) return null;
    var f = (step && step.force) || {}, key = String(rng && rng.seed || '');
    var first = Object.keys(tut.byStep).map(Number).sort(function (a, b) { return a - b; })[0];
    if (key.indexOf(':again:') < 0 && (first === undefined || i <= first)) tut.byStep = {};   // a new tutorial run
    var met = Object.keys(tut.byStep).map(Number).filter(function (s) { return s < i; }).sort(function (a, b) { return a - b; }).map(function (s) { return tut.byStep[s]; });
    var dials = { cast: 0, similar: 0, snr: 30, length: 0 };
    Object.keys(f.dials || {}).forEach(function (d) { dials[d] = f.dials[d]; });
    var setting = { dials: dials, focus: null, anchor: true, warmup: true }, t = null;
    try { t = G.make(rng, setting, { tutorial: true, mode: 'tutorial', breadth: 0, task: f.task || 'meet', met: met, playerSeed: playerSeed() }); }
    catch (e) { k.report('voices tutorial', e); return null; }
    if (!t) return null;
    if (t.meta && t.meta.task === 'meet' && t.meta.newVoice) tut.byStep[i] = t.meta.newVoice;
    t.setting = t.setting || setting;
    if (t.seed == null) t.seed = rng && rng.seed;
    if (f.answerAt) k.placeAnswers(t, f.answerAt);
    return M.prepare(t);
  };
  // After the tutorial, its two voices count as met (SHIM until the engine has learner.noteMet: requests.md).
  if (ES.hooks && typeof ES.hooks.on === 'function') ES.hooks.on('tutorial:done', function (p) {
    if (!p || p.exId !== 'voices' || p.skipped) return;
    var L = ES.engine && ES.engine.learner, vs = Object.keys(tut.byStep).map(function (s) { return tut.byStep[s]; });
    vs.forEach(function (v) {
      if (L && typeof L.noteMet === 'function') L.noteMet(v);
      else if (L && L.state) { L.state.cast = L.state.cast || {}; L.state.cast[v] = (L.state.cast[v] || 0) + 1; }
      ES.hooks.emit('cast:met', { voice: v });
    });
    if (vs.length && L && typeof L.save === 'function' && !L.noteMet) { try { L.save(); } catch (e) { /* the shell saves later */ } }
  });
  function steps() {
    return [
      { kind: 'caption', minMs: 3000, then: 'tap',
        text: 'Meet a cast of voices, each with a name. Then you hear a voice and tap who is talking.' },
      { kind: 'practice', force: { task: 'meet', dials: { snr: 30 }, answerAt: [2] }, next: 'Next voice',
        text: 'Your first voice introduces itself. Listen to how it sounds, then tap the name.' },
      { kind: 'practice', force: { task: 'meet', dials: { snr: 30 }, answerAt: [0] },
        text: 'A second voice. Notice how it differs from the first.' },
      { kind: 'practice', force: { task: 'who', dials: { cast: 0, similar: 0, snr: 30, length: 0 }, answerAt: [1] },
        text: 'Now one of them talks. Who is it?' },
      { kind: 'caption', minMs: 3500, then: 'tap',
        text: 'From here the cast grows, the voices get more alike, the clips shorter and the room noisier, always near your edge. Later you find a voice you know in a crowd. Help shows how to add voices from your own life.' }
    ];
  }
  M.tutorial = {};
  Object.defineProperty(M.tutorial, 'steps', { get: steps, enumerable: true });

  /* ---- strategy cards (plateau breaker), from the notes: R3 §2 (pitch and vocal-tract size together separate
     voices more than the sum of each: Darwin 2003, [secondary]), §7 (~10 min of talker identification gave a
     benefit, Holmes 2021; a familiar target +9.5 points, no release from a familiar masker, Domingo 2020). ---- */
  var CARDS = [
    { id: 'voices.cues', ex: 'voices', dial: 'similar', title: 'Pitch and size together',
      text: 'Voices differ in pitch and in the size of the voice. In lab studies the two together separated voices more than the sum of each alone, so listen for both: high or low, big or small.',
      tryIt: 'Next set: for each voice, decide first whether it sits high or low, then whether it sounds big or small.' },
    { id: 'voices.ten', ex: 'voices', dial: 'cast', title: 'Ten minutes makes a voice familiar',
      text: 'In one study about ten minutes of practice telling three voices apart already made them easier to follow against another talker, and twenty minutes did no better than ten. Familiarity builds fast.',
      tryIt: 'Next set: after every miss, replay both voices once. Each listen adds to what you know of them.' },
    { id: 'voices.follow', ex: 'voices', dial: 'snr', bridge: true, title: 'Know the voice you need to follow',
      text: 'A familiar voice helps when it is the one you follow: in one study it raised scores by about 10 points. A familiar voice in the background did not get easier to ignore.',
      tryIt: 'This week: before a noisy evening, spend a few quiet minutes talking with the person you will most want to hear.' }
  ];
  function addCards() {
    var S = ES.ex.strategies;
    if (!S) return false;
    if (typeof S.add === 'function') { S.add(CARDS); return true; }
    if (!Array.isArray(S.cards)) return false;
    CARDS.forEach(function (c) { if (!S.cards.some(function (x) { return x.id === c.id; })) S.cards.push(c); });
    return true;
  }
  M.cards = CARDS;
  if (!addCards() && ES.hooks && typeof ES.hooks.on === 'function') ES.hooks.on('app:ready', addCards);

  // Night out venues that use this exercise: read from the game's map (ES.game.venues), else this list.
  var VENUES = ['cafe', 'restaurant', 'bar', 'party', 'club'];
  Object.defineProperty(M, 'venues', { enumerable: true, get: function () { var k = K(); return k ? k.venuesOf(M.id, VENUES) : VENUES.slice(); } });

  ES.ex.voices = M;
})(typeof window !== 'undefined' ? window : globalThis);
