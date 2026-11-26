/* ES.game.weekly — the Weekly Night Out (pure; loads in Node with the engine and data). One seeded challenge per
   ISO week (the player's own calendar week, "2026-W48"), identical for everyone on the same build: four stops
   (Crowd, Far, Strange voices, Repair) in a seeded order, each at a seeded venue, six trials per stop on a fixed
   easy → hard ramp of the stop's dial. Every trial comes from the engine's generators with an rng derived from
   the week and a fixed context (a fresh prior learner, fixed variety, a fixed voice order, no headphones), so no
   part of the player's record can change it (tests/unit/game-weekly.test.mjs). No leaderboards: the card shows
   your own night, spoiler-free (✓/✕ per trial, the furthest level per stop), and always carries the Chimera link.
   The first complete run of a week is that week's card; later runs are practice and keep the card as it was.
   Record: game.weekly[week] = {v, ver, at, stops:{k:{marks, at}}, done, practice}. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.game = ES.game || {};
  var VERSION = 'w1', LINK = 'https://discord.gg/chmr', ORDER = ['crowd', 'far', 'strange', 'repair'];
  // Candidate stops per exercise: [venue, ramp (dial units: dB, or level indices)]; Strange names its family dial.
  // Ramps span what simulated learners reach in their first sessions (first rungs) to their sixth week (last
  // rungs), from tests/unit/game-calibrate.mjs; see docs/dev/progress/game.md.
  var STOPS = {
    crowd: [['cafe', [9, 5, 1, -3, -6, -9]], ['restaurant', [9, 5, 2, -2, -5, -8]], ['bar', [10, 6, 3, 0, -3, -6]]],
    far: [['lecture', [1, 3, 4, 5, 6, 7]], ['park', [0, 2, 3, 4, 5, 6]], ['station', [0, 1, 2, 3, 4, 5]]],
    strange: [['cafe', [0, 1, 3, 4, 5, 6], 'accent'], ['station', [0, 2, 3, 4, 5, 6], 'fast'], ['phone', [0, 1, 2, 3, 4, 5], 'phone'],
      ['party', [0, 1, 2, 3, 4, 5], 'muffled'], ['lecture', [0, 1, 2, 3, 4, 5], 'whisper'], ['concert', [0, 1, 2, 3, 4, 5], 'vocoded']],
    repair: [['cafe', [0, 1, 2, 3, 4, 5]], ['bar', [0, 1, 2, 3, 4, 5]]]
  };
  var cache = {};

  function K() { return ES.game.core; }
  function E() { return ES.engine || {}; }
  function weekKey(ms) {
    var U = ES.core && ES.core.util;
    if (U && U.weekKey) return U.weekKey(ms);
    var d = new Date(ms == null ? Date.now() : ms), t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    t.setDate(t.getDate() - (t.getDay() + 6) % 7 + 3);
    var f = new Date(t.getFullYear(), 0, 4);
    return t.getFullYear() + '-W' + ('0' + (1 + Math.round(((t - f) / 864e5 - 3 + (f.getDay() + 6) % 7) / 7))).slice(-2);
  }
  function validWeek(wk) { return typeof wk === 'string' && /^\d{4}-W\d{2}$/.test(wk); }
  function weekLabel(wk) { var m = /^(\d{4})-W(\d{2})$/.exec(wk || ''); return m ? 'Week ' + (+m[2]) + ', ' + m[1] : String(wk); }
  function dataVersion() { var m = ES.data && ES.data.manifest; return m && m.version ? String(m.version) : 'none'; }
  /** What must match for two players to have played the same night: app version, weekly rules, data build. */
  function identity() { return 'v' + (ES.VERSION || '0') + ' · ' + VERSION + ' · ' + dataVersion(); }
  function seedOf(wk) { return 'weekly:' + wk + ':' + VERSION; }

  /** The week's route: four stops {k, ex, venue, dial, family, pins, ramp, name, exName}. */
  function route(wk) {
    wk = validWeek(wk) ? wk : weekKey();
    var r = ES.core.rng(seedOf(wk)), order = r.shuffle(ORDER), D = ES.game.data;
    var stops = order.map(function (ex, k) {
      var opts = STOPS[ex], pick = opts[r.int(0, opts.length - 1)], v = D.venue(pick[0]);
      var cond = v.head.ex === ex && (!pick[2] || v.head.dial === pick[2]) ? v.head
        : v.also.filter(function (c) { return c.ex === ex && (!pick[2] || c.dial === pick[2]); })[0];
      var d = K().dialDef(ex, cond.dial), pins = {};
      Object.keys(cond.pin || {}).forEach(function (id) { if (id !== 'space') pins[id] = cond.pin[id]; });   // no headphones: identical for all
      return { k: k, ex: ex, venue: v.id, name: v.name, dial: cond.dial, family: d && d.family ? d.family : null, pins: pins,
        ramp: pick[1].slice(), exName: ES.game.venues.exName(ex), label: d ? d.label : cond.dial };
    });
    return { week: wk, seed: seedOf(wk), version: VERSION, identity: identity(), stops: stops };
  }
  /** The six TrialSpecs of stop k (cached per week and data build). Throws when the data cannot make them. */
  function trials(wk, k) {
    var key = wk + '|' + k + '|' + dataVersion();
    if (cache[key]) return cache[key];
    var st = route(wk).stops[k], gen = E().items && E().items[st.ex];
    if (!st || !gen || typeof gen.make !== 'function') throw new Error('weekly: no generator for ' + (st && st.ex));
    var lr0 = E().learner && typeof E().learner.create === 'function' ? E().learner.create() : null;
    var ctx = { breadth: 0.5, headphones: false, recentVoices: [], playerSeed: 'weekly:' + wk, learner: lr0, lastRoom: null,
      family: st.family, avoidVoices: null, tutorial: false };
    var out = st.ramp.map(function (lvl, i) {
      var dials = {};
      Object.keys(st.pins).forEach(function (id) { dials[id] = st.pins[id]; });
      dials[st.dial] = lvl;
      var setting = { dials: dials, focus: st.dial, anchor: false, warmup: false, seed: seedOf(wk) + ':' + k + ':' + i };
      var t = gen.make(ES.core.rng(seedOf(wk) + ':' + k + ':' + i), setting, ctx);
      var v = t.meta && t.meta.voices && t.meta.voices[0];
      if (v) { ctx.recentVoices = [v].concat(ctx.recentVoices).slice(0, 3); }
      if (t.meta && t.meta.room) ctx.lastRoom = t.meta.room;
      t.seed = setting.seed;
      t.meta = t.meta || {};
      t.meta.weekly = { week: wk, stop: k, rung: i };
      t.meta.levelText = 'Stop ' + (k + 1) + ' of 4 · ' + K().levelText(st.ex, st.dial, lvl);
      return t;
    });
    cache[key] = out;
    return out;
  }
  /** Can this build make the week's trials? {ok, reason}. */
  function available(wk) {
    wk = validWeek(wk) ? wk : weekKey();
    try { for (var k = 0; k < ORDER.length; k++) trials(wk, k); return { ok: true }; }
    catch (e) { return { ok: false, reason: String(e && e.message || e) }; }
  }

  // ---- results
  function entry(rec, wk) { var w = (rec && rec.weekly) || {}; return w[wk] || null; }
  /** Stop marks so far: {week, stops:[{k, venue, name, ex, marks:'110100'|null, right, n, furthest}], right, n, complete, at}. */
  function result(wk, rec) {
    rec = rec || K().rec();
    var rt = route(wk), en = entry(rec, wk) || {}, st = en.stops || {}, right = 0, n = 0;
    var stops = rt.stops.map(function (s) {
      var m = st[s.k] && typeof st[s.k].marks === 'string' ? st[s.k].marks : null, r = 0, far = -1;
      if (m) for (var i = 0; i < m.length; i++) if (m[i] === '1') { r++; far = i; }
      if (m) { right += r; n += m.length; }
      return { k: s.k, ex: s.ex, venue: s.venue, name: s.name, exName: s.exName, dial: s.dial, marks: m, right: r, n: m ? m.length : 0,
        furthest: far >= 0 ? K().levelText(s.ex, s.dial, s.ramp[far]) : null, rung: far };
    });
    return { week: wk, label: weekLabel(wk), identity: en.ver || identity(), stops: stops, right: right, n: n,
      complete: stops.every(function (s) { return s.marks; }), at: en.at || 0, practice: en.practice || [] };
  }
  /** Store one finished stop (inside store.update). marks = '1'/'0' per trial. The first complete run stays the card. */
  function recordStop(r, wk, k, marks, at) {
    r.weekly = r.weekly || {};
    var en = r.weekly[wk] = r.weekly[wk] || { v: 1, ver: identity(), stops: {}, done: 0, practice: [] };
    en.stops = en.stops || {};
    if (en.done) {                                     // already have this week's card: keep it, log the practice run
      en.practice = (en.practice || []).concat([{ k: k, marks: marks, at: at }]).slice(-40);
      return { practice: true, complete: false };
    }
    en.stops[k] = { marks: marks, at: at };
    en.at = en.at || at;
    var complete = ORDER.every(function (x, i) { return en.stops[i] && typeof en.stops[i].marks === 'string'; });
    if (complete) en.done = at;
    return { practice: false, complete: complete };
  }
  function marksOf(results) { return (results || []).map(function (x) { return x && x.correct ? '1' : '0'; }).join(''); }
  /** The session plan for the week's stops still to play (or all four for a practice run). */
  function plan(wk, opts) {
    opts = opts || {};
    wk = validWeek(wk) ? wk : weekKey();
    var rt = route(wk), res = result(wk, opts.rec), en = entry(opts.rec || K().rec(), wk), done = en && en.done;
    var todo = rt.stops.filter(function (s) { return done || opts.all || !res.stops[s.k].marks; });
    var sets = todo.map(function (s) {
      return { exId: s.ex, trials: s.ramp.length, kind: 'weekly', week: wk, stop: s.k, venue: s.venue, interlude: null,
        title: 'Weekly · ' + s.name + ' · ' + s.exName, make: function (i) { return copy(trials(wk, s.k)[i]); } };
    });
    return { kind: 'weekly', title: 'Weekly Night Out', week: wk, practice: !!done, sets: sets, done: { name: 'weekly', params: { week: wk, after: true } } };
  }
  function copy(t) { return JSON.parse(JSON.stringify(t)); }

  // ---- sharing (text); the image card is drawn by share.js from the same result
  function glyphs(marks) { return String(marks || '').split('').map(function (c) { return c === '1' ? '✓' : '✕'; }).join(''); }
  /** Plain text for chats: spoiler-free marks per stop, the total, the build, and always the Chimera link. */
  function shareText(res, opts) {
    opts = opts || {};
    var lines = ['Earshot · Weekly Night Out · ' + res.week + (opts.nickname ? ' · ' + opts.nickname : '')];
    (res.stops || []).forEach(function (s) {
      if (!s.marks) { lines.push(s.name + ' · not played'); return; }
      lines.push(s.name + ' ' + glyphs(s.marks) + (s.furthest ? '  (to ' + s.furthest + ')' : ''));
    });
    lines.push(res.right + '/' + (res.n || 24) + (res.complete ? '' : ' so far') + ' · ' + (res.identity || identity()));
    lines.push('Built by the Chimera community: ' + LINK);
    return lines.join('\n');
  }

  ES.game.weekly = { VERSION: VERSION, LINK: LINK, STOPS: STOPS, weekKey: weekKey, weekLabel: weekLabel, validWeek: validWeek, identity: identity,
    route: route, trials: trials, available: available, result: result, recordStop: recordStop, marksOf: marksOf, plan: plan, shareText: shareText,
    glyphs: glyphs, _clear: function () { cache = {}; } };
})(typeof window !== 'undefined' ? window : globalThis);
