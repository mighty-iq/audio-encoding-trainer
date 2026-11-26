/* Earshot — Repair (exercise view; CONTRACTS §11). One word of a sentence is lost under a burst of noise or a gap,
   and the rest may be chopped up; tap the word that was there. Dials: gap (share of the word lost), context
   (sentence predictability), gate (how much of the sentence survives), fill (noise-filled gaps let hearing
   restore the word, ~9 points in Benard & Başkent 2013; silence is hardest: R3 §6). The engine builds the trials
   (js/engine/items/repair.js); this module supplies the copy, tutorial, strategy cards and hooks:
   prepare(trial) → prompt, picture, replays (the whole sentence, then broken again); review(trial, result) →
   the sentence with the lost word marked, why a foil was tempting (fits the sentence / sounds alike), a note
   when the clue came after the gap (context after the gap helped more: Tinnemore 2025, R3 §6), and after a
   miss the whole sentence then the broken one again (auto; the feedback that trained listeners in Benard &
   Başkent 2013). Helpers: ES.ex._kit (js/ex/strategies.js). */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.ex = ES.ex || {};
  function K() { return ES.ex._kit; }

  var M = {
    id: 'repair', name: 'Repair',
    short: 'Rebuild words lost under bursts of noise.',
    card: { trains: 'Words vanish under bursts of noise. Rebuild them from what came before and after.',
      bet: 'a general strategy: hold the sentence, then repair it' },
    bet: 'A general strategy, hold the sentence and then repair it, plus listening in the gaps.',
    betNew: false,
    venues: ['club', 'concert', 'station', 'phone', 'stadium'],
    view: 'keyword', feedback: 'standard',
    strategies: ['repair.wait', 'repair.fill', 'repair.glimpse'],
    tips: [
      'Wait for the end: the words after a gap can repair it, sometimes better than the words before it.',
      'When noise fills a gap, your hearing tends to fill in the missing sound. Trust what the sound and the sentence suggest together.',
      'Chopped-up speech keeps its rhythm. Follow the beat of the sentence through the cuts.'
    ],
    helpData: function () {
      return {
        goal: sentences() ? 'One word in each sentence is lost under a burst of noise or a gap. Hold the whole sentence in mind, then tap the word that was there.'
          : 'A voice says a name, a word and a number, and one word is lost under a burst of noise or a gap. Listen to the whole phrase, then tap the word that was there.',
        dials: {
          gap: 'How much of the lost word is covered.',
          context: 'How strongly the rest of the sentence points to the word.',
          gate: 'The whole sentence switches on and off; less of it is kept.',
          fill: 'Noise lets your hearing fill in; silence makes the cuts obvious.'
        },
        why: 'Holding a sentence in mind and repairing it from context is a general listening strategy, and listening in the gaps of a fluctuating noise improves quickly with practice. In one study, practice with interrupted sentences carried over to a different kind of gap and lasted about three months.'
      };
    }
  };

  /** True when the build has Repair sentences (with context) to play; false while only call-sign phrases exist. */
  function sentences() {
    var A = ES.engine && ES.engine.items && ES.engine.items.adapt;
    if (!A || typeof A.voicesWith !== 'function' || typeof A.repairItems !== 'function') return true;
    try { return A.voicesWith(A.repairItems()).length > 0; } catch (e) { return true; }
  }
  function lostWord(t) { var m = t.meta || {}; return m.items && m.items[0] ? String(m.items[0]) : null; }
  /** "she poured the milk into a [cup]": the generator's version when it gives one, else built from meta.text. */
  function marked(t) {
    var f = t.feedback && t.feedback.text, m = t.meta || {};
    if (f && f.indexOf('[') >= 0) return String(f);
    if (!m.text) return null;
    var w = String(m.text).split(/\s+/), key = lostWord(t), at = -1;
    if (typeof m.key === 'number') at = m.key;
    else if (key) for (var i = w.length - 1; i >= 0; i--) if (w[i].toLowerCase().replace(/[^a-z0-9']/g, '') === key.toLowerCase()) { at = i; break; }
    if (at >= 0 && at < w.length) w[at] = w[at].replace(/^([^A-Za-z0-9']*)(.*?)([^A-Za-z0-9']*)$/, '$1[$2]$3');
    return w.join(' ');
  }
  /** Whether the rest of the utterance carries a clue (a real sentence with some context, not a call-sign phrase). */
  function hasContext(t) {
    var m = t.meta || {};
    if ((m.relaxed || []).some(function (r) { return /call-sign/.test(r); })) return false;
    return m.pred === 'hi' || m.pred === 'mid';
  }
  /** Whether the clue came after the gap (the lost word sits in the first half of the sentence). */
  function clueAfter(t) {
    var m = t.meta || {};
    if (!hasContext(t)) return false;
    if (m.ctx) return m.ctx === 'after';
    return typeof m.keyPos === 'number' ? m.keyPos < 0.5 : false;
  }

  /** "Repaired: 60 % of the word lost, some context." (real units from the trial's dials) */
  function levelLine(t) {
    var k = K(), s = (t.setting && t.setting.dials) || {}, g = k.dialOf('repair', 'gap'), c = k.dialOf('repair', 'context');
    var parts = [];
    if (g && s.gap != null) parts.push(k.fmt(g, s.gap) + ' of the word lost');
    if (c && s.context != null) parts.push(k.fmt(c, s.context));
    return 'Repaired' + (parts.length ? ': ' + parts.join(', ') : '') + '.';
  }
  M.prepare = function (t) {
    var k = K();
    if (!t || !k || t._exA || t.ex !== 'repair') return t;
    t._exA = true;
    if (t.question) t.question.prompt = hasContext(t) ? 'One word is lost. Hold the whole sentence, then tap the word that was there.'
      : 'One word is lost. Tap the word that was there.';
    t.picture = { voices: [{ id: 'v0', role: 'target', az: 0, dist: 1, label: '' }], maxDist: 2.4, compact: false,
      title: 'One voice ahead of you; one of its words is lost' };
    t.feedback = t.feedback || {};
    var whole = k.findReplay(t, /whole|clear/i), again = k.findReplay(t, /again|gap|broken/i);
    t.feedback.replays = [
      { label: hasContext(t) ? 'The whole sentence' : 'The whole phrase', audio: whole ? whole.audio : k.audioClean(t.audio) },
      { label: 'Again with the gap', audio: again ? again.audio : t.audio, showText: true }
    ];
    return t;
  };
  M.review = function (t, result) {
    var k = K();
    if (!k || !result || !result.slots) return null;
    var lines = [];
    result.slots.forEach(function (x, i) { if (x && !x.correct) lines.push(k.missLine(t, i, x, null)); });
    if (!result.correct && clueAfter(t)) lines.push('The clue came after the gap: wait for the end before you choose.');
    if (result.correct) lines.push(levelLine(t));
    return { text: lines.map(k.cap).join(' '), words: marked(t), auto: result.correct ? [] : [0, 1] };
  };
  M.helpBody = function (el) { return K().helpBody(M, el); };
  M.openHelp = function (opts) { return K().openHelp(M, opts); };
  M.tutorialTrial = function (step, i, rng) { return K().tutorialTrial(M, step, i, rng); };

  /* ---- two-minute tutorial; every dial forced (level indices): gap 0 → 2 → 3, context 0 → 0 → 1 ---- */
  function lv(id, i, fallback) {
    var k = K(), d = k && k.dialOf('repair', id);
    return d && d.levels && d.levels[i] != null ? String(d.levels[i]) : fallback;
  }
  function steps() {
    if (!sentences()) return phraseSteps();
    return [
      { kind: 'caption', minMs: 3000, then: 'tap',
        text: 'In each sentence one word is lost under a burst of noise. Hold the whole sentence in mind, then tap the word that was there.' },
      { kind: 'demo', force: { dials: { gap: 0, context: 0, gate: 0, fill: 0 } },
        notes: { context: 'fits the sentence, not the sound', neighbour: 'sounds alike', random: 'not in the sentence' },
        text: 'An example first: ' + lv('gap', 0, '30 %') + ' of the word is covered, and the sentence gives a strong clue.' },
      { kind: 'practice', force: { dials: { gap: 0, context: 0, gate: 0, fill: 0 }, answerAt: [1] },
        text: 'Your turn. Listen to the whole sentence first.' },
      { kind: 'practice', force: { dials: { gap: 2, context: 0, gate: 0, fill: 0 }, answerAt: [3] },
        text: 'More of the word is lost now: ' + lv('gap', 2, '60 %') + '.' },
      { kind: 'practice', force: { dials: { gap: 3, context: 1, gate: 0, fill: 0 }, answerAt: [0] },
        text: 'The clue is weaker now. Wait for the end of the sentence before you choose.' },
      { kind: 'caption', minMs: 3500, then: 'tap',
        text: 'From here the gaps grow, the clues thin out and whole sentences break up as you improve. After each answer you can hear the sentence whole, then broken again with its words.' }
    ];
  }
  /** While the build has only call-sign phrases ("Tyler, drum, eight."), the tutorial talks about phrases and gaps. */
  function phraseSteps() {
    return [
      { kind: 'caption', minMs: 3000, then: 'tap',
        text: 'A voice says a name, a word and a number. One word is lost under a burst of noise. Listen to the whole phrase, then tap the word that was there.' },
      { kind: 'demo', force: { dials: { gap: 0, context: 0, gate: 0, fill: 0 } },
        notes: { context: 'fits, but was not said', neighbour: 'sounds alike', random: 'not in the phrase' },
        text: 'An example first: ' + lv('gap', 0, '30 %') + ' of the word is covered.' },
      { kind: 'practice', force: { dials: { gap: 0, context: 0, gate: 0, fill: 0 }, answerAt: [1] },
        text: 'Your turn. Listen to the whole phrase first.' },
      { kind: 'practice', force: { dials: { gap: 2, context: 0, gate: 0, fill: 0 }, answerAt: [3] },
        text: 'More of the word is lost now: ' + lv('gap', 2, '60 %') + '.' },
      { kind: 'practice', force: { dials: { gap: 3, context: 0, gate: 0, fill: 1 }, answerAt: [0] },
        text: 'Now ' + lv('gap', 3, '75 %') + ' is lost, under softer noise.' },
      { kind: 'caption', minMs: 3500, then: 'tap',
        text: 'From here the gaps grow and the phrase breaks up as you improve. After each answer you can hear it whole, then broken again with its words.' }
    ];
  }
  M.tutorial = {};
  Object.defineProperty(M.tutorial, 'steps', { get: steps, enumerable: true });

  ES.ex.repair = M;
})(typeof window !== 'undefined' ? window : globalThis);
