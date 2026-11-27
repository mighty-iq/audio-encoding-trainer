/* ES.game.returns — coming back never costs anything (pure; loads in Node). Two moments, both offered as a chance
   to see what stayed with you, never as a warning about absence (no streaks, no lives, no "you missed" texts):
   - Fresh ears: after ≥ 2 days away the engine's planner opens with a gentle "fresh" set (planner.freshEars); after
     it we say whether the level held, from the set entry's fresh.before/after (the engine's exercise index, higher =
     better; the number itself is not shown: its sign and units read the wrong way for dB dials, RV-claims C10).
     Source for the wording: in large studies of online training games, skill mostly survived breaks and came back
     within a game or two (Kumar et al. 2022 [full], R5 §5.4) — games, not listening, so it is stated as such (C25).
   - Overnight check: the first set of a calendar day re-tests the last day's hardest condition with voices kept out
     of that set where the pool allows (planner.overnight; transfer to new talkers appeared after sleep: Xie, Earle &
     Myers 2018 [full], PLAN §7). The card shows only before the day's first session (M4); after the set we show how
     many of those words went right (entry.overnight). Wording per RV-claims C19. */
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
  /** Lines for the screen after a fresh or overnight set: [{kind, title, text}] (empty for other sets). */
  function afterSet(entry) {
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
      // under ten trials a percentage is noise (RV-play P18): say so in words
      var result = on.n < 10 ? on.n + ' trial' + (on.n === 1 ? '' : 's') + ': too few to judge on their own; they count toward your levels.'
        : Math.round((on.prop || 0) * 100) + ' % of words right over ' + on.n + ' trials' + (on.expected ? ' (the model expected about ' + Math.round(on.expected * 100) + ' %).' : '.');
      out.push({ kind: 'overnight', title: 'Overnight check',
        text: 'Your last day’s hardest (' + what + '), retested with other voices where possible. ' + result });
    }
    return out;
  }

  ES.game.returns = { upcoming: upcoming, afterSet: afterSet };
})(typeof window !== 'undefined' ? window : globalThis);
