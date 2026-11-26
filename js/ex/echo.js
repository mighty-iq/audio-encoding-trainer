/* Earshot — Echo (exercise view; CONTRACTS §11). A message heard once in café or party noise (names, places, times,
   things to bring), a short pause with nothing new on screen, then 2–3 questions about its details. The shell's
   Play screen runs it from the engine's TrialSpecs (js/engine/items/echo.js); this module supplies the copy (Home,
   map, Help), the two-minute tutorial, strategy cards and the presentation hooks: prepare(trial) → prompt, picture,
   replays; review(trial, result) → per-detail lines (a pick that was in the message but answers another question
   is a binding error), the message's words, and the message again in the noise after a miss.
   The pause is the shell's: the trial view keeps the answer panel out of sight while the sound plays and for
   question.delayMs after it ("Hold it in mind…"), so the options never cue what to listen for. Shared helpers:
   ES.ex._kit (js/ex/strategies.js), used inside functions only. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.ex = ES.ex || {};
  function K() { return ES.ex._kit; }

  var M = {
    id: 'echo', name: 'Echo',
    short: 'Hear a message once in a busy place, then answer from memory.',
    card: { trains: 'Hear a message once in a busy place — names, numbers, plans — and answer after a pause.',
      bet: 'listening under memory load, on real-life content' },
    bet: 'Listening under memory load on real-life content: details heard once in noise, held through a pause, then used.',
    betNew: false,
    view: 'keyword', feedback: 'standard',
    strategies: ['echo.shape', 'echo.after', 'echo.slot'],
    tips: [
      'The questions appear only after the pause, so hold the whole message: who, where, when and what.',
      'A detail lost in the noise often comes back from the rest of the message. Keep listening to the end before you decide.',
      'A pick that was in the message but answers another question means you heard it and filed it in the wrong slot.'
    ],
    helpData: function () {
      return {
        goal: 'A voice gives you a message in a busy place, once. After a short pause, questions ask for its details: who, what, where or when. Answer from memory.',
        dials: {
          snr: 'How loud the message is against the café or party around it. Below 0 dB the noise is louder than the voice.',
          details: 'How many details the message carries.',
          rate: 'How fast the message is spoken, as a multiple of normal speed.',
          delay: 'How long you wait, with nothing new on screen, before the questions appear.'
        },
        why: 'Real messages come once, in noise, and you need them a moment later. Echo trains hearing and holding together on everyday content. Context is a strong repair tool: listeners restored 70 to 90 % of missing sounds in short everyday sentences, against about 50 % in meaningless ones, so the rest of a message helps you rebuild a detail the noise covered.'
      };
    }
  };

  /** The delay before the questions, in s (the shell's trial view holds the answer panel back for question.delayMs). */
  function holdOf(t) { var ms = t && t.question && +t.question.delayMs; return ms > 0 ? Math.round(ms / 100) / 10 : 0; }

  /* ---- presentation hooks ---- */
  var BED_WORD = { cafe: 'a busy café', party: 'a party', babble: 'a crowd', street: 'a busy street', station: 'a station' };
  function bedWord(t) {
    var b = ((t.audio && t.audio.beds) || [])[0] || {}, id = String(b.bed || b.kind || '');
    for (var k in BED_WORD) if (id.indexOf(k) >= 0) return BED_WORD[k];
    return 'a busy place';
  }
  function picture(t) {
    var vs = [{ id: 'v0', role: 'target', az: 0, dist: 1.2, label: 'message' }];
    [[-118, 2.6], [64, 2.3], [152, 2.9], [-46, 3.1]].forEach(function (p, i) { vs.push({ id: 'b' + i, role: 'other', az: p[0], dist: p[1], label: '' }); });
    return { voices: vs, maxDist: 3.2, labels: false, title: 'A message from the voice ahead, in ' + bedWord(t) + '; the questions come after it' };
  }
  M.prepare = function (t) {
    var k = K();
    if (!t || t._exB || t.ex !== 'echo') return t;
    t._exB = true;
    if (t.question) {
      t.question.prompt = 'Listen once. The questions come after a short pause: answer from memory.';
      (t.question.slots || []).forEach(capNames);
    }
    t.picture = picture(t);
    t.feedback = t.feedback || {};
    var again = k ? k.findReplay(t, /again|hear/i) : null;
    t.feedback.replays = [
      { label: 'Again, in the noise', audio: again ? again.audio : t.audio },
      { label: 'The voice alone', audio: k ? k.audioAlone(t.audio) : t.audio }
    ];
    return t;
  };
  /** Names read as names: when the answer is capitalised, so are the other options (scoring ignores case). */
  function capNames(sl) {
    if (!sl || typeof sl.answer !== 'string' || !/^[A-Z]/.test(sl.answer) || !sl.options) return;
    function cap(o) { return typeof o === 'string' ? o.charAt(0).toUpperCase() + o.slice(1) : o; }
    sl.options = sl.options.map(cap);
    var f = {};
    Object.keys(sl.foils || {}).forEach(function (k) { f[cap(k)] = sl.foils[k]; });
    sl.foils = f;
  }
  var CAT = { name: 'name', caller: 'name', place: 'place', time: 'time', day: 'day', number: 'number', item: 'thing', object: 'thing' };
  function norm(s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function factOf(facts, v) { var n = norm(v); for (var i = 0; i < facts.length; i++) if (norm(facts[i].value) === n) return facts[i]; return null; }
  /** Feedback: a line per wrong detail, "all held" when right, the message's words (static) and, after a miss,
      the message again in the noise (auto). Returns {text, words, auto}. */
  M.review = function (t, result) {
    var k = K();
    if (!k || !result || !result.slots) return null;
    var slots = k.slotsOf(t), facts = (t.meta && t.meta.facts) || [], lines = [], hold = holdOf(t);
    result.slots.forEach(function (r, i) {
      if (!r || r.correct) return;
      var s = slots[i] || {}, lab = s.label ? s.label + ' ' : '';
      if (r.picked == null) { lines.push(lab + 'It was ' + k.q(r.answer) + '.'); return; }
      if (r.foil === 'context') {
        var f = factOf(facts, r.picked), other = f && f.q && f.q !== s.label;
        lines.push(lab + k.q(r.picked) + ' was in the message' + (other ? ', as the answer to “' + f.q + '”' : ', but not as this detail') + '; here it was ' + k.q(r.answer) + '.');
        return;
      }
      if (r.foil === 'neighbour') { lines.push(lab + k.q(r.picked) + ' sounds like ' + k.q(r.answer) + ', the ' + (CAT[s.cat] || 'word') + ' in the message.'); return; }
      lines.push(lab + 'It was ' + k.q(r.answer) + ', not ' + k.q(r.picked) + '.');
    });
    var n = result.slots.length;
    if (result.correct) lines.push((n === 2 ? 'Both details' : n === 1 ? 'The detail' : 'All ' + n + ' details') + ' held' + (hold ? ' through a ' + hold + ' s wait.' : '.'));
    else if (result.slots.some(function (r) { return r && r.foil === 'context'; })) lines.push('Heard right, filed in the wrong slot: tag each detail as it comes.');
    var words = (t.meta && t.meta.text) || null;
    return { text: lines.join(' '), words: words, auto: result.correct ? [] : [0] };
  };
  M.helpBody = function (el) { addCards(); return K().helpBody(M, el); };
  M.openHelp = function (opts) { addCards(); return K().openHelp(M, opts); };
  M.tutorialTrial = function (step, i, rng) { return K().tutorialTrial(M, step, i, rng); };

  /* ---- two-minute tutorial: an example, then two practice messages. Dials are forced in dial units (ordinal =
     level index): details 0 = 2 details, rate 0 = normal, delay 0 = 1 s, delay 1 = 3 s (texts read the ladder). ---- */
  function lv(id, i, fallback) { var k = K(), d = k && k.dialOf('echo', id); return d && d.levels && d.levels[i] != null ? String(d.levels[i]) : fallback; }
  function steps() {
    return [
      { kind: 'caption', minMs: 3000, then: 'tap',
        text: 'A voice gives you a message in a busy place, once. After a short pause, questions ask for its details. Answer from memory.' },
      { kind: 'demo', force: { dials: { snr: 16, details: 0, rate: 0, delay: 0 } },
        notes: { context: 'in the message, other question', neighbour: 'sounds alike', random: 'not in the message' },
        text: 'An example first: the message, then the answers marked.' },
      { kind: 'practice', force: { dials: { snr: 16, details: 0, rate: 0, delay: 0 }, answerAt: [1, 3, 0] },
        text: 'Your turn. Listen to the whole message, wait for the questions, then answer.' },
      { kind: 'practice', force: { dials: { snr: 9, details: 0, rate: 0, delay: 1 }, answerAt: [2, 0, 3] },
        text: 'The place is louder now, and the wait is ' + lv('delay', 1, '3 s') + '.' },
      { kind: 'caption', minMs: 3500, then: 'tap',
        text: 'From here the noise, the number of details, the speed and the wait adapt to you, always near your edge. After a miss the message plays again with its words on screen.' }
    ];
  }
  M.tutorial = {};
  Object.defineProperty(M.tutorial, 'steps', { get: steps, enumerable: true });

  /* ---- strategy cards (plateau breaker), from the notes: R3 §6 (context restores 70–90 % of missing sounds in
     everyday sentences vs ~50 % in meaningless ones, [secondary] via Bronkhorst 2015; context after an unclear word
     helped more than before it, most at the hardest SNRs: Tinnemore 2025). echo.slot names our own feedback
     category (a 'context' foil = a word from the message given to another question). ---- */
  var CARDS = [
    { id: 'echo.shape', ex: 'echo', dial: 'details', title: 'Give each detail a slot',
      text: 'A message has a shape: who, where, when, what to bring. Expecting that shape gives each detail a place to land. Context is a strong repair tool: listeners restored 70 to 90 % of missing sounds in short everyday sentences, against about 50 % in meaningless ones.',
      tryIt: 'Next set: listen for the shape first, then drop each detail into its slot as it arrives.' },
    { id: 'echo.after', ex: 'echo', dial: 'snr', title: 'Let the end repair the start',
      text: 'The words after an unclear one can repair it. In one study context helped even more when it came after the unclear word than before it, and most at the hardest noise levels.',
      tryIt: 'Next set: when a detail goes under, keep listening; decide only once the message is over.' },
    { id: 'echo.slot', ex: 'echo', dial: 'delay', title: 'Right word, wrong question',
      text: 'A pick that was in the message but answers another question is a filing slip: you heard it and put it in the wrong place. Tagging each detail with its role as you hear it keeps it in place through the wait.',
      tryIt: 'Next set: tag each detail as it comes: who, where, when or what.' }
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
  var VENUES = ['cafe', 'restaurant', 'bar', 'party'];
  Object.defineProperty(M, 'venues', { enumerable: true, get: function () { var k = K(); return k ? k.venuesOf(M.id, VENUES) : VENUES.slice(); } });

  ES.ex.echo = M;
})(typeof window !== 'undefined' ? window : globalThis);
