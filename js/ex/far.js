/* Earshot — Far (exercise view; CONTRACTS §11). Someone in a room says two sentences: the first lets you hear
   the room (room adaptation acts within ~0.5–3 s: R3 §10), then you tap two words of the second. Distance, echo
   (rt60) and room noise adapt; rooms change as accuracy holds (multi-room practice carried to untrained rooms
   while one room did not: Vlahou 2019, R3 §10). The engine builds the trials (js/engine/items/far.js); this
   module supplies the copy, tutorial, strategy cards and hooks: prepare(trial) → prompt, picture (the room as an
   outline drawn from the ruled room sizes, CONTRACTS §12, the talker at its labelled distance), replays (up
   close, then from the real distance); review(trial, result) → the phrase, what the distance did (direct sound
   −6 dB per doubling against the room's echo), and after a miss both replays (auto). Helpers: ES.ex._kit. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.ex = ES.ex || {};
  function K() { return ES.ex._kit; }

  var M = {
    id: 'far', name: 'Far',
    short: 'Catch words across echoing rooms, halls and stations.',
    card: { trains: 'Catch words across echoing rooms, halls and stations. Distance and echo grow with you; rooms change so the skill is general.',
      bet: 'adapting to rooms, trained across many rooms' },
    bet: 'Room adaptation, trained across many rooms so that it can carry over to rooms you have never heard.',
    betNew: false,
    venues: ['cathedral', 'station', 'lecture', 'park', 'stadium'],
    view: 'keyword', feedback: 'standard',
    strategies: ['far.tune-in', 'far.starts', 'far.closer'],
    tips: [
      'The first phrase is there so you can hear the room: listeners adjust to a room within about half a second to three seconds.',
      'Echo blurs the ends of words more than their starts. Hold on to the first sound and the vowel of each word.',
      'Each doubling of distance makes the direct sound 6 dB weaker against the room’s echo, so the same voice gets harder fast.'
    ],
    helpData: function () {
      return {
        goal: 'Someone in a room says two phrases. The first lets you hear the room; then tap what you heard in the second.',
        dials: {
          dist: 'How far away the talker stands. Each doubling of distance makes the direct sound 6 dB weaker against the room’s echo.',
          rt60: 'How long the room rings after a sound: about 0.35 s in an office, 0.6 s in a cafeteria, 2.5 to 3 s in a very echoey hall.',
          noise: 'How loud the voice is against the room’s own noise, from a quiet room to noise louder than the voice.'
        },
        why: 'Ears adjust to a room within seconds, but to that room. In one study, practice spread over three rooms carried over to rooms never trained. So Far keeps changing rooms as you improve, and the Lab checks you in rooms you never trained in.'
      };
    }
  };

  var SIZE_WORD = { small: 'a small room', medium: 'a medium room', large: 'a large room', hall: 'a hall' };
  function room(t) { return (t.audio && t.audio.room) || (t.meta && t.meta.room) || (t.picture && t.picture.room) || null; }
  function distOf(t) {
    var r = room(t), v = ((t.picture && t.picture.voices) || []).filter(function (x) { return x.role === 'target'; })[0];
    if (r && typeof r.dist === 'number') return r.dist;
    if (v && typeof v.dist === 'number') return v.dist;
    var x = K() && K().value(t, 'far', 'dist');
    return typeof x === 'number' ? x : 2;
  }
  function hasCue(t) { return ((t.audio && t.audio.parts) || []).some(function (p) { return p.role === 'cue'; }); }
  function fmtM(x) { return ES.core && ES.core.util ? ES.core.util.fmtM(x) : x + ' m'; }
  /** What the slots ask for: "two words", "the word and the number", "the word". */
  function asked(t) {
    var L = K().slotsOf(t).map(function (s) { return String(s.label || '').toLowerCase(); });
    if (L.length === 2 && /^first/.test(L[0]) && /^second/.test(L[1])) return 'two words';
    if (!L.length || L.some(function (x) { return !x; })) return L.length > 1 ? 'the words' : 'the word';
    return 'the ' + L.join(' and the ');
  }
  function drrDrop(dist) { return Math.round(20 * Math.log(Math.max(1, dist)) / Math.LN10); }

  function picture(t) {
    var k = K(), base = k.clone(t.picture) || { voices: [] }, r = room(t) || {}, dist = distOf(t);
    var tv = (base.voices || []).filter(function (v) { return v.role === 'target'; })[0] || { id: 'v0', role: 'target', az: 0 };
    tv = k.clone(tv);
    tv.dist = dist;
    tv.label = fmtM(dist);
    var box = k.roomBox(r.size, dist);
    return { voices: [tv], room: { w: box.w, d: box.d, cx: box.cx, cy: box.cy }, maxDist: Math.max(dist * 1.1, box.far * 0.9),
      title: 'A talker ' + fmtM(dist) + ' ahead in ' + (SIZE_WORD[r.size] || 'a room') + (r.rt60 ? ' with ' + r.rt60 + ' s of echo' : '') };
  }
  M.prepare = function (t) {
    var k = K();
    if (!t || !k || t._exA || t.ex !== 'far') return t;
    t._exA = true;
    var dist = distOf(t);
    if (t.question) t.question.prompt = hasCue(t) ? 'Listen to the room, then tap ' + asked(t) + ' from the second phrase.' : 'Tap ' + asked(t) + ' from the phrase.';
    t.picture = picture(t);
    t.feedback = t.feedback || {};
    var near = k.findReplay(t, /close|near|1 m/i), again = k.findReplay(t, /again|from/i);
    t.feedback.replays = [
      { label: 'Up close', audio: near ? near.audio : k.audioNear(t.audio) },
      { label: 'Again from ' + fmtM(dist), audio: again ? again.audio : t.audio }
    ];
    return t;
  };
  /** Feedback: the phrase (shown before any replay), a line per wrong word, what the distance did, and after a
      miss "up close" then "again from N m" (auto). Returns {text, words, auto}. */
  M.review = function (t, result) {
    var k = K();
    if (!k || !result || !result.slots) return null;
    var lines = [], dist = distOf(t), r = room(t) || {};
    result.slots.forEach(function (x, i) { if (x && !x.correct) lines.push(k.missLine(t, i, x, null)); });
    if (!result.correct && dist >= 2) {
      lines.push('At ' + fmtM(dist) + ' the direct sound is ' + drrDrop(dist) + ' dB weaker against the echo than at 1 m' +
        (r.rt60 ? ', in a room that rings for ' + r.rt60 + ' s.' : '.'));
    }
    if (result.correct) lines.push('Heard from ' + fmtM(dist) + ' in ' + (SIZE_WORD[r.size] || 'a room') + (r.rt60 ? ', ' + r.rt60 + ' s of echo.' : '.'));
    var words = (t.meta && t.meta.text) || null;
    return { text: lines.map(k.cap).join(' '), words: words, auto: result.correct ? [] : [0, 1] };
  };
  M.helpBody = function (el) { return K().helpBody(M, el); };
  M.openHelp = function (opts) { return K().openHelp(M, opts); };
  M.tutorialTrial = function (step, i, rng) { return K().tutorialTrial(M, step, i, rng); };

  /* ---- two-minute tutorial. Ordinal dials are level indices: dist 1 → 4 → 5, rt60 0 → 2 → 3 (texts read the
     ladders below so the numbers on screen are the ones in js/engine/dials.js). ---- */
  function lv(id, i, fallback) {
    var k = K(), d = k && k.dialOf('far', id);
    return d && d.levels && d.levels[i] != null ? String(d.levels[i]) : fallback;
  }
  function steps() {
    return [
      { kind: 'caption', minMs: 3000, then: 'tap',
        text: 'Someone in a room says two phrases. The first lets you hear the room. Then tap what you heard in the second.' },
      { kind: 'demo', force: { dials: { dist: 1, rt60: 0, noise: 30 } },
        text: 'An example first: a talker ' + lv('dist', 1, '1.5 m') + ' away in a small room.' },
      { kind: 'practice', force: { dials: { dist: 1, rt60: 0, noise: 30 }, answerAt: [1, 3] },
        text: 'Your turn. Listen to the room, then catch the second phrase.' },
      { kind: 'practice', force: { dials: { dist: 4, rt60: 2, noise: 24 }, answerAt: [3, 0] },
        text: 'The talker steps back to ' + lv('dist', 4, '4 m') + ', in a room that rings for ' + lv('rt60', 2, '0.6 s') + '.' },
      { kind: 'practice', force: { dials: { dist: 5, rt60: 3, noise: 20 }, answerAt: [0, 2] },
        text: 'Now ' + lv('dist', 5, '6 m') + ' away, ' + lv('rt60', 3, '0.8 s') + ' of echo and some room noise.' },
      { kind: 'caption', minMs: 3500, then: 'tap',
        text: 'From here distance, echo and noise adapt to you, and the rooms keep changing so the skill travels. After each answer you can hear the phrase up close, then from where it was said.' }
    ];
  }
  M.tutorial = {};
  Object.defineProperty(M.tutorial, 'steps', { get: steps, enumerable: true });

  ES.ex.far = M;
})(typeof window !== 'undefined' ? window : globalThis);
