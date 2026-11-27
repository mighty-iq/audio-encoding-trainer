/* ES.game.core — shared helpers for the game layer (pure; loads in Node with the engine).
   - learner(): the engine's app learner (store-bound; synced before reading) or one set by tests.
   - est(ex, dialId): the player's threshold estimate {m, s, n} for the dial in the current context, read from the
     learner's record WITHOUT the engine's day-drift: time away never shrinks a level on any game screen; only
     trials move it (the engine keeps its drift for planning).
   - predict(ex, dials, opts): the engine's accuracy model at a full dial setting, with those same estimates;
     opts.shift = {dialId: k} reads that dial k SDs toward easy (venues.condEarshot moves one dial at a time).
   - claim(ex, dial): what the game may say a player reaches — the careful side of the estimate, m − Z·SD in the
     dial's harder direction with Z = 1.28 (the one-sided 90 % bound: 1 SD left Far at 12–14 % overclaimed in the
     calibration, docs/dev/progress/game.md), never beyond the hardest level of that dial the player has actually
     been tested at (trials ring buffer, focus dial); null before any trial of that dial (fix round 2, RV-play P2,
     FRESH-B C3). Venue earshots use the same Z (venues.condEarshot).
   - Formatting of dial levels in real units (dB with a true minus, metres, level names).
   - The game record (store key `game`, CONTRACTS §7), read without copying and written between sets only. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.game = ES.game || {};
  var LN2PI8 = Math.PI / 8;
  var Z = 1.28;                                         // careful side: the one-sided 90 % bound of an estimate
  var override = null;

  function E() { return ES.engine || {}; }
  function learner() {
    if (override) return override;
    var L = E().learner;
    if (L && typeof L.sync === 'function') { try { L.sync(); } catch (e) { /* storage blocked: memory state */ } }
    return L || null;
  }
  function setLearner(lr) { override = lr || null; }
  function store() { return ES.core && ES.core.store; }
  function settings() {
    try { var p = store() && store().peek('profile'); return (p && p.settings) || {}; } catch (e) { return {}; }
  }
  function headphones() { return !!settings().headphones; }
  function dialDef(ex, id) { var f = E().dialDef; return typeof f === 'function' ? f(ex, id) : null; }
  function ctxKey(ex, hp) {
    var L = learner();
    if (L && typeof L.ctxKey === 'function') return L.ctxKey(ex, hp === undefined ? headphones() : hp);
    return ex;
  }
  function model() { return E().model || { target: 0.72, lapse: 0.04 }; }

  /** {m, s, n, at, prior} for a dial: the stored posterior without day-drift, else the prior. */
  function est(ex, id, ck) {
    var L = learner(), d = typeof id === 'object' ? id : dialDef(ex, id);
    if (!d) return null;
    ck = ck || ctxKey(ex);
    var st = L && L.state && L.state.dials || {}, r = st[ck + '.' + d.id];
    if (!r && ck.indexOf('@hp') > 0) {
      var base = st[ck.split('@')[0] + '.' + d.id];        // the engine seeds a headphone context from the plain one
      if (base) r = { m: base.m + (d.id === 'tmr' ? -3 : 0), s: Math.max(base.s, d.prior.s * 0.7), n: 0, at: base.at };
    }
    if (!r || typeof r.m !== 'number') return { m: d.prior.m, s: d.prior.s, n: 0, at: 0, prior: true };
    return { m: r.m, s: Math.min(typeof r.s === 'number' ? r.s : d.prior.s, d.prior.s * 1.5), n: r.n || 0, at: r.at || 0 };
  }
  function L01(z) { return z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)); }
  /** Mean accuracy per slot the engine's model expects at a full dial setting (missing active dials at comfort). */
  function predict(ex, dials, opts) {
    opts = opts || {};
    var L = learner(), md = model();
    if (!L || typeof L.active !== 'function') return null;
    var ck = opts.ctxKey || ctxKey(ex), zs = L.zStar(ex, ck);
    var fam = opts.family !== undefined ? opts.family : (typeof L.familyOf === 'function' ? L.familyOf(ex, dials) : undefined);
    var act = L.active(ex, { ctxKey: ck, family: fam }), F = 1;
    for (var i = 0; i < act.length; i++) {
      var d = act[i], p = est(ex, d, ck), b = d.slope, k = 1 / Math.sqrt(1 + LN2PI8 * b * b * p.s * p.s);
      var sh = opts.shift && opts.shift[d.id];
      if (sh) p = { m: p.m - d.dir * sh * p.s, s: p.s, n: p.n };
      var x = dials && dials[d.id] !== undefined && dials[d.id] !== null ? dials[d.id] : comfortLevel(d, p, zs);
      F *= L01(k * (zs - b * d.dir * (x - p.m)));
    }
    var g = typeof L.gammaOf === 'function' ? L.gammaOf(ex, dials) : 0.25;
    return g + (1 - g - md.lapse) * F;
  }
  // The level where a dial's own component reaches the engine's comfort share (fc), snapped toward easy.
  function comfortLevel(d, p, zs) {
    var md = model(), fc = md.fc || 0.92, b = d.slope, k = Math.sqrt(1 + LN2PI8 * b * b * p.s * p.s);
    var x = p.m + d.dir * (zs - k * Math.log(fc / (1 - fc))) / b;
    if (d.kind === 'ord') return Math.max(d.min, Math.min(d.max, Math.floor(x + 1e-9)));
    var s = d.step || 0.5, v = d.dir > 0 ? Math.floor(x / s + 1e-9) * s : Math.ceil(x / s - 1e-9) * s;
    return Math.max(d.min, Math.min(d.max, v));
  }

  // ---- what the player has actually been tested at: the hardest focus level per exercise and dial
  var testedFn = null, tCache = { key: '', map: null };
  function setTested(fn) { testedFn = fn || null; tCache.key = ''; }
  function testedIndex() {
    var rows = [];
    try { var tr = store() && store().peek('trials'); rows = (tr && tr.rows) || []; } catch (e) { rows = []; }
    var last = rows.length ? rows[rows.length - 1] : null, key = rows.length + ':' + (last ? last[0] : 0);
    if (tCache.key === key && tCache.map) return tCache.map;
    var map = {};
    rows.forEach(function (r) {
      var ex = r[1], id = r[2], x = r[3];
      if (!ex || !id || typeof x !== 'number' || !isFinite(x)) return;
      var d = dialDef(ex, id), k = ex + '.' + id;
      if (!d) return;
      if (map[k] === undefined || d.dir * (x - map[k]) > 0) map[k] = x;
    });
    tCache.key = key; tCache.map = map;
    return map;
  }
  /** Hardest level of dial `id` the player has been tested at (dial units), or null. */
  function testedMax(ex, id) {
    if (testedFn) { var v = testedFn(ex, id); return typeof v === 'number' && isFinite(v) ? v : null; }
    var m = testedIndex()[ex + '.' + id];
    return typeof m === 'number' ? m : null;
  }
  /** {m, s, n, careful, tested, value, capped} or null: value = the easier of the careful estimate and the hardest
      tested level. Both Crowd contexts share the tested levels (the ring buffer keeps no context). */
  function claim(ex, id, ck) {
    var d = typeof id === 'object' ? id : dialDef(ex, id);
    if (!d) return null;
    var e = est(ex, d, ck), t = testedMax(ex, d.id);
    if (!e || e.prior || !e.n || t === null) return null;
    var careful = e.m - d.dir * Z * e.s, capped = d.dir * (careful - t) > 0;
    return { m: e.m, s: e.s, n: e.n, careful: careful, tested: t, value: capped ? t : careful, capped: capped };
  }

  // ---- real units
  var MINUS = '−';
  function num(x, dec) {
    var p = Math.pow(10, dec || 0), r = Math.round(Math.abs(x) * p) / p, s = r.toFixed(dec || 0);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return (x < 0 && r !== 0 ? MINUS : '') + s;
  }
  function fmtDb(x, signed) {
    var r = Math.round(x * 2) / 2;
    return (r > 0 && signed !== false ? '+' : '') + num(r, 1) + ' dB';
  }
  function fmtM(x) { return num(x, x < 10 ? 1 : 0) + ' m'; }
  /** Display text of a level x (dial units: dB, or a level index for ordinal dials). The shell's shared formatter
      (ES.ui.fmt.level, RV-play P3) is used when it exists, so the game and the results facts read alike. */
  function levelText(ex, id, x) {
    var d = typeof id === 'object' ? id : dialDef(ex, id);
    if (!d || typeof x !== 'number' || !isFinite(x)) return '–';
    var F = ES.ui && ES.ui.fmt;
    if (F && typeof F.level === 'function') { try { var t = F.level(ex, d.id, x); if (typeof t === 'string' && t) return t; } catch (e) { /* own formatting */ } }
    if (d.kind === 'ord') {
      var i = Math.max(d.min, Math.min(d.max, Math.floor(x + 1e-9)));
      return d.levels ? String(d.levels[i]) : String(i);
    }
    if (d.unit === 'dB') return fmtDb(x);
    if (d.unit === 'm') return fmtM(x);
    return num(x, 1) + (d.unit ? ' ' + d.unit : '');
  }
  /** A level name as a noun phrase: the part before its comma, with an article when it has none ("an easier accented
      voice, +10 dB" → "an easier accented voice"; "clear line" → "a clear line"), so texts read right whatever the
      engine's level wording. */
  function phrase(t) {
    var s = String(t === undefined || t === null ? '' : t).split(',')[0].trim();
    return !s || /^(a|an|the|one|two|three|\d)/i.test(s) ? s : (/^[aeiou]/i.test(s) ? 'an ' : 'a ') + s;
  }
  /** True when level a is harder than level b on dial d. */
  function harder(d, a, b) { return d.dir * (a - b) > 1e-9; }
  /** Ability in logits (higher = better), the engine's own scale for personal bests. */
  function ability(d, m) { return d.dir * d.slope * m; }

  // ---- the game record
  function rec() {
    var s = store();
    var r = null;
    try { r = s && s.peek ? s.peek('game') : null; } catch (e) { r = null; }
    return r && typeof r === 'object' ? r : { v: 1, venues: {}, cast: {}, badges: {}, pbs: {}, weekly: {} };
  }
  function update(fn) {
    var s = store();
    if (!s || typeof s.update !== 'function') { fn(rec()); return false; }
    try {
      return s.update('game', function (r) {
        ['venues', 'cast', 'badges', 'pbs', 'weekly'].forEach(function (k) { if (!r[k] || typeof r[k] !== 'object') r[k] = {}; });
        fn(r);
      });
    } catch (e) { return false; }
  }
  function now() { return Date.now(); }

  ES.game.core = { learner: learner, setLearner: setLearner, settings: settings, headphones: headphones, dialDef: dialDef,
    ctxKey: ctxKey, model: model, est: est, predict: predict, comfortLevel: comfortLevel, levelText: levelText, fmtDb: fmtDb,
    claim: claim, testedMax: testedMax, setTested: setTested, Z: Z, phrase: phrase,
    fmtM: fmtM, num: num, harder: harder, ability: ability, rec: rec, update: update, now: now, MINUS: MINUS };
})(typeof window !== 'undefined' ? window : globalThis);
