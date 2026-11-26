/* Earshot — Crowd (exercise view; CONTRACTS §11). Follow the call-sign voice among 1–3 others over a background
   bed and tap its word and number. The shell's Play screen runs it from the engine's TrialSpecs
   (js/engine/items/crowd.js); this module supplies the copy (Home, map, Help), the two-minute tutorial, the
   strategy cards and the presentation hooks: prepare(trial) → prompt, picture (who stands where), replays;
   review(trial, result) → which voice a picked word came from (the intrusion message), with "your voice alone"
   then "the crowd again" replayed after a miss. Shared helpers: ES.ex._kit (js/ex/strategies.js), used inside
   functions only, so the load order among js/ex/* does not matter. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.ex = ES.ex || {};
  function K() { return ES.ex._kit; }

  var M = {
    id: 'crowd', name: 'Crowd',
    short: 'Follow one voice while others talk over it.',
    card: { trains: 'Follow one voice while others talk over it. The crowd gets louder, more alike and closer together as you improve.',
      bet: 'attention control and voice cues against competing talkers' },
    bet: 'Attention control and voice and place cues against competing talkers; ever-changing crowds aim to keep the skill general.',
    betNew: false,
    venues: ['cafe', 'restaurant', 'bar', 'party', 'club', 'concert'],
    view: 'keyword', feedback: 'standard',
    strategies: ['crowd.lock-on', 'crowd.borrowed', 'crowd.space'],
    tips: [
      'The call sign comes first. Lock on to that voice, its pitch, pace and place, and let it lead you to the words.',
      'A wrong word that another voice said means you heard well and followed the wrong talker. In a classic study most mistakes against a same-sex voice were of this kind.',
      'The closer two voices are in pitch, size and place, the harder it gets; pitch and size differences together help more than either alone. With headphones, even 10 to 15° between voices helps a lot.'
    ],
    helpData: function () {
      return {
        goal: 'One voice says a call sign, then a word and a number. Follow it through the crowd and tap what it said. The other voices say words and numbers too.',
        dials: {
          tmr: 'How loud your voice is against each other voice. Above 0 dB yours is louder; below 0 dB the others are louder.',
          talkers: 'How many other voices talk at the same time.',
          similar: 'How alike the other voices sound, from the other sex to a near-twin of your voice.',
          space: 'How far apart the voices stand around you. Unlocks once the headphone check passes.'
        },
        why: 'Most of the difficulty in a crowd is choosing which talker to follow, not hearing the words. Crowd trains that choice with call signs, voices and places. In one study, gains from practice in babble did not carry over to babble in another language, so the crowd here keeps changing: voices, sexes, numbers of talkers and backgrounds.'
      };
    }
  };

  /* ---- who is who ---- */
  function cueOf(t) { return (t.meta && t.meta.cue) || 'callsign'; }
  function callSign(t) {
    var m = t.meta || {};
    if (cueOf(t) !== 'callsign') return null;
    if (m.callSign) return String(m.callSign);
    if (m.items && m.items[0]) return String(m.items[0]);
    var v = ((t.picture && t.picture.voices) || []).filter(function (x) { return x.role === 'target'; })[0];
    return v && v.label ? String(v.label) : null;
  }
  function targetAz(t) {
    var v = ((t.picture && t.picture.voices) || []).filter(function (x) { return x.role === 'target'; })[0];
    return v ? v.az || 0 : 0;
  }
  function where(az) { return ES.ui && ES.ui.field && ES.ui.field.where ? ES.ui.field.where(az) : 'ahead'; }
  function spatial(t) { return !!(t.audio && t.audio.spatial && t.audio.spatial !== 'mono'); }
  /** How the feedback names the voice to follow: "Comet", "the first voice", "the voice on your left". */
  function subject(t) {
    var cs = callSign(t), cue = cueOf(t);
    if (cs) return cs;
    if (cue === 'preview') return 'the first voice';
    if (cue === 'location') return 'the voice ' + where(targetAz(t));
    return 'your voice';
  }
  /** Which voice said a word: "the blue voice ahead-left", "the near-twin voice", "the other voice". */
  function whoSaid(t, word) {
    var ms = (t.meta && t.meta.maskers) || [], w = String(word).toLowerCase(), pic = (t.picture && t.picture.voices) || [];
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i];
      if ([m.word, m.num, m.name].some(function (x) { return x != null && String(x).toLowerCase() === w; })) {
        if (m.near) return 'the near-twin voice';
        var v = pic.filter(function (x) { return x.id === 'v' + (i + 1); })[0];
        if (spatial(t) && v && typeof v.az === 'number' && Math.abs(v.az - targetAz(t)) >= 10) return 'the blue voice ' + where(v.az);
        return ms.length > 1 ? 'another voice' : 'the other voice';
      }
    }
    return ms.length > 1 ? 'another voice' : 'the other voice';
  }

  /* ---- presentation hooks ---- */
  function picture(t) {
    var k = K(), base = k.clone(t.picture) || { voices: [] }, vs = (base.voices || []).map(k.clone);
    if (!vs.length) {
      var n = ((t.meta && t.meta.maskers) || []).length;
      vs.push({ id: 'v0', role: 'target', az: 0, dist: 1 });
      for (var i = 0; i < n; i++) vs.push({ id: 'v' + (i + 1), role: 'other', az: 0, dist: 1 });
    }
    var cs = callSign(t), cue = cueOf(t);
    vs.forEach(function (v) {
      v.dist = 1.5;
      if (v.role === 'target') v.label = cs || (cue === 'preview' ? 'first voice' : cue === 'location' ? 'this one' : '');
      else { v.role = v.role === 'decoy' ? 'decoy' : 'other'; v.label = ''; }
    });
    var same = !spatial(t);
    if (same) vs.forEach(function (v) { v.az = 0; });
    k.clusterSamePlace(vs, 1.5);
    base.voices = vs;
    base.maxDist = 2.6;
    base.title = (cs ? 'Voice to follow: ' + cs : 'The voice to follow is red') + '; ' +
      (vs.length - 1) + (vs.length === 2 ? ' other voice' : ' other voices') + (same ? ', all from the same place' : '');
    return base;
  }
  M.prepare = function (t) {
    var k = K();
    if (!t || !k || t._exA || t.ex !== 'crowd') return t;
    t._exA = true;
    var slots = k.slotsOf(t), labels = slots.map(function (s) { return String(s.label || '').toLowerCase(); }).filter(Boolean);
    var what = labels.length ? labels.join(' and ') : 'words', cs = callSign(t), cue = cueOf(t);
    if (t.question) {
      t.question.prompt = cue === 'preview' ? 'Follow the voice you hear first: tap the ' + what + ' it says next.'
        : cue === 'location' ? 'Follow the voice ' + where(targetAz(t)) + ': tap its ' + what + '.'
        : 'Follow ' + (cs || 'the red voice') + ': tap its ' + what + '.';
    }
    t.picture = picture(t);
    t.feedback = t.feedback || {};
    var alone = k.findReplay(t, /alone/i), again = k.findReplay(t, /again|mix|crowd/i);
    t.feedback.replays = [
      { label: (cs || 'Your voice') + ' alone', audio: alone ? alone.audio : k.audioAlone(t.audio) },
      { label: 'The crowd again', audio: again ? again.audio : t.audio }
    ];
    return t;
  };
  /** Feedback after scoring: the intrusion message when a picked word came from another voice; after a miss the
      voice alone, then the crowd again (auto). Returns {text, words, auto}. */
  M.review = function (t, result) {
    var k = K();
    if (!k || !result || !result.slots) return null;
    var who = subject(t), lines = [], borrowed = [], other = [];
    result.slots.forEach(function (r, i) {
      if (!r || r.correct) return;
      if (r.foil === 'masker' && r.picked != null) borrowed.push({ r: r, who: whoSaid(t, r.picked) });
      else other.push(k.missLine(t, i, r, k.cap(who)));
    });
    // Borrowed words from one voice read as one sentence: "“mat, eighteen” came from the other voice; Juno said “zinc, eighty”."
    var byWho = {};
    borrowed.forEach(function (b) { (byWho[b.who] = byWho[b.who] || []).push(b.r); });
    Object.keys(byWho).forEach(function (w) {
      var rs = byWho[w];
      lines.push(k.q(rs.map(function (r) { return r.picked; }).join(', ')) + ' came from ' + w + '; ' + who + ' said ' +
        k.q(rs.map(function (r) { return r.answer; }).join(', ')) + '.');
    });
    lines = lines.concat(other);
    if (borrowed.length) lines.push(cueOf(t) === 'callsign' ? 'You heard them right, from the wrong voice: lock on at the call sign.' : 'You heard them right, from the wrong voice: stay with yours from its first word.');
    if (result.correct) lines.push(k.cap(who) + ' said ' + k.q(result.slots.map(function (r) { return r.answer; }).join(', ')) + '.');
    return { text: lines.join(' '), words: null, auto: result.correct ? [] : [0, 1] };
  };
  M.helpBody = function (el) { return K().helpBody(M, el); };
  M.openHelp = function (opts) { return K().openHelp(M, opts); };
  M.tutorialTrial = function (step, i, rng) { return K().tutorialTrial(M, step, i, rng); };

  /* ---- two-minute tutorial: an example, then three practice trials from easy to a little harder ----
     Every dial is forced (ordinal = level index): talkers 0 = one other voice; similar 0 = other sex, 1 = same sex. */
  M.tutorial = { steps: [
    { kind: 'caption', minMs: 3000, then: 'tap',
      text: 'One voice says a call sign, then a word and a number. It is the red dot. Follow it and tap what it says.' },
    { kind: 'demo', force: { dials: { tmr: 12, talkers: 0, similar: 0 } },
      notes: { masker: 'the blue voice said this', neighbour: 'sounds alike', random: 'not said' },
      text: 'An example first. The blue voice talks quietly over the red one.' },
    { kind: 'practice', force: { dials: { tmr: 12, talkers: 0, similar: 0 }, answerAt: [2, 0] },
      text: 'Your turn. Listen for the call sign, then tap what that voice says.' },
    { kind: 'practice', force: { dials: { tmr: 3, talkers: 0, similar: 0 }, answerAt: [0, 3] },
      text: 'The blue voice is almost as loud now. Stay with the call sign.' },
    { kind: 'practice', force: { dials: { tmr: 6, talkers: 0, similar: 1 }, answerAt: [3, 1] },
      text: 'Now a voice of the same sex talks over it.' },
    { kind: 'caption', minMs: 3500, then: 'tap',
      text: 'From here the crowd adapts to you: louder, more alike, more voices, always near your edge. After each answer you can hear your voice alone, then the crowd again.' }
  ] };

  ES.ex.crowd = M;
})(typeof window !== 'undefined' ? window : globalThis);
