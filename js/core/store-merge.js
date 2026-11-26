/* ES.core.storeSchema.mergeLearner / compactLog — store hooks for two records (RV M1, M10), used by the learner and
   log schemas in store-schema.js. Pure. */
(function (ES) {
  'use strict';
  var U = ES.core.util, SC = ES.core.storeSchema;
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  // The learner is saved from the engine's in-memory state, which may predate records another tab wrote; saving
  // merges per record instead of replacing the whole object (RV M1): newer `at` per dial and condition, more
  // trials per path and plateau entry, max for bests and voice counts, and the per-exercise lists (recent, edge,
  // breadth) from the side whose dials for that exercise are newer.
  function exOf(key) { return String(key).split(/[.:]/)[0]; }
  function newestByEx(dials) {
    var o = {};
    Object.keys(dials || {}).forEach(function (k) { var e = exOf(k), at = +((dials[k] || {}).at) || 0; if (!(o[e] >= at)) o[e] = at; });
    return o;
  }
  function mergeLearner(cur, inc) {
    if (!U.isObj(cur) || !U.isObj(inc)) return inc;
    var out = U.copy(inc);
    function per(field, pick) {
      var a = U.isObj(cur[field]) ? cur[field] : {}, b = U.isObj(inc[field]) ? inc[field] : {}, o = {};
      Object.keys(a).concat(Object.keys(b)).forEach(function (k) {
        if (U.badKey(k) || has(o, k)) return;
        o[k] = !has(b, k) ? a[k] : !has(a, k) ? b[k] : pick(a[k], b[k], k);
      });
      out[field] = o;
    }
    function num(x) { x = +x; return isFinite(x) ? x : 0; }
    var byAt = function (a, b) { return num(a && a.at) > num(b && b.at) ? a : b; };
    var byN = function (a, b) { return num(a && a.n) > num(b && b.n) ? a : b; };
    var ca = newestByEx(cur.dials), cb = newestByEx(inc.dials);
    var byEx = function (a, b, ex) { return (ca[ex] || 0) > (cb[ex] || 0) ? a : b; };
    per('dials', byAt); per('cond', byAt); per('path', byN); per('plat', byN);
    per('best', function (a, b) { return Math.max(num(a), num(b)); });
    per('cast', function (a, b) { return Math.max(num(a), num(b)); });
    per('recent', byEx); per('edge', byEx); per('breadth', byEx);
    out.n = Math.max(num(cur.n), num(inc.n));
    if (!inc.seed && cur.seed) out.seed = cur.seed;
    return out;
  }

  // The session log keeps full entries for the newest sessions and a summary per set for older ones, and is
  // capped by size, so 3,000 sessions stay well under storage limits (RV M10).
  var KEEP_FULL = 200, LOG_MAX_CHARS = 2200000;
  function compactSession(x) {
    if (!U.isObj(x) || x.c === 1) return x;
    var o = { id: x.id, start: x.start, end: x.end, activeMs: x.activeMs, mode: x.mode, c: 1 };
    ['kind', 'demo'].forEach(function (k) { if (x[k] !== undefined && x[k] !== false) o[k] = x[k]; });
    o.sets = (Array.isArray(x.sets) ? x.sets : []).filter(U.isObj).map(function (t) {
      var e = { ex: t.ex, n: t.n, correct: t.correct };
      if (t.focus) e.focus = t.focus;
      if (typeof t.idx === 'number') e.idx = t.idx;
      if (t.focus && U.isObj(t.end) && typeof t.end[t.focus] === 'number') e.fv = t.end[t.focus];
      ['partial', 'kind', 'venue', 'week', 'pb'].forEach(function (k) { if (t[k] !== undefined && t[k] !== false) e[k] = t[k]; });
      return e;
    });
    return o;
  }
  function compactLog(arr) {
    var cut = Math.max(0, arr.length - KEEP_FULL), i;
    for (i = 0; i < cut; i++) arr[i] = compactSession(arr[i]);
    var size = JSON.stringify(arr).length;
    if (size > LOG_MAX_CHARS && arr.length > KEEP_FULL) {
      var drop = Math.ceil((size - LOG_MAX_CHARS) / (size / arr.length)) + 1;
      arr = arr.slice(Math.min(drop, arr.length - KEEP_FULL));
    }
    return arr;
  }

  SC.mergeLearner = mergeLearner;
  SC.compactLog = compactLog;
  SC.KEEP_FULL = KEEP_FULL;
  SC.LOG_MAX_CHARS = LOG_MAX_CHARS;
})(window.ES);
