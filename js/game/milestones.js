/* ES.game.milestones — growth in real units (pure; loads in Node). Milestones mark abilities, never time spent: a
   dial's claim (core.claim: the careful side of the threshold estimate, m − 1.28 SD in the dial's harder direction,
   from at least MIN_N updates, and never beyond the hardest level of that dial the player has been tested at)
   reaching a level, knowing cast voices, opening a whole line of venues (fix round 2, RV-play P2, FRESH-B C3). Every text is generated from
   the engine's dial definitions, so numbers match the code. Milestones are informational: the app shows the ones
   reached and only the next one per dial, never a wall of locked badges (R5 §5.2, §5.5).
   Level-up lines: dials that moved at least one display step harder during a set ("Distance: 4 m → 6 m").
   Venue bests: a venue's earshot beyond its stored best. Record: game.badges[id] = time; game.last[ctxKey] =
   {dial: m} after each set; game.venues[id].best. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.game = ES.game || {};
  var MIN_N = 6;

  // [ex, dial, levels (dial units: dB or level index), names for some levels]
  var LADDERS = [
    ['crowd', 'tmr', [6, 3, 0, -3, -6, -9, -12], { 6: 'Picking a voice out', 3: 'Tuning in', 0: 'Equal footing', '-3': 'Under the chatter',
      '-6': 'Through the crowd', '-9': 'Deep in the crowd', '-12': 'Needle in the noise' }],
    ['crowd', 'talkers', [1, 2], { 1: 'Two at once', 2: 'Three at once' }],
    ['crowd', 'similar', [1, 2, 3], { 1: 'Same-sex voices', 2: 'Close in pitch', 3: 'Near-twins' }],
    ['crowd', 'space', [3, 5, 7], {}],
    ['far', 'dist', [3, 5, 7, 9], { 3: 'Across the table', 5: 'Across the room', 7: 'Across the hall', 9: 'Across the square' }],
    ['far', 'rt60', [3, 5, 7, 8], {}],
    ['far', 'noise', [12, 6, 0], {}],
    ['strange', 'accent', [3, 5, 7], { 3: 'Accent ear' }],
    ['strange', 'fast', [2, 4, 6, 7], { 4: 'Twice as fast', 7: 'Three times as fast' }],
    ['strange', 'whisper', [2, 4, 5], {}],
    ['strange', 'phone', [2, 4, 5], {}],
    ['strange', 'muffled', [2, 4, 6], {}],
    ['strange', 'vocoded', [3, 5, 6], {}],
    ['repair', 'gap', [2, 4, 5], { 5: 'A whole word, repaired' }],
    ['repair', 'context', [2], {}],
    ['repair', 'gate', [2, 4], {}],
    ['repair', 'fill', [3], { 3: 'Silent gaps' }],
    ['echo', 'snr', [10, 5, 0, -5], {}],
    ['echo', 'details', [2, 3], {}],
    ['echo', 'rate', [2, 4], {}],
    ['echo', 'delay', [2, 3], {}],
    ['seek', 'snr', [6, 0, -6], {}],
    ['seek', 'decoys', [2, 4], {}],
    ['seek', 'size', [2, 4], {}],
    ['seek', 'gap', [2, 4], {}],
    ['voices', 'cast', [2, 4], {}],
    ['voices', 'similar', [2], {}],
    ['voices', 'snr', [12, 6, 0], {}],
    ['voices', 'length', [2], { 2: 'A voice from one word' }]
  ];
  var CAST = [5, 10, 20];

  function K() { return ES.game.core; }
  function idOf(ex, dial, at) { return ex + '.' + dial + '@' + at; }
  function exName(ex) { return ES.game.venues ? ES.game.venues.exName(ex) : ex; }

  /** All dial milestones that exist for the current dial definitions: [{id, ex, dial, at, name, text}]. */
  function all() {
    var out = [];
    LADDERS.forEach(function (row) {
      var d = K().dialDef(row[0], row[1]);
      if (!d) return;
      row[2].forEach(function (at) {
        if (d.kind === 'ord' && (at < d.min || at > d.max)) return;
        if (d.kind === 'cont' && (at < d.min || at > d.max)) return;
        var val = K().levelText(row[0], d, at), nf = NAME[row[0] + '.' + row[1]];
        var name = row[3][String(at)] || (nf ? nf(val, at) : d.label + ': ' + val);
        out.push({ id: idOf(row[0], row[1], at), ex: row[0], dial: row[1], at: at, name: name, text: lineFor(row[0], d, at, val), value: val });
      });
    });
    return out;
  }
  // One sentence per dial: what the player can now do at that level (val = the level in words, from the engine).
  var SAY = {
    'crowd.talkers': function (v) { return 'You follow one voice while ' + v + (/^1 /.test(v) ? ' talks' : ' talk') + ' over it'; },
    'crowd.similar': function (v) { return 'You follow a voice against ' + simWords(v); },
    'crowd.space': function (v) { return v === 'same place' ? 'You follow a voice with the others in the same place' : 'You follow a voice with the others only ' + v + ' away'; },
    'far.rt60': function (v) { return 'You catch the words through ' + v + ' of echo'; },
    'far.noise': function (v, at) { return 'You catch the words with ' + ES.game.venues.speechVsNoise(at); },
    'strange.accent': function (v, at, d) { var x = d.values[at] || {}; return 'You catch ' + K().phrase(v) + (x.snr === null || x.snr === undefined ? ' in quiet' : ' with ' + babble(x.snr)); },
    'strange.fast': function (v) { return 'You catch speech played ' + v + ' as fast'; },
    'strange.whisper': function (v, at, d) { var x = d.values[at]; return 'You catch a whisper' + (x === null || x === undefined ? ' in quiet' : ' with ' + babble(x)); },
    'strange.phone': function (v) { return 'You catch the words over ' + K().phrase(v); },
    'strange.muffled': function (v) { return 'You catch speech muffled down to ' + v; },
    'strange.vocoded': function (v) { return 'You catch robot-voiced speech with only ' + v; },
    'repair.gap': function (v) { return 'You repair a word when ' + v + ' of it is lost'; },
    'repair.context': function (v) { return 'You repair lost words with ' + v; },
    'repair.gate': function (v) { return 'You repair broken-up sentences with ' + v; },
    'repair.fill': function (v) { return 'You repair words lost to ' + v; },
    'echo.snr': function (v, at) { return 'You hold a message heard with ' + ES.game.venues.speechVsNoise(at); },
    'echo.details': function (v) { return 'You hold ' + v + ' from one message'; },
    'echo.rate': function (v) { return 'You hold a message spoken at ' + (v === 'normal' ? 'normal speed' : v + ' speed'); },
    'echo.delay': function (v) { return 'You hold a message for ' + v + ' before the questions'; },
    'seek.snr': function (v) { return 'You find and name a faint voice at ' + v + ' up close'; },
    'seek.decoys': function (v) { return 'You find the right voice among ' + v; },
    'seek.size': function (v) { return 'You find a voice with a ' + v + ' target'; },
    'seek.gap': function (v) { return 'You find a voice that calls every ' + v; },
    'voices.cast': function (v) { return 'You tell who is talking among ' + v; },
    'voices.similar': function (v) { return 'You tell ' + (v === 'mixed' ? 'mixed voices' : simWords(v)) + ' apart'; },
    'voices.snr': function (v, at) { return 'You tell who is talking with ' + ES.game.venues.speechVsNoise(at); },
    'voices.length': function (v) { return 'You tell who is talking from ' + v; }
  };
  function simWords(v) {
    return v === 'other sex' ? 'voices of the other sex' : v === 'near-twin voice' ? 'near-twin voices' : v === 'same sex' ? 'same-sex voices'
      : v === 'same sex, similar pitch' ? 'same-sex voices of similar pitch' : v + ' voices';
  }
  function babble(snr) { return snr > 0 ? 'speech ' + K().num(snr, 1) + ' dB above the babble' : snr < 0 ? 'babble ' + K().num(-snr, 1) + ' dB above the speech' : 'speech as loud as the babble'; }
  function cap(t) { t = String(t); return t.charAt(0).toUpperCase() + t.slice(1); }
  // Short names where a ladder row gives none (the row's own names win).
  var NAME = {
    'crowd.space': function (v) { return v === 'same place' ? 'Same place' : 'Only ' + v + ' apart'; },
    'far.rt60': function (v) { return v + ' of echo'; },
    'far.noise': function (v, at) { return at > 0 ? 'Room noise ' + K().num(at, 1) + ' dB below speech' : at === 0 ? 'Noise as loud as speech' : 'Noise above speech'; },
    'strange.accent': function (v) { return cap(v); }, 'strange.whisper': function (v) { return cap(v); }, 'strange.phone': function (v) { return cap(v); },
    'strange.fast': function (v) { return 'Speech at ' + v; }, 'strange.muffled': function (v) { return 'Muffled to ' + v; },
    'strange.vocoded': function (v) { return 'Robot voice, ' + v; },
    'repair.gap': function (v) { return v + ' of a word lost'; }, 'repair.context': function (v) { return cap(v); },
    'repair.gate': function (v) { return 'Broken up, ' + v; },
    'echo.snr': function (v) { return 'A message at ' + v; }, 'echo.details': function (v) { return cap(v) + ' held'; },
    'echo.rate': function (v) { return 'A message at ' + v + ' speed'; }, 'echo.delay': function (v) { return 'Held for ' + v; },
    'seek.snr': function (v) { return 'Found at ' + v; }, 'seek.decoys': function (v) { return 'Among ' + v; },
    'seek.size': function (v) { return cap(v) + ' target'; }, 'seek.gap': function (v) { return 'Calls every ' + v; },
    'voices.cast': function (v) { return 'Among ' + v; }, 'voices.similar': function () { return 'Close voices'; },
    'voices.snr': function (v) { return 'Who is talking at ' + v; }
  };
  function lineFor(ex, d, at, val) {
    if (ex === 'crowd' && d.id === 'tmr') {
      return at < 0 ? 'You follow a voice when each other voice is ' + K().num(-at, 1) + ' dB louder than it, about 7 times in 10.'
        : at > 0 ? 'You follow a voice that is ' + K().num(at, 1) + ' dB louder than each other voice, about 7 times in 10.'
          : 'You follow a voice as loud as each voice around it, about 7 times in 10.';
    }
    if (ex === 'far' && d.id === 'dist') return 'You catch the words from ' + val + ' away, about 7 times in 10.';
    var f = SAY[ex + '.' + d.id];
    return (f ? f(val, at, d) : exName(ex) + ' · ' + d.label + ': ' + val) + ', about 7 times in 10.';
  }
  /** Is the dial's claim at least as hard as `at`: the careful side of the estimate passes it, from enough of the
      player's own trials, and the player has been tested at that level or harder? Both Crowd contexts count. */
  function reached(ex, dial, at) {
    var d = K().dialDef(ex, dial);
    if (!d) return false;
    var cks = [K().ctxKey(ex, false), K().ctxKey(ex, true)].filter(function (c, i, a) { return a.indexOf(c) === i; });
    return cks.some(function (ck) {
      var c = K().claim(ex, d, ck);
      return !!c && c.n >= MIN_N && d.dir * (c.value - at) >= -1e-9;
    });
  }
  /** Milestones reached now that the record does not hold yet: [{id, name, text, kind}]. */
  function check(rec, opts) {
    opts = opts || {};
    rec = rec || K().rec();
    var have = rec.badges || {}, out = [];
    all().forEach(function (m) {
      if (have[m.id] || (opts.ex && m.ex !== opts.ex)) return;
      if (reached(m.ex, m.dial, m.at)) out.push({ id: m.id, kind: 'dial', ex: m.ex, dial: m.dial, name: m.name, text: m.text, value: m.value });
    });
    if (ES.game.cast) {
      var known = ES.game.cast.counts(rec).known;
      CAST.forEach(function (n) {
        var id = 'cast.known@' + n;
        if (!have[id] && known >= n) out.push({ id: id, kind: 'cast', name: 'You know ' + n + ' voices', text: 'You picked out each of ' + n + ' cast voices at least ' + ES.game.cast.KNOWN_AT + ' times in “Who is talking?”.' });
      });
    }
    if (ES.game.venues && opts.venues) {
      var st = opts.venues, D = ES.game.data;
      D.LINES.forEach(function (l) {
        var id = 'line.' + l.id;
        if (have[id] || l.venues.length < 2) return;
        if (l.venues.every(function (v) { return st.some(function (s) { return s.id === v && s.open; }); })) {
          out.push({ id: id, kind: 'line', name: 'Line complete: ' + l.name, text: 'Every venue on the ' + l.name + ' line is open.' });
        }
      });
      if (!have['venues.all'] && st.length && st.every(function (s) { return s.open; })) {
        out.push({ id: 'venues.all', kind: 'line', name: 'The whole night out', text: 'All twelve venues are within your earshot.' });
      }
    }
    return out;
  }
  /** Reached milestones with their times, newest first: [{id, at, name, text}]. */
  function reachedList(rec) {
    rec = rec || K().rec();
    var b = rec.badges || {}, byId = {};
    all().forEach(function (m) { byId[m.id] = m; });
    return Object.keys(b).map(function (id) {
      var m = byId[id], cast = /^cast\.known@(\d+)$/.exec(id), line = /^line\.(\w+)$/.exec(id);
      var name = m ? m.name : cast ? 'You know ' + cast[1] + ' voices' : line ? 'Line complete: ' + ((ES.game.data.line(line[1]) || {}).name || line[1])
        : id === 'venues.all' ? 'The whole night out' : id;
      return { id: id, at: b[id], name: name, text: m ? m.text : '', ex: m ? m.ex : null, dial: m ? m.dial : null };
    }).sort(function (a, b2) { return b2.at - a.at; });
  }
  /** The next milestone per dial with data (the one just beyond the estimate). */
  function nextUp(rec) {
    rec = rec || K().rec();
    var have = rec.badges || {}, seen = {}, out = [];
    all().forEach(function (m) {
      var key = m.ex + '.' + m.dial;
      if (seen[key] || have[m.id] || reached(m.ex, m.dial, m.at)) return;
      var d = K().dialDef(m.ex, m.dial), c = K().claim(m.ex, d);
      if (!c || c.n < MIN_N) return;
      seen[key] = 1;
      out.push({ id: m.id, ex: m.ex, dial: m.dial, name: m.name, value: m.value, now: K().levelText(m.ex, d, c.value), text: m.text });
    });
    return out;
  }

  // ---- level-ups and bests
  /** {dial: {m, s, n}} for every dial of ex with data in context ck. */
  function snapshot(ex, ck) {
    var L = K().learner(), out = {};
    if (!L || !L.active) return out;
    ck = ck || K().ctxKey(ex);
    L.active(ex, { ctxKey: ck, allFamilies: true }).forEach(function (d) {
      var e = K().est(ex, d, ck);
      if (e && !e.prior && e.n > 0) out[d.id] = { m: Math.round(e.m * 1000) / 1000, s: Math.round(e.s * 1000) / 1000, n: e.n };
    });
    return out;
  }
  /** Dials that moved at least one display step harder: [{dial, from, to, text}]. Same estimate as the results facts
      (the posterior mean); a line appears only when the new level is one the player has been tested at (no claim
      beyond what was heard), and first estimates are left to the facts line (RV-play P3, FRESH-B C3). */
  function levelUps(ex, before, after) {
    var out = [];
    Object.keys(after || {}).forEach(function (id) {
      var d = K().dialDef(ex, id), a = after[id], b = before && before[id];
      if (!d || !a || a.n < 3 || !b) return;
      var t = K().testedMax(ex, id), shown = d.kind === 'ord' ? Math.floor(a.m + 1e-9) : Math.round(a.m * 2) / 2;
      if (t === null || d.dir * (shown - t) > 1e-9) return;
      var moved = d.kind === 'ord' ? d.dir * (Math.floor(a.m + 1e-9) - Math.floor(b.m + 1e-9)) >= 1
        : d.dir * (Math.round(a.m * 2) / 2 - Math.round(b.m * 2) / 2) >= 1 - 1e-9;
      if (moved) out.push({ dial: id, from: b.m, to: a.m, first: false, text: d.label + ': ' + K().levelText(ex, d, b.m) + ' → ' + K().levelText(ex, d, a.m) });
    });
    return out;
  }
  /** Is venue earshot e better than the stored best by a step (1 dB, or one level)? */
  function venueBetter(v, e, best) {
    if (!e || (e.status !== 'in' && e.status !== 'beyond') || e.x === null) return false;
    if (best === undefined || best === null) return true;
    var d = K().dialDef(v.head.ex, v.head.dial);
    return d.kind === 'ord' ? d.dir * (Math.floor(e.x + 1e-9) - Math.floor(best + 1e-9)) >= 1 : d.dir * (e.x - best) >= 1 - 1e-9;
  }

  // ---- levels over time (Progress): one point per session and dial, from the session's last set of the exercise.
  // Only entries that carry the engine's estimates count (flow entries with `sd`, or summaries with `dials`):
  // fallback entries hold a trial's level, not an estimate, and weekly runs sit at fixed levels.
  function endValues(e) {
    var out = {};
    if (!e || !e.end || typeof e.end !== 'object') return null;
    if (Array.isArray(e.end.dials)) { e.end.dials.forEach(function (x) { if (x && typeof x.m === 'number' && x.n > 0) out[x.id] = { y: x.m, s: x.s }; }); return out; }
    if (!e.sd) return null;
    Object.keys(e.end).forEach(function (k) { if (typeof e.end[k] === 'number' && isFinite(e.end[k])) out[k] = { y: e.end[k], s: typeof e.sd[k] === 'number' ? e.sd[k] : null }; });
    return out;
  }
  /** {ex: {ctxKey: {dial: [{t, y, s}]}}} from the log, oldest first. */
  function series(log) {
    var out = {}, ss = ((log && log.sessions) || []).filter(function (x) { return x && x.start && !x.demo; }).slice().sort(function (a, b) { return a.start - b.start; });
    ss.forEach(function (sess) {
      var lastBy = {};
      (sess.sets || []).forEach(function (e) { if (e && e.ex && e.kind !== 'weekly' && endValues(e)) lastBy[e.ex + '|' + (e.ctxKey || e.ex)] = e; });
      Object.keys(lastBy).forEach(function (k) {
        var e = lastBy[k], ex = e.ex, ck = e.ctxKey || ex, vals = endValues(e), t = sess.end || sess.start;
        Object.keys(vals).forEach(function (dial) {
          if (!K().dialDef(ex, dial)) return;
          var a = ((out[ex] = out[ex] || {})[ck] = out[ex][ck] || {})[dial] = (out[ex][ck][dial] || []);
          a.push({ t: t, y: vals[dial].y, s: vals[dial].s });
        });
      });
    });
    return out;
  }
  /** The hardest level a series reached (dial units). */
  function bestOf(ex, dial, pts) {
    var d = K().dialDef(ex, dial), b = null;
    (pts || []).forEach(function (p) { if (b === null || d.dir * (p.y - b) > 0) b = p.y; });
    return b;
  }

  ES.game.milestones = { MIN_N: MIN_N, LADDERS: LADDERS, all: all, reached: reached, check: check, reachedList: reachedList, nextUp: nextUp,
    snapshot: snapshot, levelUps: levelUps, venueBetter: venueBetter, series: series, endValues: endValues, bestOf: bestOf };
})(typeof window !== 'undefined' ? window : globalThis);
