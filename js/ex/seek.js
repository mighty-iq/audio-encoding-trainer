/* Earshot — Seek (custom exercise view; CONTRACTS §11, PLAN §6.6). A faint voice keeps calling one word somewhere in
   a noisy room; find it by ear (drag yourself toward it, let go where it is loudest), then name its word. Later
   levels add decoy voices (a preview says which voice to find) and, with headphones, the head-turn view. The
   scene itself lives in js/ex/seek-scene.js (ES.ex._seekScene); this file holds the exercise module (copy, Help,
   tutorial, strategy cards, venues) and the set loop. Seek has no offline trial to render, so the view drives
   ES.engine.flow itself (flow.start → next → answer) and hands Play its flow context (api.flow, so finishSet()
   logs flow.end), each answer (api.record: no second learner update) and the trial bar (api.level/progress).
   Play keeps the handle custom() returns as its view: Pause, Help, a hidden tab and unmount stop the sound.
   The first Seek ever starts with one guided practice scene (plain score, not counted, Try again ×3). */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.ex = ES.ex || {};
  function K() { return ES.ex._kit; }
  function U() { return ES.core.util; }
  function E() { return ES.engine; }
  function SC() { return ES.ex._seekScene; }
  function fmtM(m) { return SC() ? SC().fmtM(m) : Math.round(m * 10) / 10 + ' m'; }
  function report(where, e) { var k = K(); if (k) k.report(where, e); else if (root.console) console.error('[seek ' + where + ']', e); }

  var M = {
    id: 'seek', name: 'Seek',
    short: 'Find a faint voice in a noisy room by ear, then name its word.',
    card: { trains: 'Move your finger through a noisy room to find a faint voice; it gets clearer as you close in. Later: turn your head to hear better.',
      bet: 'sound-guided movement and head-turn practice' },
    bet: 'Sound-guided movement: closing in on a voice by ear, and turning so one ear faces it. Both are under-tested; Seek is our test.',
    betNew: true, view: 'custom', feedback: 'standard',
    strategies: ['seek.halve', 'seek.voice', 'seek.ear'],
    tips: [
      'Move in one direction for a moment and compare: louder means keep going, quieter means turn back.',
      'With decoys, the voice you want is the one from the preview. The others call other words.',
      'With headphones, turn so the voice sits a little to one side: the ear facing it gets the clearer copy.'
    ],
    helpData: function () {
      var d = K() && K().dialOf('seek', 'size'), v = d && d.values;
      return {
        goal: 'A voice keeps calling one word somewhere in a noisy room. Put your finger on your dot (marked “you”) and drag. The voice gets louder as you get closer. Let go where it is loudest, then tap the word it was calling.',
        dials: {
          snr: 'How loud the voice is against the noise when you stand 1 m from it. From farther away it is quieter: about 6 dB less each time the distance doubles.',
          decoys: 'Other voices calling other words. A preview tells you which voice to find.',
          // the scorer counts a stop within 1.15 × the target size (js/engine/score.js): the ring around you shows it
          size: 'How close you must stop for it to count, shown as the ring around you' + (v ? ': from within ' + fmtM(Math.round(v[0] * 1.15 * mpu() * 10) / 10) + ' down to within ' + fmtM(Math.round(v[v.length - 1] * 1.15 * mpu() * 10) / 10) + '.' : '.'),
          gap: 'The pause between calls. Longer pauses give you less to steer by.'
        },
        why: 'Seek turns listening into movement: you steer by the sound and hear the result of each step. A closed-loop listening game of this kind came with gains in speech in noise in one placebo-controlled study of older adults; it has not been replicated, and the gains faded without practice. Turning one ear toward a talker was worth 1 to 3 dB in a virtual restaurant in another study. Seek tests both bets.'
      };
    }
  };
  function mpu() { return SC() ? SC().M_PER_UNIT : 10; }

  /* ---- the set (custom view in Play): one practice scene the first time, then the set's scenes through
     ES.engine.flow. Play keeps the returned handle as its view (Pause, Help, a hidden tab, unmount). ---- */
  function needsPractice(set) {
    if (set && set.practiced) return false;
    var L = E().learner, c = L && L.state && L.state.cond;
    return !(c && ((c['seek:base'] && c['seek:base'].n) || (c['seek:hp'] && c['seek:hp'].n)));
  }
  M.custom = function (host, api) {
    if (SC()) SC().css();
    api = api || {};
    var sess = ES.ui.session, set = sess && sess.currentSet ? sess.currentSet() : null, S = sess && sess.state ? sess.state() : null;
    var plan = (api.set && api.set.plan) || (set && set.plan) || {}, settings = (ES.core.store.peek('profile') || {}).settings || {};
    var view = { cur: null, dead: false }, sc = set && set.sc;
    if (set && !sc && E().flow) {
      var lab = null;
      try { lab = ES.lab && typeof ES.lab.context === 'function' ? ES.lab.context() : ES.lab && typeof ES.lab.forPlanner === 'function' ? ES.lab.forPlanner() : null; } catch (e) { lab = null; }
      sc = E().flow.start('seek', { mode: settings.mode || 'edge', seed: (S ? S.id : 'seek') + ':' + (set.index || 0), headphones: !!settings.headphones, kind: plan.kind,
        hint: plan.hint, avoidVoices: plan.avoidVoices, daysAway: plan.daysAway, lab: lab, trials: set.n, pin: plan.pin, focus: plan.focus });
      if (typeof api.flow === 'function') api.flow(sc); else set.sc = sc;   // the set's log entry comes from flow.end
    }
    function done() { if (!view.dead) { view.dead = true; if (typeof api.done === 'function') api.done({}); } }
    function next() {
      if (view.dead) return;
      if (!set || !sc || set.results.length >= set.n) { done(); return; }
      var spec = null;
      try { spec = sc.pending || E().flow.next(sc); } catch (e) { report('flow.next', e); }
      if (!spec) { done(); return; }
      if (spec.seed == null) spec.seed = sc.seed + ':' + sc.i;
      spec.ex = 'seek';
      try { if (api.level) api.level(sess.levelText(spec)); if (api.progress) api.progress(); } catch (e) { /* the bar is optional */ }
      view.cur = SC().run(host, spec, { score: function (t, r) { return E().flow.answer(sc, t, r).result; },
        onResult: function (res, resp) { if (typeof api.record === 'function') api.record(spec, res, resp); else sess.record(spec, res, resp, { learned: true }); } });
      view.cur.done.then(function (out) { if (out && !out.aborted) next(); });
    }
    function practice(attempt) {
      var rng = ES.core.rng('seek-practice:' + attempt), spec = null;
      try { spec = K() ? K().tutorialTrial(M, { force: { dials: { snr: 15, decoys: 0, size: 0, gap: 0 } } }, 0, rng) : null; } catch (e) { report('practice', e); }
      if (!spec) { if (set) set.practiced = true; next(); return; }
      spec.ex = 'seek';
      if (spec.seed == null) spec.seed = rng.seed;
      if (api.level) api.level('Practice');
      view.cur = SC().run(host, spec, { practice: true, score: function (t, r) { return E().score(t, r); },
        nextLabelFor: function (res) { return !res.correct && attempt < 3 ? 'Try again' : 'Start the set'; } });
      view.cur.done.then(function (out) {
        if (!out || out.aborted) return;
        if (out.result && !out.result.correct && attempt < 3) { practice(attempt + 1); return; }
        if (set) set.practiced = true;
        next();
      });
    }
    if (needsPractice(set)) practice(1); else next();
    return { pause: function () { if (view.cur) view.cur.pause(); }, resume: function () { if (view.cur) view.cur.resume(); },
      abort: function () { view.dead = true; if (view.cur) view.cur.abort(); },
      state: function () { return view.dead ? 'done' : view.cur ? view.cur.state() : 'loading'; }, peek: function () { return view.cur ? view.cur.peek() : null; } };
  };
  M.run = function (host, spec, cfg) { return SC().run(host, spec, cfg); };   // one scene outside a set (tests, previews)

  /* ---- help, tutorial (captions; the practice scene follows in the view), strategy cards, venues ---- */
  M.helpBody = function (el) { addCards(); return K().helpBody(M, el); };
  M.openHelp = function (opts) { addCards(); return K().openHelp(M, opts); };
  M.tutorial = { steps: [
    { kind: 'caption', minMs: 3000, then: 'tap', text: 'Somewhere in a noisy room a voice keeps calling one word. You cannot see it: find it by ear.' },
    { kind: 'caption', minMs: 3000, then: 'tap', text: 'Put your finger on your dot (marked “you”) and drag. The voice gets louder as you get closer. Let go where it is loudest. On a keyboard: arrow keys walk, Enter answers.' },
    { kind: 'caption', minMs: 3000, then: 'tap', text: 'Then tap the word it was calling. First comes one practice scene with a big, easy target.' }
  ] };
  // Sources: R3 §10 (free field −6 dB per doubling of distance; the scene uses exactly 1/distance), §3 (Grange &
  // Culling 2016: after instruction everyone turned, ~3 dB; ~30° keeps lips visible, Grange 2018 §11).
  var CARDS = [
    { id: 'seek.halve', ex: 'seek', dial: 'snr', title: 'Walk, then compare',
      text: 'In the open a voice gets about 6 dB louder each time you halve your distance to it. Move in one direction for a moment and compare: louder means keep going, quieter means turn back.',
      tryIt: 'Next set: move in short straight lines and listen at the end of each one.' },
    { id: 'seek.voice', ex: 'seek', dial: 'decoys', title: 'Hold on to the preview voice',
      text: 'With decoys every voice in the room calls a word. The one you want is the voice from the preview: lock on to its pitch and pace before you move, and pass the others by.',
      tryIt: 'Next set: during the preview, name one thing about the voice: high or low, quick or slow.' },
    { id: 'seek.ear', ex: 'seek', dial: 'size', requires: 'headphones', title: 'Point one ear at the voice',
      text: 'Facing a talker squarely is not the best way to hear them in noise. In lab studies a head turn of about 30°, so one ear points toward the talker, helped: after instruction everyone turned and scores rose by about 3 dB, and the turn still kept the face in view.',
      tryIt: 'Next set: with the knob, turn until the voice sits a little to one side, then let go.' }
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
  var VENUES = ['park', 'station', 'stadium', 'concert'];
  Object.defineProperty(M, 'venues', { enumerable: true, get: function () { var k = K(); return k ? k.venuesOf(M.id, VENUES) : VENUES.slice(); } });

  ES.ex.seek = M;
})(typeof window !== 'undefined' ? window : globalThis);
