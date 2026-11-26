/* ES.core.storeSchema — record schemas (CONTRACTS §7), the schema guard and the per-field three-way merge.
   Pure: no storage, no DOM; loads in Node. Rules:
   - sanitize() repairs wrong types to defaults, clamps ranges, drops broken entries, never throws, and
     passes unknown fields through untouched (other owners may add fields before this file knows them).
   - merge3(base, ours, theirs): a side that did not change a field yields to the side that did; when both
     changed it, the field's rule decides: lww (newer write), max, min, or, newest (whole entry by a
     time field), and lists/maps/rows merge by id or key so nothing either tab added is lost. */
(function (ES) {
  'use strict';
  var U = ES.core.util;
  var MAX_STR = 4000, MAX_DEPTH = 24, MAX_KEYS = 20000, MAX_ANY = 200000;
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  function mk(t, def, o) { var x = { t: t, def: def }; if (o) for (var k in o) if (has(o, k)) x[k] = o[k]; return x; }
  var T = {
    num: function (def, o) { return mk('num', def, o); },
    int: function (def, o) { var x = mk('num', def, o); x.int = true; return x; },
    str: function (def, o) { return mk('str', def, o); },
    bool: function (def, o) { return mk('bool', def, o); },
    en: function (vals, def, o) { var x = mk('enum', def, o); x.vals = vals; return x; },
    any: function (def, o) { return mk('any', def, o); },
    obj: function (fields, o) { var x = mk('obj', undefined, o); x.fields = fields; return x; },
    map: function (of, o) { var x = mk('map', undefined, o); x.of = of; return x; },
    list: function (of, o) { var x = mk('list', undefined, o); x.of = of; x.id = x.id || 'id'; return x; },
    rows: function (o) { return mk('rows', undefined, o); }
  };
  var ANY = T.any(undefined);

  function defaults(desc) {
    switch (desc.t) {
      case 'obj':
        var o = {};
        Object.keys(desc.fields).forEach(function (k) { var v = defaults(desc.fields[k]); if (v !== undefined) o[k] = v; });
        return o;
      case 'map': return {};
      case 'list': case 'rows': return [];
      default:
        var v = typeof desc.def === 'function' ? desc.def() : desc.def;
        return v && typeof v === 'object' ? U.copy(v) : v;
    }
  }

  /** JSON-safe deep copy: drops functions, undefined, non-finite numbers, prototype keys, deep nesting. */
  function jsonSafe(v, depth, budget) {
    budget = budget || { n: 0 };
    if (++budget.n > MAX_ANY || depth > MAX_DEPTH) return undefined;
    if (v === null || typeof v === 'boolean') return v;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    if (typeof v === 'string') return v.length > MAX_STR * 25 ? v.slice(0, MAX_STR * 25) : v;
    if (Array.isArray(v)) {
      var a = [];
      for (var i = 0; i < v.length; i++) { var x = jsonSafe(v[i], depth + 1, budget); a.push(x === undefined ? null : x); }
      return a;
    }
    if (typeof v === 'object') {
      var o = {};
      Object.keys(v).forEach(function (k) {
        if (U.badKey(k)) return;
        var y = jsonSafe(v[k], depth + 1, budget);
        if (y !== undefined) o[k] = y;
      });
      return o;
    }
    return undefined;
  }

  function fits(desc, v) {
    switch (desc.t) {
      case 'obj': case 'map': return U.isObj(v);
      case 'list': case 'rows': return Array.isArray(v);
      case 'num': return typeof v === 'number' && isFinite(v) || v === null && !!desc.nullable;
      case 'str': return typeof v === 'string';
      case 'bool': return typeof v === 'boolean';
      case 'enum': return desc.vals.indexOf(v) >= 0;
      default: return v !== undefined;
    }
  }
  function idOf(desc, item) {
    var v = U.isObj(item) ? item[desc.id] : undefined;
    if ((typeof v === 'string' && v !== '') || (typeof v === 'number' && isFinite(v))) return 'i:' + v;
    return 'j:' + JSON.stringify(item);
  }
  function sortBy(arr, key) {
    return arr.map(function (x, i) { return [x, i]; }).sort(function (a, b) {
      var ka = key(a[0]), kb = key(b[0]);
      return ka < kb ? -1 : ka > kb ? 1 : a[1] - b[1];
    }).map(function (p) { return p[0]; });
  }
  function finishList(desc, arr) {
    if (desc.sort) arr = sortBy(arr, function (x) { var v = U.isObj(x) ? +x[desc.sort] : 0; return isFinite(v) ? v : 0; });
    if (desc.cap && arr.length > desc.cap) arr = arr.slice(arr.length - desc.cap);
    return arr;
  }
  function okRow(desc, r) { return Array.isArray(r) && r.length >= (desc.minLen || 1) && typeof r[0] === 'number' && isFinite(r[0]); }
  function rowKey(r) { return r[0] + '|' + r[1]; }
  function finishRows(desc, rows) {
    var seen = new Map(), out = [];
    rows.forEach(function (r) { var k = rowKey(r); if (seen.has(k)) out[seen.get(k)] = r; else { seen.set(k, out.length); out.push(r); } });
    out = sortBy(out, function (r) { return r[0]; });
    if (desc.cap && out.length > desc.cap) out = out.slice(out.length - desc.cap);
    return out;
  }

  /** Repair `val` to fit `desc`. rep counts {fixed, dropped}. Never throws. */
  function sanitize(desc, val, rep, depth) {
    rep = rep || { fixed: 0, dropped: 0 };
    depth = depth || 0;
    if (depth > MAX_DEPTH) { rep.dropped++; return defaults(desc); }
    switch (desc.t) {
      case 'num': {
        if (val === null && desc.nullable) return null;
        var x = typeof val === 'number' ? val
          : typeof val === 'string' && val.trim() !== '' ? Number(val)
          : typeof val === 'boolean' ? +val : NaN;
        if (!isFinite(x)) { if (val !== undefined) rep.fixed++; return defaults(desc); }
        if (typeof val !== 'number') rep.fixed++;
        if (desc.int && Math.round(x) !== x) { x = Math.round(x); rep.fixed++; }
        if (desc.min != null && x < desc.min) { x = desc.min; rep.fixed++; }
        if (desc.max != null && x > desc.max) { x = desc.max; rep.fixed++; }
        return x;
      }
      case 'str': {
        if (val === null && desc.nullable) return null;
        if (typeof val === 'number' && isFinite(val)) { rep.fixed++; val = String(val); }
        if (typeof val !== 'string') { if (val !== undefined) rep.fixed++; return defaults(desc); }
        var max = desc.max || MAX_STR;
        if (val.length > max) { rep.fixed++; return val.slice(0, max); }
        return val;
      }
      case 'bool':
        if (typeof val === 'boolean') return val;
        if (val === 0 || val === 1) { rep.fixed++; return val === 1; }
        if (val !== undefined) rep.fixed++;
        return defaults(desc);
      case 'enum':
        if (desc.vals.indexOf(val) >= 0) return val;
        if (val !== undefined) rep.fixed++;
        return defaults(desc);
      case 'obj': {
        if (!U.isObj(val)) { if (val !== undefined) rep.fixed++; return defaults(desc); }
        var out = {};
        Object.keys(desc.fields).forEach(function (k) {
          var v = sanitize(desc.fields[k], val[k], rep, depth + 1);
          if (v !== undefined) out[k] = v;
        });
        if (!desc.strict) {
          Object.keys(val).forEach(function (k) {
            if (has(desc.fields, k) || U.badKey(k)) return;
            var v = jsonSafe(val[k], depth + 1);
            if (v !== undefined) out[k] = v;
          });
        }
        return out;
      }
      case 'map': {
        if (!U.isObj(val)) { if (val !== undefined) rep.fixed++; return {}; }
        var m = {}, n = 0;
        Object.keys(val).forEach(function (k) {
          if (U.badKey(k) || n >= MAX_KEYS || !fits(desc.of, val[k])) { rep.dropped++; return; }
          m[k] = sanitize(desc.of, val[k], rep, depth + 1);
          n++;
        });
        return m;
      }
      case 'list': {
        if (!Array.isArray(val)) { if (val !== undefined) rep.fixed++; return []; }
        var seen = new Map(), arr = [];
        val.forEach(function (item) {
          if (item === null || item === undefined || !fits(desc.of, item)) { rep.dropped++; return; }
          var s = sanitize(desc.of, item, rep, depth + 1), id = idOf(desc, s);
          if (seen.has(id)) { arr[seen.get(id)] = s; rep.dropped++; return; }
          seen.set(id, arr.length);
          arr.push(s);
        });
        return finishList(desc, arr);
      }
      case 'rows': {
        if (!Array.isArray(val)) { if (val !== undefined) rep.fixed++; return []; }
        var rows = [];
        val.forEach(function (r) { if (okRow(desc, r)) rows.push(jsonSafe(r, depth + 1)); else rep.dropped++; });
        var before = rows.length, done = finishRows(desc, rows);
        rep.dropped += before - done.length;
        return done;
      }
      default: {
        if (val === undefined) return defaults(desc);
        var c = jsonSafe(val, depth);
        return c === undefined ? defaults(desc) : c;
      }
    }
  }

  // ---- three-way merge
  function leaf(desc, a, b, ctx) {
    if (a === undefined) return b;
    if (b === undefined) return a;
    var rule = desc.merge || 'lww';
    if (rule === 'max' && typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
    if (rule === 'min' && typeof a === 'number' && typeof b === 'number') return Math.min(a, b);
    if (rule === 'or') return a || b;
    if (rule === 'newest') {
      var by = desc.by || 'at';
      var ta = U.isObj(a) ? +a[by] : NaN, tb = U.isObj(b) ? +b[by] : NaN;
      if (ta > tb || (isFinite(ta) && !isFinite(tb))) return a;
      if (tb > ta || (isFinite(tb) && !isFinite(ta))) return b;
    }
    return ctx.oursNewer ? a : b;
  }
  function mergeKeys(descOf, base, ours, theirs, ctx) {
    var out = {}, b = U.isObj(base) ? base : {};
    var keys = Object.keys(ours).concat(Object.keys(theirs).filter(function (k) { return !has(ours, k); }));
    keys.forEach(function (k) {
      if (U.badKey(k)) return;
      var v = merge3(descOf(k), has(b, k) ? b[k] : undefined, has(ours, k) ? ours[k] : undefined,
        has(theirs, k) ? theirs[k] : undefined, ctx);
      if (v !== undefined) out[k] = v;
    });
    return out;
  }
  function index(desc, arr) {
    var m = new Map();
    (Array.isArray(arr) ? arr : []).forEach(function (x) { m.set(idOf(desc, x), x); });
    return m;
  }
  function mergeList(desc, base, ours, theirs, ctx) {
    var bm = index(desc, base), om = index(desc, ours), tm = index(desc, theirs), out = [];
    var ids = Array.from(om.keys()).concat(Array.from(tm.keys()).filter(function (k) { return !om.has(k); }));
    ids.forEach(function (id) {
      var v = merge3(desc.of, bm.get(id), om.get(id), tm.get(id), ctx);
      if (v !== undefined) out.push(v);
    });
    return finishList(desc, out);
  }
  function mergeRows(desc, base, ours, theirs) {
    var bk = new Set((Array.isArray(base) ? base : []).map(rowKey));
    var tk = new Set(theirs.map(rowKey)), ok = new Set(ours.map(rowKey));
    // A row one side removed (that was in base) stays removed unless the other side added it anew.
    var rows = ours.filter(function (r) { return tk.has(rowKey(r)) || !bk.has(rowKey(r)); })
      .concat(theirs.filter(function (r) { return !ok.has(rowKey(r)) && !bk.has(rowKey(r)); }));
    return finishRows(desc, rows);
  }
  function deep(desc) { return !desc.merge || desc.merge === 'deep'; }

  /** Merge two edits of one value that share `base`. ctx.oursNewer breaks lww ties. */
  function merge3(desc, base, ours, theirs, ctx) {
    desc = desc || ANY;
    ctx = ctx || { oursNewer: true };
    if (U.deepEqual(ours, theirs)) return ours;
    if (base === undefined && theirs === undefined) return ours;
    if (base === undefined && ours === undefined) return theirs;
    if (U.deepEqual(base, ours)) return theirs;
    if (U.deepEqual(base, theirs)) return ours;
    if (deep(desc)) {
      if (desc.t === 'obj' && U.isObj(ours) && U.isObj(theirs)) {
        return mergeKeys(function (k) { return has(desc.fields, k) ? desc.fields[k] : ANY; }, base, ours, theirs, ctx);
      }
      if (desc.t === 'map' && U.isObj(ours) && U.isObj(theirs)) {
        return mergeKeys(function () { return desc.of; }, base, ours, theirs, ctx);
      }
      if (desc.t === 'list' && Array.isArray(ours) && Array.isArray(theirs)) return mergeList(desc, base, ours, theirs, ctx);
      if (desc.t === 'rows' && Array.isArray(ours) && Array.isArray(theirs)) return mergeRows(desc, base, ours, theirs);
    }
    return leaf(desc, ours, theirs, ctx);
  }

  // ---- v1 schemas (CONTRACTS §7). `v` is the record's schema version.
  var now = function () { return Date.now(); };
  var SCHEMAS = {
    profile: { v: 1, desc: T.obj({
      createdAt: T.num(now, { min: 0, merge: 'min' }),
      nickname: T.str('', { max: 40 }),
      settings: T.obj({
        theme: T.en(['system', 'light', 'dark'], 'system'),
        mode: T.en(['edge', 'path', 'variety', 'focus', 'free'], 'edge'),
        sessionMin: T.int(15, { min: 5, max: 60 }),
        headphones: T.bool(false),
        hpCheck: T.any(null),
        volumeSet: T.num(0, { min: 0, merge: 'max' }),
        playtest: T.bool(false),
        captions: T.bool(false)
      }),
      welcomeSeen: T.num(0, { min: 0, merge: 'max' }),
      tutorials: T.map(T.any(true, { merge: 'or' })),
      cards: T.map(T.num(0, { min: 0, merge: 'min' }))          // strategy cards already shown: id → first shown
    }) },
    learner: { v: 1, desc: T.obj({
      dials: T.map(T.obj({ m: T.num(0), s: T.num(1, { min: 0 }), n: T.int(0, { min: 0 }), at: T.num(0, { min: 0 }) },
        { merge: 'newest', by: 'at' })),
      breadth: T.map(T.num(0, { min: 0, max: 1 })),
      recent: T.map(T.any([])),                                   // per-trial proportions (0, 0.5, 1 …), newest last
      cond: T.map(T.any(null, { merge: 'newest', by: 'at' })),    // engine records keyed by id: newer `at` wins
      path: T.map(T.any(null, { merge: 'newest', by: 'at' })),
      best: T.map(T.num(0, { merge: 'max' })),                    // best ability per dial (higher is better)
      plat: T.map(T.any(null, { merge: 'newest', by: 'at' })),
      edge: T.map(T.any(null, { merge: 'newest', by: 'at' })),
      cast: T.map(T.any(null, { merge: 'newest', by: 'at' })),
      n: T.int(0, { min: 0, merge: 'max' }),                      // trials the learner has seen
      seed: T.str('')
    }) },
    log: { v: 1, desc: T.obj({
      sessions: T.list(T.obj({ id: T.str(''), start: T.num(0, { min: 0 }), end: T.num(0, { min: 0 }),
        activeMs: T.num(0, { min: 0 }), mode: T.str('edge'), sets: T.any([]) }, { merge: 'newest', by: 'end' }),
      { id: 'id', sort: 'start', cap: 3000 })
    }) },
    trials: { v: 1, desc: T.obj({ rows: T.rows({ cap: 3000, minLen: 5 }) }) },
    lab: { v: 1, desc: T.obj({
      runs: T.list(T.obj({ id: T.str(''), probe: T.str(''), at: T.num(0, { min: 0 }), practice: T.bool(false) },
        { merge: 'newest', by: 'at' }), { id: 'id', sort: 'at', cap: 2000 })
    }) },
    game: { v: 1, desc: T.obj({
      venues: T.map(T.any(null)), cast: T.map(T.any(null)),
      badges: T.map(T.num(0, { merge: 'min' })), pbs: T.map(T.any(null)), weekly: T.map(T.any(null))
    }) },
    diary: { v: 1, desc: T.obj({
      entries: T.list(T.obj({ week: T.str(''), at: T.num(0, { min: 0 }) }, { merge: 'newest', by: 'at' }),
        { id: 'week', sort: 'at', cap: 520 }),
      events: T.list(T.any(null), { id: 'id', sort: 'at', cap: 2000 })
    }) },
    missions: { v: 1, desc: T.obj({ weeks: T.map(T.any(null, { merge: 'newest', by: 'at' })) }) },
    playtest: { v: 1, desc: T.obj({
      ratings: T.list(T.any(null), { id: 'id', sort: 'at', cap: 400 }),
      notes: T.list(T.any(null), { id: 'id', sort: 'at', cap: 400 }),
      errors: T.list(T.any(null), { id: 'id', sort: 'at', cap: 120 }),
      frames: T.list(T.any(null), { id: 'id', sort: 'at', cap: 80 }),
      sets: T.list(T.any(null), { id: 'id', sort: 'at', cap: 400 }),
      screens: T.list(T.any(null), { id: 'id', sort: 'at', cap: 300 }),
      firstAt: T.num(0, { min: 0, merge: 'min' })
    }) }
  };

  // Migrations: MIGRATIONS[key][fromV] = function (rec) → record at fromV + 1. None yet (v1 is the first).
  var MIGRATIONS = {};

  function current(key) { return SCHEMAS[key] ? SCHEMAS[key].v : 1; }
  function descOf(key) { return SCHEMAS[key] ? SCHEMAS[key].desc : T.obj({}); }
  /** Bring an older record up to the current schema version. Returns { rec, newer }. */
  function migrate(key, rec) {
    if (!U.isObj(rec)) return { rec: rec, newer: false };
    var v = typeof rec.v === 'number' && isFinite(rec.v) ? Math.floor(rec.v) : current(key);
    if (v > current(key)) return { rec: rec, newer: true };
    var r = rec, guard = 0;
    while (v < current(key) && guard++ < 50) {
      var fn = MIGRATIONS[key] && MIGRATIONS[key][v];
      if (typeof fn === 'function') { try { r = fn(U.copy(r)) || r; } catch (e) { /* keep r; sanitize repairs */ } }
      v++;
    }
    return { rec: r, newer: false };
  }
  function sanitizeRecord(key, rec, rep) {
    var out = sanitize(descOf(key), rec, rep);
    out.v = current(key);
    return out;
  }
  function defaultRecord(key) { var r = defaults(descOf(key)); r.v = current(key); return r; }
  function mergeRecord(key, base, ours, theirs, ctx) {
    var out = merge3(descOf(key), base, ours, theirs, ctx);
    if (U.isObj(out)) out.v = current(key);
    return out;
  }

  ES.core.storeSchema = {
    T: T, SCHEMAS: SCHEMAS, MIGRATIONS: MIGRATIONS, defaults: defaults, sanitize: sanitize, merge3: merge3,
    jsonSafe: jsonSafe, current: current, descOf: descOf, migrate: migrate, sanitizeRecord: sanitizeRecord,
    defaultRecord: defaultRecord, mergeRecord: mergeRecord
  };
})(window.ES);
