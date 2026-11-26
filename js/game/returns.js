/* ES.game.returns — coming back never costs anything (pure; loads in Node). Two moments, both offered as a chance
   to see what stayed with you, never as a warning about absence (no streaks, no lives, no "you missed" texts):
   - Fresh ears: after ≥ 2 days away the engine's planner opens with a gentle "fresh" set (planner.freshEars); after
     it we show how the level held: the set entry's fresh.before/after (the engine's dB-equivalent index).
     Skills largely survive breaks and come back within a game or two (Kumar et al. 2022, R5 §5.4).
   - Overnight check: the day's first set re-tests yesterday's hardest condition with voices you did not hear
     yesterday (planner.overnight; transfer to new talkers appeared after sleep: Xie, Earle & Myers 2018, PLAN §7);
     after it we show how many of those trials went right (entry.overnight). */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.game = ES.game || {};

  function E() { return ES.engine || {}; }
  function K() { return ES.game.core; }
  function logOf(opts) {
    if (opts && opts.log) return opts.log;
    try { return ES.core.store.peek('log'); } catch (e) { return { sessions: [] }; }
  }
  function realSessions(log) { return ((log && log.sessions) || []).filter(function (s) { return s && s.start && !s.demo; }); }

  /** What the next session opens with: {kind:'fresh'|'overnight', title, text, ex} or null. */
  function upcoming(opts) {
    opts = opts || {};
    var P = E().planner, log = logOf(opts), now = opts.now || K().now();
    if (!P || !realSessions(log).length) return null;
    var lr = opts.learner || K().learner(), sub = { learner: lr, log: { sessions: realSessions(log) }, now: now, available: opts.available };
    try {
      var f = typeof P.freshEars === 'function' ? P.freshEars(sub) : null;
      if (f) {
        return { kind: 'fresh', ex: f.exId, days: f.daysAway, title: 'Fresh ears',
          text: 'Welcome back. Your next session opens gently, then shows how much of your edge you kept. Skills mostly survive a break and return within a set or two.' };
      }
      var o = typeof P.overnight === 'function' ? P.overnight(sub) : null;
      if (o) {
        return { kind: 'overnight', ex: o.exId, title: 'Overnight check',
          text: o.text + ' Sleep is when practice settles; this is your chance to see it.' };
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
      var unit = (E().dialMeta && E().dialMeta[entry.ex] && E().dialMeta[entry.ex].primary) ? ' dB' : ' points';
      var text = dlt >= -0.5
        ? 'Your level held ' + away + (dlt >= 0.5 ? ' and even rose (' + signed(dlt) + unit + ' on the exercise index).' : '.')
        : 'A little rust ' + away + ' (' + signed(dlt) + unit + ' on the exercise index). It usually comes back within a set or two.';
      out.push({ kind: 'fresh', title: 'Fresh ears', text: text });
    }
    if (entry.overnight && entry.overnight.n) {
      var on = entry.overnight, d = on.focus ? K().dialDef(entry.ex, on.focus) : null;
      var what = d ? d.label.charAt(0).toLowerCase() + d.label.slice(1) : 'yesterday’s hardest condition';
      out.push({ kind: 'overnight', title: 'Overnight check',
        text: 'Yesterday’s hardest (' + what + '), with voices new to you: ' + Math.round((on.prop || 0) * 100) + ' % of words right over ' +
          on.n + ' trials' + (on.expected ? ' (the model expected about ' + Math.round(on.expected * 100) + ' %).' : '.') });
    }
    return out;
  }
  function signed(x) { var r = Math.round(x * 10) / 10; return (r > 0 ? '+' : r < 0 ? K().MINUS : '') + Math.abs(r); }

  ES.game.returns = { upcoming: upcoming, afterSet: afterSet };
})(typeof window !== 'undefined' ? window : globalThis);
