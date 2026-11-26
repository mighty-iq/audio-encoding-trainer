/* Earshot engine — plateau detection from the log (PLAN §7). Per exercise: no personal best for ≥ 4 sessions and a
   flat trend over the last 10 sessions with the exercise: Bayesian linear regression of the session index
   (dB-equivalent, focus-weighted over a fixed dial set) on session number, slope prior N(0, 0.5²); flat = the
   one-sided 80 % bound of the slope lies below +0.15 dB per session (a falling trend is a stall too), for 4
   windows in a row (so the earliest call comes at the 13th session with the exercise; later for Seek, whose short
   sets need more sessions to fill a window). Operating point and its
   simulated error rates in docs/dev/progress/engine.md. Breakers, in order, each with a player-facing reason:
   widen variety; switch the focus dial; more anchors and pop-out feedback; a strategy card; sleep after same-day
   runs; switch exercise. check() has no side effects; the caller applies the breaker with
   apply(ex, result, {learner, log}) right after check() returns one (the session does: review H1), else the same
   breaker repeats and nothing changes; at most one breaker per 3 sessions. Partial and learn:false sets are left
   out. check() runs after the current session is in the log (so "today" counts it). */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var E = ES.engine = ES.engine || {};
  var ORDER = ['variety', 'focus', 'anchors', 'strategy', 'sleep', 'switch'];
  var NAMES = { crowd: 'Crowd', far: 'Far', strange: 'Strange voices', repair: 'Repair', echo: 'Echo', seek: 'Seek', voices: 'Voices' };
  var STRATEGY = {
    crowd: 'Lock on to the call sign first, then stay with that voice: its pitch, its pace, where it sits. Let the other words go past.',
    far: 'Use the first sentence to tune in to the room. Listen for the start of each word, where the echo blurs least.',
    strange: 'Let the first phrases wash over you: ears re-tune to a new voice within a handful of sentences. Then listen for the sounds this voice changes.',
    repair: 'Hold the whole sentence in mind, then pick the word that fits both what you caught of it and what the sentence means.',
    echo: 'Picture each detail as it arrives: a face for the name, the place, a clock for the time.',
    seek: 'Move in small steps and compare: louder means closer. With headphones, turn so the voice sits about 30° to one side.',
    voices: 'Give each voice one feature you can name: pitch, pace, accent, or how its sentences end.'
  };
  var Z80 = 1.2816;
  // Operating point tuned on simulated learners (tests/sim; docs/dev/progress/engine.md): 10-session windows, the
  // trend must look flat for 4 consecutive windows; residual SD floored at 0.35 dB-eq; each window holds ≥ 80 scored
  // trials, or six sets' worth for short-set exercises (Seek), widening up to 16 sessions to get them.
  // Optional: z (bound, default 80 % one-sided), maxSlope (cap on the slope estimate), twoSided.
  var DEFAULTS = { window: 10, band: 0.15, minSigma: 0.35, priorSd: 0.5, minTrials: 80, setsMin: 6, maxWindow: 16, persist: 4, pbSessions: 4,
    twoSided: false };

  function sessionsWith(log, ex) {
    var out = [];
    ((log && log.sessions) || []).forEach(function (s) {
      var sets = (s.sets || []).filter(function (t) { return t.ex === ex && typeof t.idx === 'number' && !t.partial && t.learn !== false; });
      if (!sets.length) return;
      var foci = {}, trials = 0;
      sets.forEach(function (t) { trials += (t.n || 0) - (t.warmups || 0); Object.keys(t.foci || {}).forEach(function (k) { foci[k] = (foci[k] || 0) + t.foci[k]; }); });
      out.push({ s: s, last: sets[sets.length - 1], pb: sets.some(function (t) { return t.pb; }), foci: foci, trials: trials });
    });
    return out;
  }
  // Session index over a fixed set of dials (present in every session of the window), weighted by how often each
  // was the focus there; dB-equivalent like flow.index. A dial that joins mid-window cannot fake a trend.
  function windowIndex(ex, win) {
    var meta = E.dialMeta[ex] || {}, ref = meta.primary ? E.dialDef(ex, meta.primary).slope : 0.25, w = {};
    win.forEach(function (x) { Object.keys(x.foci).forEach(function (k) { w[k] = (w[k] || 0) + x.foci[k]; }); });
    var val = function (x, k) { var a = x.last.avg && x.last.avg[k] !== undefined ? x.last.avg : x.last.end; return a ? a[k] : undefined; };
    var ids = Object.keys(w).filter(function (k) { return win.every(function (x) { return val(x, k) !== undefined; }); });
    if (!ids.length) ids = Object.keys((win[0].last && win[0].last.end) || {}).filter(function (k) { return win.every(function (x) { return val(x, k) !== undefined; }); });
    if (!ids.length) return null;
    var tw = 0; ids.forEach(function (k) { tw += w[k] || 1; });
    return win.map(function (x) {
      var v = 0;
      ids.forEach(function (k) { var d = E.dialDef(ex, k); v += (w[k] || 1) / tw * d.dir * d.slope * (val(x, k) - d.prior.m) / ref; });
      return v;
    });
  }
  // Slope posterior (dB-eq per session) from points y_i at x_i = 0…k−1 with noise σ.
  function trend(ys, sigma, priorSd, z) {
    var k = ys.length, xm = (k - 1) / 2, sxx = 0, sxy = 0, ym = 0, i;
    for (i = 0; i < k; i++) ym += ys[i];
    ym /= k;
    for (i = 0; i < k; i++) { sxx += (i - xm) * (i - xm); sxy += (i - xm) * (ys[i] - ym); }
    var prec = sxx / (sigma * sigma) + 1 / (priorSd * priorSd);
    var mean = (sxy / (sigma * sigma)) / prec, sd = Math.sqrt(1 / prec), zz = z || Z80;
    return { slope: mean, sd: sd, lo: mean - zz * sd, hi: mean + zz * sd };
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
  // Flatness of the trend over the window of `win` sessions ending at index `end` (exclusive) of `ss`; the window
  // widens (up to maxWindow sessions) until it holds the trial minimum.
  function flatAt(ex, ss, end, win, band, cfg) {
    var minT = cfg.minTrials || 80, st = (E.dialMeta[ex] || {}).setTrials;
    if (cfg.setsMin && st) minT = Math.min(minT, cfg.setsMin * st); // short-set exercises (Seek: 6 trials a set)
    var w = ss.slice(Math.max(0, end - win), end), cap = Math.max(cfg.maxWindow || 12, win);
    if (w.length < win) return null;
    var cnt = function (a) { return a.reduce(function (t, x) { return t + (x.trials || 0); }, 0); };
    while (cnt(w) < minT && w.length < cap && end - w.length > 0) w = ss.slice(end - w.length - 1, end);
    if (cnt(w) < minT) return null;
    var ys = windowIndex(ex, w);
    if (!ys) return null;
    var sig = Math.max(cfg.minSigma || 0.25, residualSd(ys)), t = trend(ys, sig, cfg.priorSd || 0.5, cfg.z);
    t.flat = (cfg.twoSided ? (t.hi < band && t.lo > -band) : t.hi < band) && !(cfg.maxSlope !== undefined && t.slope >= cfg.maxSlope);
    t.win = w; t.ys = ys;
    return t;
  }
  function sameDayCount(log, now) {
    var day = new Date(now).toDateString(), n = 0;
    ((log && log.sessions) || []).forEach(function (s) { if (s.start && new Date(s.start).toDateString() === day) n++; });
    return n;
  }

  function check(ex, opts) {
    opts = opts || {};
    var lr = E.lrOf(opts.learner), log = opts.log || (ES.core && ES.core.store && ES.core.store.get && ES.core.store.get('log')) || { sessions: [] };
    var now = opts.now || lr.clock(), cfg = Object.assign({}, DEFAULTS, opts.cfg || {}), win = cfg.window, band = cfg.band;
    var all = sessionsWith(log, ex);
    if (all.length < win + 1) return null;
    var pl = lr.state.plat[ex] || {};
    if (pl.at !== undefined && all.length - pl.at < 3) return null;
    if (all.slice(-(cfg.pbSessions || 4)).some(function (x) { return x.pb; })) return null;
    // the trend must look flat for the window ending now and for the ones ending 1 … persist−1 sessions earlier
    var t = flatAt(ex, all, all.length, win, band, cfg), persist = cfg.persist;
    if (!t || !t.flat) return null;
    for (var pi = 1; pi < persist; pi++) { var tp = flatAt(ex, all, all.length - pi, win, band, cfg); if (!tp || !tp.flat) return null; }
    var lastN = t.win, ys = t.ys;
    // next applicable breaker
    var k = pl.k === undefined ? 0 : (pl.k + 1) % ORDER.length, today = sameDayCount(log, now), guard = 0, kind;
    while (guard++ < ORDER.length) {
      kind = ORDER[k];
      if (kind === 'sleep' && today < 2) { k = (k + 1) % ORDER.length; continue; } // today counts the current session
      if (kind === 'focus' && lr.active(ex, { ctxKey: lr.ctxKey(ex, !!opts.headphones) }).filter(function (d) { return !d.family; }).length < 2) { k = (k + 1) % ORDER.length; continue; }
      break;
    }
    var name = NAMES[ex] || ex, focusDial = leastFocused(all, lr, ex, opts.headphones);
    win = lastN.length;
    // Reason in the player's terms (review C10): the trend is a dB-equivalent index where up = better; exercises
    // without a primary dB dial get no unit; a clearly falling trend says so.
    var nb = cfg.pbSessions || 4, dB = !!(E.dialMeta[ex] && E.dialMeta[ex].primary), slipped = t.hi < 0;
    var reason = name + ' has set no new best in ' + nb + ' sessions, and ' + (slipped ? 'its level has slipped a little over the last ' + win + ' sessions.'
      : dB ? 'its level moved less than ' + band + ' dB a session over the last ' + win + '.' : 'its level has barely moved over the last ' + win + ' sessions.');
    var text = {
      variety: 'Next sets bring in more voices, rooms and noises. Wider variety makes a skill more general, and a fresh mix gives the skill something new to work on.',
      focus: 'The next sets push a different dial (' + (focusDial ? E.dialDef(ex, focusDial).label.toLowerCase() : 'another dial') + ') to its edge while the rest sit at comfort.',
      anchors: 'More easy trials go in between the hard ones for a while, so the hard trials have something to build on.',
      strategy: 'Try this: ' + (STRATEGY[ex] || ''),
      sleep: 'This is your ' + ordinal(today) + ' session today. Same-day repetition wears a skill thin; sleep consolidates practice, so tomorrow is a good time for the next session.',
      switch: 'For the next few sessions the plan gives ' + name + ' a rest and trains other situations for a while, then comes back to it.'
    }[kind];
    return { ex: ex, reason: reason, breaker: { kind: kind, dial: kind === 'focus' ? focusDial : undefined, text: text },
      trend: { slope: t.slope, lo: t.lo, hi: t.hi, sessions: win, last: ys[ys.length - 1], slipped: slipped }, chimera: true };
  }
  function leastFocused(ss, lr, ex, hp) {
    var cnt = {}, ck = lr.ctxKey(ex, !!hp);
    lr.active(ex, { ctxKey: ck }).filter(function (d) { return !d.family; }).forEach(function (d) { cnt[d.id] = 0; });
    ss.slice(-6).forEach(function (x) { (x.s.sets || []).forEach(function (t) { if (t.ex === ex && t.focus && cnt[t.focus] !== undefined) cnt[t.focus] += t.n; }); });
    return Object.keys(cnt).sort(function (a, b) { return cnt[a] - cnt[b]; })[0] || null;
  }
  function ordinal(n) { return n === 1 ? 'first' : n === 2 ? 'second' : n === 3 ? 'third' : n + 'th'; }

  // Apply a breaker to the learner record. opts.sessionsCount = sessions with this exercise so far.
  function apply(ex, res, opts) {
    opts = opts || {};
    var lr = E.lrOf(opts.learner), st = lr.state, b = res.breaker, pl = st.plat[ex] = st.plat[ex] || {};
    pl.k = ORDER.indexOf(b.kind); pl.at = opts.sessionsCount !== undefined ? opts.sessionsCount : sessionsWith(opts.log, ex).length;
    pl.last = b.kind; pl.n = (pl.n || 0) + 1;
    if (b.kind === 'variety') st.breadth[ex] = Math.min(1, (st.breadth[ex] === undefined ? 0.2 : st.breadth[ex]) + 0.3);
    if (b.kind === 'focus' && b.dial) { pl.forceFocus = b.dial; pl.forceN = 30; }
    if (b.kind === 'anchors') pl.anchorBoost = 40;
    if (b.kind === 'switch') pl.rest = 3;
    return pl;
  }

  E.plateau = { DEFAULTS: DEFAULTS, check: check, apply: apply, trend: trend, ORDER: ORDER, STRATEGY: STRATEGY, sessionsWith: sessionsWith };
})(typeof window !== 'undefined' ? window : globalThis);
