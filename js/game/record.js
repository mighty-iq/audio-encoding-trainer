/* ES.game.record — the game layer listens to the shell's hooks (CONTRACTS §2, §11) and keeps the `game` record.
   trial:done → cast notes in memory (nothing is written during a set). set:done (between sets) → one store write:
   level-ups, venue earshots and bests, venue openings, milestones, the weekly stop, fresh-ears and overnight
   results, met and known voices; then news lines for the screen after the set. Milestones go to the Chimera
   invitation through the `milestone` hook (at most one per set, shown between sets by the shell); personal bests
   already reach it through the shell's own `pb` hook (the engine's flow decides them), so they are not repeated.
   Pure except for the hooks; settle(payload) is callable directly (tests, other runners). */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.game = ES.game || {};
  var NEWS = {}, MAX_LINES = 6, HIST = 80;

  function G() { return ES.game; }
  function K() { return ES.game.core; }
  function sessionPlan(index) {
    var S = ES.ui && ES.ui.session && typeof ES.ui.session.state === 'function' ? ES.ui.session.state() : null;
    var set = S && S.sets && S.sets[index];
    return { sid: S ? S.id : 'x', plan: set ? set.plan || {} : {} };
  }

  /** Apply one finished set to the game record. payload = set:done's {set: entry, index, session, results, demo};
      opts.plan = the planner's set (weekly stop, venue) when not running inside the shell. Returns the news. */
  function settle(payload, opts) {
    opts = opts || {};
    var entry = payload && payload.set, news = { lines: [], opened: [], milestones: [], returns: [], weekly: null, venueBest: [] };
    if (!entry || payload.demo || entry.ex === 'demo') { if (G().cast) G().cast._reset(); return news; }
    var ex = entry.ex, now = opts.now || K().now(), ck = entry.ctxKey || K().ctxKey(ex), plan = opts.plan || sessionPlan(payload.index).plan || {};
    var M = G().milestones, V = G().venues, after = M.snapshot(ex, ck);
    K().update(function (r) {
      r.last = r.last || {};
      var ups = M.levelUps(ex, r.last[ck] || null, after);
      r.last[ck] = after;
      ups.slice(0, 3).forEach(function (u) { news.lines.push({ kind: 'up', text: u.text }); });
      // venue earshots: history and bests for venues whose headline uses this exercise
      V.list().forEach(function (v) {
        if (v.head.ex !== ex) return;
        var e = V.earshot(v), sv = r.venues[v.id] = r.venues[v.id] || {};
        if (!e || (e.status !== 'in' && e.status !== 'beyond')) return;
        sv.h = (sv.h || []).concat([[now, e.x]]).slice(-HIST);
        if (M.venueBetter(v, e, sv.best)) {
          var first = sv.best === undefined || sv.best === null;
          if (!first || sv.open || !v.opens) {
            news.venueBest.push({ id: v.id, text: (first ? 'First earshot at the ' : 'New best at the ') + V.venueName(v) + ': ' + e.text +
              (first ? '' : ' (was ' + K().levelText(v.head.ex, v.head.dial, sv.best) + ')') });
          }
          sv.best = e.x; sv.bestAt = now;
        }
      });
      // openings (never undone)
      var st = V.state({ rec: r });
      st.forEach(function (s) {
        if (!s.open) return;
        var sv = r.venues[s.id] = r.venues[s.id] || {};
        if (!sv.open && (s.newly || !s.venue.opens)) {
          sv.open = now;
          if (s.newly) news.opened.push({ id: s.id, name: s.name, text: s.name + ' is open: ' + V.describe(s.venue.head) + '. Your earshot there: ' + s.earshot.text + '.' });
        }
      });
      // weekly stop
      if (plan.kind === 'weekly' || entry.kind === 'weekly') {
        var wk = plan.week, k = plan.stop;
        if (G().weekly.validWeek(wk) && typeof k === 'number') {
          var marks = G().weekly.marksOf(payload.results), w = G().weekly.recordStop(r, wk, k, marks, now);
          news.weekly = { week: wk, stop: k, marks: marks, practice: w.practice, complete: w.complete };
        }
      }
      // cast: met and known voices from this set's trials
      var before = G().cast.storedCounts(r), metNow = Object.keys(pendingMet);
      G().cast.flush(r);
      var c2 = G().cast.storedCounts(r);
      metNow.slice(0, 2).forEach(function (id) {
        var c = G().cast.card(id, r);
        if (c) news.lines.push({ kind: 'cast', text: 'New voice: ' + c.name + ' (' + lowerFirst(c.blurb.replace(/\.$/, '')) + ').' });
      });
      if (c2.known > before.known) news.lines.push({ kind: 'cast', text: 'You now know ' + c2.known + ' voice' + (c2.known === 1 ? '' : 's') + ' of the cast.' });
      pendingMet = {};
      // milestones
      M.check(r, { venues: V.state({ rec: r }) }).forEach(function (m) { r.badges[m.id] = now; news.milestones.push(m); });
    });
    news.returns = G().returns.afterSet(entry);
    news.lines = news.lines.slice(0, MAX_LINES);
    return news;
  }

  // "Rings the bells on Sundays" → "rings the bells on Sundays": the blurb keeps its own capitals (RV-play P12).
  function lowerFirst(t) { t = String(t || ''); return /^[A-Z][a-z]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t; }
  var pendingMet = {};
  function onTrial(p) {
    if (!p || p.demo || !p.trial) return;
    var out = G().cast.noteTrial(p.trial, p.result);
    out.met.forEach(function (id) { pendingMet[id] = 1; });
  }
  function onSet(p) {
    var sp = sessionPlan(p && p.index), news = settle(p, { plan: sp.plan });
    NEWS[sp.sid + ':' + (p && p.index)] = news;
    if (news.milestones.length) {
      var m = news.milestones[news.milestones.length - 1], more = news.milestones.length - 1;
      ES.hooks.emit('milestone', { title: 'Milestone: ' + m.name, text: m.text + (more > 0 ? ' (and ' + more + ' more)' : '') });
    }
    // a new best at a venue reaches the Chimera invitation too, unless the engine's own best already did (shell `pb`)
    var vb = news.venueBest.filter(function (b) { return b.text.indexOf('New best') === 0; })[0];
    if (vb && p && p.set && !p.set.pb) ES.hooks.emit('pb', { title: 'New personal best', text: vb.text, venue: vb.id });
    return news;
  }
  function newsFor(index, sid) {
    var S = ES.ui && ES.ui.session && ES.ui.session.state && ES.ui.session.state();
    return NEWS[(sid || (S && S.id) || 'x') + ':' + index] || null;
  }

  if (ES.hooks && typeof ES.hooks.on === 'function') {
    ES.hooks.on('trial:done', onTrial);
    ES.hooks.on('set:done', onSet);
    ES.hooks.on('cast:met', function (p) { if (p && p.voice && G().cast.noteMet(p.voice)) pendingMet[p.voice] = 1; });
  }

  ES.game.record = { settle: settle, onTrial: onTrial, onSet: onSet, newsFor: newsFor, _news: NEWS, _lowerFirst: lowerFirst };
})(typeof window !== 'undefined' ? window : globalThis);
