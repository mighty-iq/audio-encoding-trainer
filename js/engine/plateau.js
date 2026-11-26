/* Earshot engine — plateau detection from the log (PLAN §7). Per exercise: no personal best for ≥ 4 sessions and a
   flat trend over the last 6 sessions with the exercise: Bayesian linear regression of the session index
   (dB-equivalent, flow.index) on session number, slope prior N(0, 0.5²); flat = the 80 % interval of the slope
   lies within ±0.15 dB per session, judged on its upper side by default (a falling trend is a stall too), see
   docs/dev/progress/engine.md. Breakers, in order, each with a player-facing reason: widen variety; switch the
   focus dial; more anchors and pop-out feedback; a strategy card; sleep after same-day runs; switch exercise.
   check() has no side effects; apply() changes the learner state; at most one breaker per 3 sessions. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var E = ES.engine = ES.engine || {};
  var ORDER = ['variety', 'focus', 'anchors', 'strategy', 'sleep', 'switch'];
  var NAMES = { crowd: 'Crowd', far: 'Far', strange: 'Strange voices', repair: 'Repair', echo: 'Echo', seek: 'Seek', voices: 'Voices' };
  var STRATEGY = {
    crowd: 'Lock on to the call sign first, then stay with that voice: its pitch, its pace, where it sits. Let the other words go past.',
    far: 'Use the first sentence to tune in to the room. Listen for the start of each word, where the echo blurs least.',
    strange: 'Let the first phrases wash over you: ears re-tune to a new voice within a handful of sentences. Then follow the rhythm, not each sound.',
    repair: 'Hold the whole sentence in mind, then pick the word that fits both what you caught of it and what the sentence means.',
    echo: 'Picture each detail as it arrives: a face for the name, the place, a clock for the time.',
    seek: 'Move in small steps and compare: louder means closer. With headphones, turn until the voice sits straight ahead.',
    voices: 'Give each voice one feature you can name: pitch, pace, accent, or how its sentences end.'
  };
  var Z80 = 1.2816;

  function sessionsWith(log, ex) {
    var out = [];
    ((log && log.sessions) || []).forEach(function (s) {
      var sets = (s.sets || []).filter(function (t) { return t.ex === ex && typeof t.idx === 'number'; });
      if (sets.length) out.push({ s: s, last: sets[sets.length - 1], pb: sets.some(function (t) { return t.pb; }) });
    });
    return out;
  }
  // Slope posterior (dB-eq per session) from points y_i at x_i = 0…k−1 with noise σ.
  function trend(ys, sigma, priorSd) {
    var k = ys.length, xm = (k - 1) / 2, sxx = 0, sxy = 0, ym = 0, i;
    for (i = 0; i < k; i++) ym += ys[i];
    ym /= k;
    for (i = 0; i < k; i++) { sxx += (i - xm) * (i - xm); sxy += (i - xm) * (ys[i] - ym); }
    var prec = sxx / (sigma * sigma) + 1 / (priorSd * priorSd);
    var mean = (sxy / (sigma * sigma)) / prec, sd = Math.sqrt(1 / prec);
    return { slope: mean, sd: sd, lo: mean - Z80 * sd, hi: mean + Z80 * sd };
  }
  function residualSd(ys) {
    var k = ys.length, xm = (k - 1) / 2, ym = 0, sxx = 0, sxy = 0, i;
    for (i = 0; i < k; i++) ym += ys[i];
    ym /= k;
    for (i = 0; i < k; i++) { sxx += (i - xm) * (i - xm); sxy += (i - xm) * (ys[i] - ym); }
    var b = sxy / sxx, ss = 0;
    for (i = 0; i < k; i++) { var r = ys[i] - ym - b * (i - xm); ss += r * r; }
    return Math.sqrt(ss / Math.max(1, k - 2));
  }
  function sameDayCount(log, now) {
    var day = new Date(now).toDateString(), n = 0;
    ((log && log.sessions) || []).forEach(function (s) { if (s.start && new Date(s.start).toDateString() === day) n++; });
    return n;
  }

  function check(ex, opts) {
    opts = opts || {};
    var lr = opts.learner || E.learner, log = opts.log || (ES.core && ES.core.store && ES.core.store.get && ES.core.store.get('log')) || { sessions: [] };
    var now = opts.now || lr.clock(), cfg = opts.cfg || {}, win = cfg.window || 6, band = cfg.band || 0.15;
    var ss = sessionsWith(log, ex);
    if (ss.length < win) return null;
    var lastN = ss.slice(-win), noPb = !ss.slice(-4).some(function (x) { return x.pb; });
    var pl = lr.state.plat[ex] || {};
    if (pl.at !== undefined && ss.length - pl.at < 3) return null;
    if (!noPb) return null;
    var ys = lastN.map(function (x) { return x.last.idx; });
    var sig = Math.max(cfg.minSigma || 0.25, residualSd(ys));
    var t = trend(ys, sig, cfg.priorSd || 0.5);
    var flat = cfg.twoSided ? (t.hi < band && t.lo > -band) : t.hi < band;
    if (!flat) return null;
    // next applicable breaker
    var k = pl.k === undefined ? 0 : (pl.k + 1) % ORDER.length, today = sameDayCount(log, now), guard = 0, kind;
    while (guard++ < ORDER.length) {
      kind = ORDER[k];
      if (kind === 'sleep' && today < 2) { k = (k + 1) % ORDER.length; continue; }
      if (kind === 'focus' && lr.active(ex, { ctxKey: lr.ctxKey(ex, !!opts.headphones) }).filter(function (d) { return !d.family; }).length < 2) { k = (k + 1) % ORDER.length; continue; }
      break;
    }
    var name = NAMES[ex] || ex, lastSet = lastN[lastN.length - 1].last, focusDial = leastFocused(ss, lr, ex, opts.headphones);
    var unit = (E.dialMeta[ex] && E.dialMeta[ex].primary) ? ' dB' : ' points';
    var reason = name + ' has held near the same level for ' + win + ' sessions (trend ' + fmt(t.slope) + unit + ' per session) with no new best in 4.';
    var text = {
      variety: 'Next sets bring in more voices, rooms and noises. Wider variety makes a skill more general, and a fresh mix often breaks a stall.',
      focus: 'The next sets push a different dial (' + (focusDial ? E.dialDef(ex, focusDial).label.toLowerCase() : 'another dial') + ') to its edge while the rest sit at comfort.',
      anchors: 'More easy trials go in between the hard ones for a while, and every miss replays the sound with its words, so the hard trials have something to build on.',
      strategy: 'Try this: ' + (STRATEGY[ex] || ''),
      sleep: 'This is your ' + ordinal(today + 1) + ' session today. Same-day repetition wears a skill thin and sleep consolidates it, so the next gain is likely tomorrow.',
      switch: 'For the next few sessions the plan gives ' + name + ' a rest and trains other situations; skills often move again after a break.'
    }[kind];
    return { ex: ex, reason: reason, breaker: { kind: kind, dial: kind === 'focus' ? focusDial : undefined, text: text },
      trend: { slope: t.slope, lo: t.lo, hi: t.hi, sessions: win, last: lastSet.idx }, chimera: true };
  }
  function leastFocused(ss, lr, ex, hp) {
    var cnt = {}, ck = lr.ctxKey(ex, !!hp);
    lr.active(ex, { ctxKey: ck }).filter(function (d) { return !d.family; }).forEach(function (d) { cnt[d.id] = 0; });
    ss.slice(-6).forEach(function (x) { (x.s.sets || []).forEach(function (t) { if (t.ex === ex && t.focus && cnt[t.focus] !== undefined) cnt[t.focus] += t.n; }); });
    return Object.keys(cnt).sort(function (a, b) { return cnt[a] - cnt[b]; })[0] || null;
  }
  function fmt(x) { var v = Math.round(x * 100) / 100; return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v); }
  function ordinal(n) { return n === 1 ? 'first' : n === 2 ? 'second' : n === 3 ? 'third' : n + 'th'; }

  // Apply a breaker to the learner record. opts.sessionsCount = sessions with this exercise so far.
  function apply(ex, res, opts) {
    opts = opts || {};
    var lr = opts.learner || E.learner, st = lr.state, b = res.breaker, pl = st.plat[ex] = st.plat[ex] || {};
    pl.k = ORDER.indexOf(b.kind); pl.at = opts.sessionsCount !== undefined ? opts.sessionsCount : sessionsWith(opts.log, ex).length;
    pl.last = b.kind; pl.n = (pl.n || 0) + 1;
    if (b.kind === 'variety') st.breadth[ex] = Math.min(1, (st.breadth[ex] === undefined ? 0.2 : st.breadth[ex]) + 0.3);
    if (b.kind === 'focus' && b.dial) { pl.forceFocus = b.dial; pl.forceN = 30; }
    if (b.kind === 'anchors') pl.anchorBoost = 40;
    if (b.kind === 'switch') pl.rest = 3;
    return pl;
  }

  E.plateau = { check: check, apply: apply, trend: trend, ORDER: ORDER, STRATEGY: STRATEGY, sessionsWith: sessionsWith };
})(typeof window !== 'undefined' ? window : globalThis);
