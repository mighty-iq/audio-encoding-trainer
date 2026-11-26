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

  var FAM = { accent: 'Accent', fast: 'Fast talker', whisper: 'Whisper', phone: 'Phone line', muffled: 'Through a wall', vocoded: 'Robot voice' };

  var M = {
    id: 'strange', name: 'Strange voices',
    short: 'Accents, fast, whispered, phone and robot-like speech.',
    card: { trains: 'Accents, fast, whispered, phone-quality and robot-like speech. The words pop up after each try so your ear retunes.',
      bet: 'variety that teaches you to adapt to any new voice' },
    bet: 'Varied voices that train your ear to adapt to new ones, fast.',
    betNew: false,
    venues: ['phone', 'station', 'restaurant'],
    view: 'keyword', feedback: 'popout',
    strategies: ['strange.replay', 'strange.few', 'strange.noise'],
    tips: [
      'The replay with the words on screen is where the learning happens: you hear the hard voice again while knowing what it says.',
      'A new kind of voice takes a few tries. In one study half of the gain over 30 sentences came within the first three.',
      'The phrases are deliberately odd, so guessing from meaning does not work. Listen for the sounds.'
    ],
    helpData: function () {
      return {
        goal: 'Each phrase comes from an unusual voice: an accent, a fast talker, a whisper, a bad phone line, a voice through a wall or a robot voice. Tap the words you heard. Then the words appear and you hear the same voice again.',
        dialsTitle: 'The kinds of voice and how each gets harder',
        dials: {
          accent: 'Accented voices from mild to strong, first in quiet, then in babble that gets louder.',
          fast: 'Speech sped up without changing its pitch.',
          whisper: 'A whispered voice, first in quiet, then in rising noise.',
          phone: 'A phone line that gets thinner and noisier.',
          muffled: 'A voice through a wall: everything above a cut-off frequency is lost.',
          vocoded: 'A robot voice made of noise bands: the fewer bands, the less detail.'
        },
        why: 'Practising many kinds of unusual voice should train the skill of adapting itself. A large replication found the benefit of variety smaller than earlier studies suggested, so the Lab’s New voice check measures it with a kind of voice you never train on.'
      };
    }
  };

  function family(t) {
    var m = t.meta || {}, d = (t.setting && t.setting.dials) || {};
    if (m.family && FAM[m.family]) return m.family;
    for (var f in FAM) if (d[f] != null) return f;
    return null;
  }
  /** "Fast talker (1.9×)", "Mild accent, +10 dB", "Phone line (thin line)". */
  function kindText(t) {
    var k = K(), f = family(t);
    if (!f) return 'Unusual voice';
    var dl = k.dialOf('strange', f), s = (t.setting && t.setting.dials) || {}, lab = dl && s[f] != null ? k.fmt(dl, s[f]) : '';
    if (!lab) return FAM[f];
    if (f === 'accent' || f === 'whisper') return k.cap(lab);
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
  function steps() {
    return [
      { kind: 'caption', minMs: 3000, then: 'tap',
        text: 'Each phrase comes from an unusual voice. Tap the words you heard. Then the words appear and the voice plays again: that replay is where your ear retunes.' },
      { kind: 'demo', force: { dials: { fast: 0 } }, notes: { neighbour: 'sounds alike', random: 'not in the phrase' },
        text: 'An example first: a fast talker, at ' + lv('fast', 0, '1.3×') + ' speed.' },
      { kind: 'practice', force: { dials: { fast: 0 }, answerAt: [2, 1] },
        text: 'Your turn: the same speed, a new phrase.' },
      { kind: 'practice', force: { dials: { phone: 0 }, answerAt: [0, 3] },
        text: 'Next, a voice on a phone line.' },
      { kind: 'practice', force: { dials: { accent: 0 }, answerAt: [3, 0] },
        text: 'Last one: a mild accent.' },
      { kind: 'caption', minMs: 3500, then: 'tap',
        text: 'From here new kinds of voices take turns. Each starts easy and gets harder as you adapt; the first few of a new kind are warm-ups and do not move your level.' }
    ];
  }
  M.tutorial = {};
  Object.defineProperty(M.tutorial, 'steps', { get: steps, enumerable: true });

  ES.ex.strange = M;
})(typeof window !== 'undefined' ? window : globalThis);
