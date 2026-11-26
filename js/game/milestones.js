/* ES.game.milestones — growth in real units (pure; loads in Node). Milestones mark abilities, never time spent: a
   dial's threshold estimate (the level where the player gets about 7 in 10 right, from at least MIN_N updates of
   that dial) reaching a level, knowing cast voices, opening a whole line of venues. Every text is generated from
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
    ['echo', 'details', [2, 3], { 3: 'Five details held' }],
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
        var val = K().levelText(row[0], d, at), name = row[3][String(at)] || (d.label + ': ' + val);
        out.push({ id: idOf(row[0], row[1], at), ex: row[0], dial: row[1], at: at, name: name, text: lineFor(row[0], d, at, val), value: val });
      });
    });
    return out;
  }
  function lineFor(ex, d, at, val) {
    if (ex === 'crowd' && d.id === 'tmr') {
      return at < 0 ? 'You follow a voice when each other voice is ' + K().num(-at, 1) + ' dB louder than it, about 7 times in 10.'
        : at > 0 ? 'You follow a voice that is ' + K().num(at, 1) + ' dB louder than each other voice, about 7 times in 10.'
          : 'You follow a voice as loud as each voice around it, about 7 times in 10.';
    }
    if (ex === 'far' && d.id === 'dist') return 'You catch the words from ' + val + ' away, about 7 times in 10.';
    return exName(ex) + ' · ' + d.label + ': ' + val + ', about 7 times in 10.';
  }
  /** Is the dial's estimate at least as hard as `at` (from enough of the player's own trials)? Both Crowd contexts
      (with and without headphones) count. */
  function reached(ex, dial, at) {
    var d = K().dialDef(ex, dial);
    if (!d) return false;
    var cks = [K().ctxKey(ex, false), K().ctxKey(ex, true)].filter(function (c, i, a) { return a.indexOf(c) === i; });
    return cks.some(function (ck) {
      var e = K().est(ex, d, ck);
      return e && !e.prior && e.n >= MIN_N && d.dir * (e.m - at) >= -1e-9;
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
      var d = K().dialDef(m.ex, m.dial), e = K().est(m.ex, d);
      if (!e || e.prior || e.n < MIN_N) return;
      seen[key] = 1;
      out.push({ id: m.id, ex: m.ex, dial: m.dial, name: m.name, value: m.value, now: K().levelText(m.ex, d, e.m), text: m.text });
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
  /** Dials that moved at least one display step harder: [{dial, from, to, text, first}]. */
  function levelUps(ex, before, after) {
    var out = [];
    Object.keys(after || {}).forEach(function (id) {
      var d = K().dialDef(ex, id), a = after[id], b = before && before[id];
      if (!d || !a || a.n < 3) return;
      if (!b) { out.push({ dial: id, from: null, to: a.m, first: true, text: d.label + ': ' + K().levelText(ex, d, a.m) + ' (first estimate)' }); return; }
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

  ES.game.milestones = { MIN_N: MIN_N, LADDERS: LADDERS, all: all, reached: reached, check: check, reachedList: reachedList, nextUp: nextUp,
    snapshot: snapshot, levelUps: levelUps, venueBetter: venueBetter };
})(typeof window !== 'undefined' ? window : globalThis);
