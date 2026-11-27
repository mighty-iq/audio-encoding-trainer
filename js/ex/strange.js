/* Earshot — Strange voices (exercise view; CONTRACTS §11). A semantically unpredictable phrase from an unusual
   voice (accent, fast, whisper, phone line, through a wall, robot); tap two of its words. One family per trial,
   each with its own easy-to-hard ladder; the engine builds the trials (js/engine/items/strange.js).
   Feedback is the pop-out loop: the degraded phrase (the trial), then its words on screen, then the same
   degraded phrase again (Davis 2005: degraded–words–degraded trains as well as a clear replay, better than
   repetition; R2 §3.3). Text-first aid trials (setting.aid = 'text') show the words before the sound (Sohoglu
   2014: text before word onset maximises clarity; R2 §3.3). Hooks: prepare(trial) → prompt with the family and
   its level in real units, picture, the replay, the prime; review(trial, result) → words + auto replay, every
   time. Helpers: ES.ex._kit (js/ex/strategies.js). */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.ex = ES.ex || {};
  function K() { return ES.ex._kit; }

  // The accent family is voices from speech models built for other languages reading English phonemes, ordered by how
  // hard a speech recogniser found them (docs/dev/reviews/RV-stimuli.md ST-08): never "a French speaker" or "strong accent".
  var FAM = { accent: 'Other-language model', fast: 'Fast talker', whisper: 'Whisper', phone: 'Phone line', muffled: 'Through a wall', vocoded: 'Robot voice' };
  var KIND = { accent: 'a voice from another-language model reading English', fast: 'a fast talker', whisper: 'a whisper',
    phone: 'a bad phone line', muffled: 'a voice through a wall', vocoded: 'a robot voice' };
  var TIER = { 1: 'easiest', 2: 'middle', 3: 'hardest' };

  /** "French" from "English with a French accent (synthetic)"; null when the voice names no language. */
  function langOfVoice(vo) {
    var m = /with an? ([A-Z][a-z]+(?: [A-Z][a-z]+)?) accent/.exec(String((vo && vo.accent) || ''));
    return m ? m[1] : null;
  }
  function article(w) { return /^[AEIOU]/.test(w) ? 'an ' + w : 'a ' + w; }
  /** Languages of the other-language voices this build can play (for Help), most common first. */
  function accentLangs() {
    var A = ES.engine && ES.engine.items && ES.engine.items.adapt, V = (ES.data && ES.data.voices) || {}, n = {};
    try {
      var vs = A && typeof A.voicesWith === 'function' ? A.voicesWith(A.susItems()) : Object.keys(V);
      vs.forEach(function (v) { var l = V[v] && !(A && A.isNative(V[v])) ? langOfVoice(V[v]) : null; if (l) n[l] = (n[l] || 0) + 1; });
    } catch (e) { /* none */ }
    return Object.keys(n).sort(function (a, b) { return n[b] - n[a] || (a < b ? -1 : 1); });
  }

  /** Whether this build has accented voices with Strange material (the engine swaps the accent family for the next
      one when it has none: js/engine/items/strange.js), judged the way the engine does (adapt.isNative). */
  function hasAccents() {
    var A = ES.engine && ES.engine.items && ES.engine.items.adapt, V = (ES.data && ES.data.voices) || {};
    if (!A || typeof A.voicesWith !== 'function' || typeof A.isNative !== 'function') return true;
    try {
      var vs = A.voicesWith(A.susItems());
      if (!vs.length && typeof A.fallbackItems === 'function') vs = A.voicesWith(A.fallbackItems());
      return vs.some(function (v) { return V[v] && !A.isNative(V[v]); });
    } catch (e) { return true; }
  }
  /** The kinds of voice this build can play, in dial order. */
  function families() {
    var acc = hasAccents();
    return Object.keys(FAM).filter(function (f) { return f !== 'accent' || acc; });
  }

  var M = {
    id: 'strange', name: 'Strange voices',
    card: { bet: 'variety that trains adapting to new voices' },
    bet: 'Varied voices that train your ear to adapt to new ones, fast.',
    betNew: false,
    view: 'keyword', feedback: 'popout',
    strategies: ['strange.replay', 'strange.few', 'strange.noise'],
    tips: [
      'The replay with the words on screen is where the learning happens: you hear the hard voice again while knowing what it says.',
      'A new kind of voice takes a few tries. In one study half of the gain over 30 sentences came within the first three.',
      'The phrases are deliberately odd, so guessing from meaning does not work. Listen for the sounds.'
    ],
    helpData: function () {
      var fams = families(), kinds = fams.map(function (f) { return KIND[f]; });
      return {
        goal: 'Each phrase comes from an unusual voice: ' + kinds.slice(0, -1).join(', ') + ' or ' + kinds[kinds.length - 1] +
          '. Tap the words you heard. Then the words appear and you hear the same voice again.',
        dialsTitle: 'The kinds of voice and how each gets harder',
        dials: {
          accent: fams.indexOf('accent') >= 0 ? accentHelp() : false,
          fast: 'Speech sped up without changing its pitch.',
          whisper: 'A whispered voice, first in quiet, then in rising noise.',
          phone: 'A phone line that gets thinner and noisier.',
          muffled: 'A voice through a wall: everything above a cut-off frequency is lost.',
          vocoded: 'A robot voice made of noise bands: the fewer bands, the less detail.'
        },
        why: 'Our bet: practising many kinds of unusual voice trains the skill of adapting itself. A large replication found the benefit of variety smaller than earlier studies suggested, so the Lab’s New voice check measures it with a kind of voice you never train on.'
      };
    }
  };

  /** Help row for the accent family: what the voices are, how the ladder runs, the range in those words. */
  function accentHelp() {
    var k = K(), d = k && k.dialOf('strange', 'accent'), L = accentLangs(), v0 = d && d.values[0], vN = d && d.values[d.values.length - 1];
    var langs = L.length > 4 ? L.slice(0, 4).join(', ') + ' and more' : L.join(', ');
    function lvl(v) { return v ? TIER[v.tier] + ', ' + (v.snr == null ? 'quiet' : ES.core.util.fmtDb(v.snr)) : ''; }
    return { label: 'Voices from other-language models',
      text: 'Speech models built for other languages' + (langs ? ' (' + langs + ')' : '') + ' reading English. First the voices a speech recogniser found easiest, in quiet; then harder ones, in louder babble.',
      range: v0 && vN ? lvl(v0) + ' → ' + lvl(vN) : null };
  }
  // Home and map copy name only the kinds of voice this build can play (no other-language voices without them).
  Object.defineProperty(M, 'short', { enumerable: true, get: function () {
    return hasAccents() ? 'Other-language model voices, fast, whispered, phone and robot-like speech.' : 'Fast, whispered, phone, muffled and robot-like speech.';
  } });
  Object.defineProperty(M.card, 'trains', { enumerable: true, get: function () {
    return (hasAccents() ? 'Voices from other-language models reading English, fast, whispered, phone-quality and robot-like speech.'
      : 'Fast, whispered, phone-quality, muffled and robot-like speech.') + ' The words pop up after each try so your ear retunes.';
  } });
  M.families = families;

  function family(t) {
    var m = t.meta || {}, d = (t.setting && t.setting.dials) || {};
    if (m.family && FAM[m.family]) return m.family;
    for (var f in FAM) if (d[f] != null) return f;
    return null;
  }
  /** "A voice from a French model reading English, in babble at +6 dB" (a recorded talker: "A talker whose first
      language is French …"). */
  function accentText(t) {
    var m = t.meta || {}, V = (ES.data && ES.data.voices) || {}, vo = V[(m.voices || [])[0]] || { accent: m.accent };
    var lang = langOfVoice(vo), d = K().dialOf('strange', 'accent'), s = (t.setting && t.setting.dials) || {};
    var v = d && s.accent != null ? d.values[Math.max(0, Math.min(d.values.length - 1, Math.round(s.accent)))] : null;
    var base = m.synthetic === false ? (lang ? 'A talker whose first language is ' + lang : 'An unfamiliar talker')
      : 'A voice from ' + (lang ? article(lang) : 'another-language') + ' model reading English';
    return base + (v ? (v.snr == null ? ', in quiet' : ', in babble at ' + ES.core.util.fmtDb(v.snr)) : '');
  }
  /** "Fast talker (1.9×)", "A voice from a French model reading English, in quiet", "Phone line, thin line". */
  function kindText(t) {
    var k = K(), f = family(t);
    if (!f) return 'Unusual voice';
    if (f === 'accent') return accentText(t);
    var dl = k.dialOf('strange', f), s = (t.setting && t.setting.dials) || {}, lab = dl && s[f] != null ? k.fmt(dl, s[f]) : '';
    if (!lab) return FAM[f];
    if (f === 'whisper') return k.cap(lab);
    if (f === 'phone') return lab === 'clear line' ? 'Clear phone line' : 'Phone line, ' + lab;
    return FAM[f] + ' (' + lab + ')';
  }
  function words(t) { return (t.meta && t.meta.text) || null; }
  function isAid(t) { return (t.setting && t.setting.aid === 'text') || (t.meta && t.meta.aid === 'text'); }

  function picture(t) {
    var m = t.meta || {}, beds = (t.audio && t.audio.beds) || [];
    var label = m.synthetic === true ? 'synthetic voice' : m.synthetic === false ? 'recorded voice' : '';
    var vs = [{ id: 'v0', role: 'target', az: 0, dist: 1, label: label }];
    if (beds.some(function (b) { return b.kind === 'babble'; })) {
      vs.push({ id: 'b1', role: 'other', az: -140, dist: 1.8, label: '' }, { id: 'b2', role: 'other', az: 150, dist: 2.1, label: '' });
    }
    return { voices: vs, maxDist: 2.4, title: kindText(t) + (vs.length > 1 ? ', with babble around you' : '') };
  }
  M.prepare = function (t) {
    var k = K();
    if (!t || !k || t._exA || t.ex !== 'strange') return t;
    t._exA = true;
    if (t.question) t.question.prompt = kindText(t) + ': tap the ' + (K().slotsOf(t).length > 1 ? 'words' : 'word') + ' you heard.';
    t.picture = picture(t);
    t.feedback = t.feedback || {};
    var again = k.findReplay(t, /again|words/i);
    t.feedback.replays = [{ label: 'Again, with the words', audio: again ? again.audio : t.audio, showText: true }];
    if (isAid(t) && words(t)) t.prime = { text: words(t), ms: 1500 };
    return t;
  };
  /** Pop-out: the words on screen first, then the same degraded phrase again, after every answer. */
  M.review = function (t, result) {
    var k = K();
    if (!k || !result || !result.slots) return null;
    var lines = [];
    result.slots.forEach(function (x, i) { if (x && !x.correct) lines.push(k.missLine(t, i, x, null)); });
    if (result.correct) lines.push(kindText(t) + ': both words.');
    return { text: lines.map(k.cap).join(' '), words: words(t), auto: [0] };
  };
  M.helpBody = function (el) { return K().helpBody(M, el); };
  M.openHelp = function (opts) { return K().openHelp(M, opts); };
  M.tutorialTrial = function (step, i, rng) { return K().tutorialTrial(M, step, i, rng); };

  /* ---- two-minute tutorial: one family per trial, each at its easiest level (index 0) ---- */
  function lv(id, i, fallback) {
    var k = K(), d = k && k.dialOf('strange', id);
    return d && d.levels && d.levels[i] != null ? String(d.levels[i]) : fallback;
  }
  /** The third practice uses the gentlest new kind this build can play: another-language model voice when it has them,
      else a voice through a wall (so the caption never promises a sound the build cannot make). The accent family's
      easiest level is the voices a speech recogniser found easiest, in quiet. */
  function lastStep() {
    var acc = families().indexOf('accent') >= 0;
    return acc ? { kind: 'practice', force: { dials: { accent: 0 }, answerAt: [3, 0] }, text: 'Last one: a voice from another-language model reading English.' }
      : { kind: 'practice', force: { dials: { muffled: 0 }, answerAt: [3, 0] }, text: 'Last one: a voice through a wall, with everything above ' + lv('muffled', 0, '3 kHz') + ' gone.' };
  }
  function steps() {
    return [
      { kind: 'caption', minMs: 3000, then: 'tap',
        text: 'Each phrase comes from an unusual voice. Tap the words you heard. Then the words appear and the voice plays again: that replay is where your ear retunes.' },
      { kind: 'demo', force: { dials: { fast: 0 } }, notes: { neighbour: 'sounds alike', number: 'another number', random: 'not in the phrase' },
        text: 'An example first: a fast talker, at ' + lv('fast', 0, '1.3×') + ' speed.' },
      { kind: 'practice', force: { dials: { fast: 0 }, answerAt: [2, 1] },
        text: 'Your turn: the same speed, a new phrase.' },
      { kind: 'practice', force: { dials: { phone: 0 }, answerAt: [0, 3] },
        text: 'Next, a voice on a phone line.' },
      lastStep(),
      { kind: 'caption', minMs: 3500, then: 'tap',
        text: 'From here new kinds of voices take turns. Each starts easy and gets harder as you adapt; the first few of a new kind are warm-ups and do not move your level.' }
    ];
  }
  M.tutorial = {};
  Object.defineProperty(M.tutorial, 'steps', { get: steps, enumerable: true });

  // Night out venues that use this exercise: read from the game's map (ES.game.venues), else this list.
  var VENUES = ['cafe', 'party', 'concert', 'lecture', 'station', 'phone'];
  Object.defineProperty(M, 'venues', { enumerable: true, get: function () { var k = K(); return k ? k.venuesOf(M.id, VENUES) : VENUES.slice(); } });

  ES.ex.strange = M;
})(typeof window !== 'undefined' ? window : globalThis);
