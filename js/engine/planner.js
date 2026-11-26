/* Earshot engine — session planner (PLAN §7). A session is ~3-minute sets from different exercises (default
   15 min → 5 sets). Default weights follow the owner's priorities: loud places (Crowd, Repair, Seek) > distance
   (Far) > unusual speech (Strange) > memory (Echo) > Voices. Listen-only exposure interludes (20–30 s, with the
   words) follow some Strange, Far and Repair sets (practice plus exposure: Wright 2010/2015). The first set of the
   first session of a calendar day re-tests the last training day's hardest condition with voices not in that set
   (overnight gains: Xie, Earle & Myers 2018); after ≥ 2 days away a "fresh ears" set opens instead. Absence is
   never penalised; after three sessions in a day the plan suggests coming back after sleep (Mednick 2002).
   Partial sets (ended early) never count as the hardest condition. Focus-mode sets carry `focusEx: true`. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var E = ES.engine = ES.engine || {};
  var W = { crowd: 0.20, repair: 0.12, seek: 0.08, far: 0.22, strange: 0.18, echo: 0.12, voices: 0.08 };
  var INTERLUDE = { strange: 1, far: 1, repair: 1 };
  var DAY = 86400000;

  function dayKey(t) { return new Date(t).toDateString(); }
  function timesText(n) { return (['', 'once', 'twice', 'three times', 'four times', 'five times', 'six times'][n] || n + ' times'); }
  function sessions(log) { return ((log && log.sessions) || []).filter(function (s) { return s && s.start; }); }
  function weights(mode, opts) {
    opts = opts || {};
    var avail = opts.available || E.exercises, lr = E.lrOf(opts.learner), w = {};
    avail.forEach(function (ex) {
      var base = mode === 'variety' ? 1 : (W[ex] || 0.05);
      var pl = lr.state.plat[ex];
      if (pl && pl.rest > 0) base *= 0.2;
      w[ex] = base;
    });
    if (mode === 'focus' && opts.lab && opts.lab.weakest && E.controller.PROBE_MAP[opts.lab.weakest]) {
      var fx = E.controller.PROBE_MAP[opts.lab.weakest].ex;
      if (w[fx] !== undefined) {
        var rest = 0; Object.keys(w).forEach(function (k) { if (k !== fx) rest += w[k]; });
        Object.keys(w).forEach(function (k) { w[k] = k === fx ? 0.6 : 0.4 * w[k] / (rest || 1); });
      }
    }
    return w;
  }

  function overnight(opts) {
    opts = opts || {};
    var lr = E.lrOf(opts.learner), now = opts.now || lr.clock(), ss = sessions(opts.log);
    if (!ss.length) return null;
    var today = dayKey(now), prev = ss.filter(function (s) { return dayKey(s.start) !== today && s.start < now; });
    // only the first session of a calendar day opens with it (review M4)
    if (ss.some(function (s) { return dayKey(s.start) === today && s.start <= now; })) return null;
    if (!prev.length) return null;
    var lastDay = dayKey(prev[prev.length - 1].start);
    if (now - prev[prev.length - 1].start > 2 * DAY) return null;
    var sets = [];
    prev.filter(function (s) { return dayKey(s.start) === lastDay; }).forEach(function (s) { (s.sets || []).forEach(function (t) { sets.push(t); }); });
    sets = sets.filter(function (t) { return t.focus && !t.partial && t.learn !== false && t.end && t.end[t.focus] !== undefined && (opts.available || E.exercises).indexOf(t.ex) >= 0; });
    if (!sets.length) return null;
    // hardest condition = the focus dial that ended furthest above its prior (in its own SDs)
    var best = null, bz = -Infinity;
    sets.forEach(function (t) {
      var d = E.dialDef(t.ex, t.focus); if (!d) return;
      var z = d.dir * (t.end[t.focus] - d.prior.m) / d.prior.s;
      if (z > bz) { bz = z; best = t; }
    });
    if (!best) return null;
    var d = E.dialDef(best.ex, best.focus), dials = {};
    dials[best.focus] = d.kind === 'ord' ? Math.max(d.min, Math.min(d.max, Math.round(best.end[best.focus]))) : lr.snap(d, best.end[best.focus]);
    // "Yesterday" only when the last training day was the previous calendar day (it can be up to 48 h back)
    var when = lastDay === dayKey(now - DAY) ? 'Yesterday\'s hardest: ' : 'Your last day\'s hardest: ';
    return { exId: best.ex, hint: { focus: best.focus, family: d.family || null, dials: dials, p: E.model.target }, avoidVoices: best.voices || [],
      text: when + d.label.toLowerCase() + ' at ' + (d.kind === 'ord' ? d.levels[dials[best.focus]] : dials[best.focus] + ' ' + d.unit) + ', now with a voice that was not in that set.' };
  }
  function freshEars(opts) {
    opts = opts || {};
    var lr = E.lrOf(opts.learner), now = opts.now || lr.clock(), ss = sessions(opts.log);
    if (!ss.length) return null;
    var last = ss[ss.length - 1], away = (now - (last.end || last.start)) / DAY;
    if (away < 2) return null;
    var cnt = {};
    ss.slice(-10).forEach(function (s) { (s.sets || []).forEach(function (t) { cnt[t.ex] = (cnt[t.ex] || 0) + (W[t.ex] || 0.05) * t.n; }); });
    var avail = opts.available || E.exercises, ex = Object.keys(cnt).filter(function (k) { return avail.indexOf(k) >= 0; }).sort(function (a, b) { return cnt[b] - cnt[a]; })[0] || avail[0];
    return { exId: ex, daysAway: Math.floor(away), text: 'Fresh ears: ' + Math.floor(away) + ' days away. A gentle start, then we check how much of your edge you kept.' };
  }

  function session(opts) {
    opts = opts || {};
    var lr = E.lrOf(opts.learner), mode = opts.mode || 'edge', now = opts.now || lr.clock(), rng = opts.rng || ES.core.rng('plan:' + now);
    // only exercises with material in this build (items[ex].ready), among those the caller can run
    var minutes = opts.minutes || opts.sessionMin || 15, nSets = Math.max(1, Math.round(minutes / 3)), avail = (opts.available || E.exercises).filter(function (ex) {
      var g = E.items[ex]; if (!g) return false; try { return !g.ready || g.ready(); } catch (e) { return false; } });
    if (!avail.length) return { sets: [], minutes: minutes, notes: [{ kind: 'nodata', text: 'No exercise has its sounds installed yet.' }], mode: mode };
    var sets = [], notes = [], w = weights(mode, { available: avail, learner: lr, lab: opts.lab }), C = E.items.common;
    // sessions already logged today (this one is not in the log yet): the note opens the fourth and later sessions
    var today = sessions(opts.log).filter(function (s) { return dayKey(s.start) === dayKey(now) && s.start <= now; }).length;
    if (today >= 3) notes.push({ kind: 'sleep', times: today, text: 'You have trained ' + timesText(today) + ' today. Sleep consolidates practice, so tomorrow is a good time for the next session. Nothing is lost by stopping here.' });
    var fresh = freshEars({ learner: lr, now: now, log: opts.log, available: avail });
    var night = fresh ? null : overnight({ learner: lr, now: now, log: opts.log, available: avail });
    if (mode === 'free' && opts.exId) {
      for (var f = 0; f < nSets; f++) sets.push({ exId: opts.exId, trials: E.dialMeta[opts.exId].setTrials, kind: 'normal', interlude: null });
      return { sets: sets, minutes: minutes, notes: notes };
    }
    if (fresh) sets.push({ exId: fresh.exId, trials: E.dialMeta[fresh.exId].setTrials, kind: 'fresh', daysAway: fresh.daysAway, text: fresh.text, interlude: null });
    else if (night && mode !== 'path') sets.push({ exId: night.exId, trials: E.dialMeta[night.exId].setTrials, kind: 'overnight', hint: night.hint, avoidVoices: night.avoidVoices, text: night.text, interlude: null });
    var used = {};
    sets.forEach(function (s) { used[s.exId] = 1; });
    var nInter = 0;
    // Focus mode: the exercise behind the weakest probe takes ~60 % of sets (it may repeat, never back to back)
    var fex = mode === 'focus' && opts.lab && opts.lab.weakest && E.controller.PROBE_MAP[opts.lab.weakest] ? E.controller.PROBE_MAP[opts.lab.weakest].ex : null;
    if (fex && avail.indexOf(fex) < 0) fex = null;
    var nF = fex ? Math.max(1, Math.round(0.6 * nSets)) - sets.filter(function (x) { return x.exId === fex; }).length : 0;
    while (sets.length < nSets) {
      var last = sets.length ? sets[sets.length - 1].exId : null, left = nSets - sets.length;
      if (fex && nF > 0 && (last !== fex || nF >= left)) { sets.push({ exId: fex, trials: E.dialMeta[fex].setTrials, kind: 'normal', interlude: null, focusEx: true }); nF--; continue; }
      var cand = avail.filter(function (ex) { return !used[ex] && ex !== last && ex !== fex; });
      if (!cand.length) { used = {}; cand = avail.filter(function (ex) { return ex !== last && ex !== fex; }); if (!cand.length) cand = avail; }
      var ex = C.weighted(rng, cand, cand.map(function (k) { return w[k]; }));
      used[ex] = 1;
      sets.push({ exId: ex, trials: E.dialMeta[ex].setTrials, kind: 'normal', interlude: null });
    }
    sets.forEach(function (s, i) {
      if (INTERLUDE[s.exId] && i < sets.length - 1 && nInter < 2) { s.interlude = { kind: 'exposure', ex: s.exId, seconds: 25 }; nInter++; }
    });
    Object.keys(lr.state.plat).forEach(function (ex) { var pl = lr.state.plat[ex]; if (pl.rest > 0) pl.rest--; });
    return { sets: sets, minutes: minutes, notes: notes, mode: mode };
  }

  E.planner = { session: session, overnight: overnight, freshEars: freshEars, weights: weights, WEIGHTS: W };
})(typeof window !== 'undefined' ? window : globalThis);
