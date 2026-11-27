/* ES.game.returns — coming back never costs anything (pure; loads in Node). Two moments, both offered as a chance
   to see what stayed with you, never as a warning about absence (no streaks, no lives, no "you missed" texts):
   - Fresh ears: after ≥ 2 days away the engine's planner opens with a gentle "fresh" set (planner.freshEars); after
     it we say whether the level held, from the set entry's fresh.before/after (the engine's exercise index, higher =
     better; the number itself is not shown: its sign and units read the wrong way for dB dials, RV-claims C10).
     Source for the wording: in large studies of online training games, skill mostly survived breaks and came back
     within a game or two (Kumar et al. 2022 [full], R5 §5.4) — games, not listening, so it is stated as such (C25).
   - Overnight check: the first set of a calendar day re-tests the last day's hardest condition with voices kept out
     of that set where the pool allows (planner.overnight; transfer to new talkers appeared after sleep: Xie, Earle &
     Myers 2018 [full], PLAN §7). The card shows only before the day's first session (M4); after the set we give the
     plain count of re-test trials that went right, without a verdict or a percentage (the engine re-tests the first
     three trials of the set, entry.overnight.n; FINAL-CHECK FC-04). Wording per RV-claims C19. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.game = ES.game || {};
  var GAMES = 'In large studies of online training games, skill mostly survived breaks and came back within a game or two';

  function E() { return ES.engine || {}; }
  function K() { return ES.game.core; }
  function logOf(opts) {
    if (opts && opts.log) return opts.log;
    try { return ES.core.store.peek('log'); } catch (e) { return { sessions: [] }; }
  }
  function realSessions(log) { return ((log && log.sessions) || []).filter(function (s) { return s && s.start && !s.demo; }); }
  function sameDay(a, b) { return new Date(a).toDateString() === new Date(b).toDateString(); }

  /** What the next session opens with: {kind:'fresh'|'overnight', title, text, ex} or null. */
  function upcoming(opts) {
    opts = opts || {};
    var P = E().planner, log = logOf(opts), now = opts.now || K().now(), ss = realSessions(log);
    if (!P || !ss.length) return null;
    var lr = opts.learner || K().learner(), sub = { learner: lr, log: { sessions: ss }, now: now, available: opts.available };
    try {
      var f = typeof P.freshEars === 'function' ? P.freshEars(sub) : null;
      if (f) {
        return { kind: 'fresh', ex: f.exId, days: f.daysAway, title: 'Fresh ears',
          text: 'Welcome back. Your next session opens gently, then shows how much of your edge you kept. ' + GAMES + '; your next sets will show it here.' };
      }
      if (ss.some(function (s) { return sameDay(s.start, now); })) return null;     // the overnight check opens a day only
      var o = typeof P.overnight === 'function' ? P.overnight(sub) : null;
      if (o) {
        return { kind: 'overnight', ex: o.exId, title: 'Overnight check',
          text: o.text + ' In one study, accent learning carried over to a new talker only after a night’s sleep; this set lets you check it.' };
      }
    } catch (e) { return null; }
    return null;
  }
  /** Lines for the screen after a fresh or overnight set: [{kind, title, text}] (empty for other sets). opts.results:
      the set's answered trials in order ({correct}), as the shell's set:done hook gives them. */
  function afterSet(entry, opts) {
    opts = opts || {};
    var out = [];
    if (!entry) return out;
    if (entry.fresh && typeof entry.fresh.before === 'number' && typeof entry.fresh.after === 'number') {
      var dlt = entry.fresh.after - entry.fresh.before, days = entry.fresh.daysAway;
      var away = days ? 'after ' + days + ' days away' : 'after your break';
      var text = dlt >= -0.5 ? 'Your level held ' + away + (dlt >= 0.5 ? ', and even rose.' : '.')
        : 'A little rust ' + away + '. ' + GAMES + '.';
      out.push({ kind: 'fresh', title: 'Fresh ears', text: text });
    }
    if (entry.overnight && entry.overnight.n) {
      var on = entry.overnight, d = on.focus ? K().dialDef(entry.ex, on.focus) : null;
      var what = d ? d.label.charAt(0).toLowerCase() + d.label.slice(1) : 'the hardest condition';
      // plain counts, no verdict and no percentage: a few trials judge nothing (RV-play P18, FC-04). The re-test
      // trials are the set's first ones, so they are the first n answered results.
      var rs = Array.isArray(opts.results) ? opts.results.slice(0, on.n) : null, at = ' at the hardest level of your last training day' + (d ? ' (' + what + ')' : '');
      var text2 = rs && rs.length === on.n
        ? rs.filter(function (r) { return r && r.correct; }).length + ' of ' + on.n + ' right' + at + '. It counts toward your trend.'
        : on.n + ' trial' + (on.n === 1 ? '' : 's') + at + '. ' + (on.n === 1 ? 'It counts' : 'They count') + ' toward your trend.';
      out.push({ kind: 'overnight', title: 'Overnight check', text: text2 });
    }
    return out;
  }

  ES.game.returns = { upcoming: upcoming, afterSet: afterSet };
})(typeof window !== 'undefined' ? window : globalThis);
