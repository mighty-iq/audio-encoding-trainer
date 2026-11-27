/* ES.core.store — versioned records on this device only (CONTRACTS §3, §7).
   localStorage keys `earshot.v1.<key>` hold an envelope { rev, at, by, rec }; `rec.v` is the schema version.
   - Blocked storage (sandboxed preview, privacy mode) → memory mode; status().saved stays false (banner).
   - Storage full → the write fails, the record stays in memory, saved:false + lastError:'quota' until a later
     write succeeds; nearFull is raised early by a headroom probe and by our own size.
   - A record from a newer schema (or `earshot.v2.` keys) → read-only memory mode: this tab never writes.
   - Two tabs: before each write the stored text is compared with the last one this tab saw; if another tab
     wrote meanwhile, the records are merged field by field (store-schema.js rules), as are `storage` events
     that arrive while this tab holds unsaved changes.
   - hold()/release(): writes wait while a stimulus plays (CONTRACTS §0) and flush on release or page hide. */
(function (ES, win) {
  'use strict';
  var U = ES.core.util, SC = ES.core.storeSchema;
  var PREFIX = 'earshot.v1.';
  var KEYS = Object.keys(SC.SCHEMAS);
  var EXPORT_KEYS = KEYS.filter(function (k) { return k !== 'playtest' && k !== 'session'; });
  var NEAR_FULL_CHARS = 3500000, PROBE_CHARS = 262144, MAX_IMPORT_CHARS = 40000000;
  var TAB = U.uid('tab');

  var ls = null, held = 0, inited = false, listening = false;
  var S, cache, baseRec, baseRaw, dirty, sizes;
  function resetState() {
    S = { mode: 'memory', reason: 'init', readOnly: false, saved: true, lastError: null, bytes: 0, nearFull: false,
      newerVersion: false, corrupt: [] };
    cache = {}; baseRec = {}; baseRaw = {}; dirty = {}; sizes = {};
  }
  resetState();

  function isQuota(e) {
    return !!e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014);
  }
  function fresh(key) { return { rev: 0, at: 0, by: '', rec: SC.defaultRecord(key) }; }
  function entry(key) { if (!cache[key]) cache[key] = fresh(key); return cache[key]; }
  /** Defaults in memory; they are also the base for merges (every tab starts from the same defaults). */
  function freshen(key) { cache[key] = fresh(key); baseRaw[key] = null; baseRec[key] = U.copy(cache[key].rec); }
  function parseEnv(raw) {
    if (typeof raw !== 'string' || !raw) return null;
    var o;
    try { o = JSON.parse(raw); } catch (e) { return null; }
    if (!U.isObj(o)) return null;
    if (U.isObj(o.rec)) return { rev: +o.rev || 0, at: +o.at || 0, by: String(o.by || ''), rec: o.rec };
    if (has(o, 'v')) return { rev: 0, at: 0, by: '', rec: o };   // a bare record (hand-made or older tool)
    return null;
  }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function emitStatus() { ES.hooks.emit('store:status', status()); }
  function changed(key, source) { ES.hooks.emit('store:changed', { key: key, source: source }); }

  var newerRecs = {};
  function adopt(key, raw, env) {
    var m = SC.migrate(key, env.rec);
    if (m.newer) { newerRecs[key] = env; cache[key] = fresh(key); goNewer(); return false; }   // readers get v1 defaults
    var rec = SC.sanitizeRecord(key, m.rec);
    cache[key] = { rev: env.rev, at: env.at, by: env.by, rec: rec };
    baseRaw[key] = raw;
    baseRec[key] = U.copy(rec);
    return true;
  }
  function load(key) {
    var raw = null;
    try { raw = ls.getItem(PREFIX + key); } catch (e) { raw = null; }
    if (raw == null) { freshen(key); return; }
    sizes[key] = (PREFIX.length + key.length + raw.length) * 2;
    var env = parseEnv(raw);
    if (!env) {
      S.corrupt.push(key);
      try { if (ls.getItem(PREFIX + key + '.corrupt') == null) ls.setItem(PREFIX + key + '.corrupt', raw); } catch (e) { /* full */ }
      freshen(key); baseRaw[key] = raw;
      return;
    }
    adopt(key, raw, env);
  }
  function scanNewer() {
    try {
      for (var i = 0; i < ls.length; i++) {
        var m = /^earshot\.v(\d+)\./.exec(ls.key(i) || '');
        if (m && +m[1] > 1) S.newerVersion = true;
      }
    } catch (e) { /* ignore */ }
  }
  function probeHeadroom() {
    var k = PREFIX + '$probe';
    try { ls.setItem(k, new Array(PROBE_CHARS + 1).join('x')); ls.removeItem(k); S.nearFull = S.bytes / 2 > NEAR_FULL_CHARS; }
    catch (e) { S.nearFull = true; try { ls.removeItem(k); } catch (e2) { /* ignore */ } }
  }
  function measure() {
    var b = 0;
    KEYS.forEach(function (k) { b += sizes[k] || 0; });
    S.bytes = b;
    if (b / 2 > NEAR_FULL_CHARS) S.nearFull = true;
  }
  function goNewer() {
    if (S.readOnly) return;
    S.newerVersion = true; S.readOnly = true; S.mode = 'memory'; S.reason = 'newer'; S.saved = false;
    emitStatus();
  }
  function resetAll(source) {
    KEYS.forEach(freshen);
    dirty = {}; sizes = {};
    changed('*', source);
  }

  /** Start the store. opts.storage injects a Storage-like object (tests); opts.force re-initialises. */
  function init(opts) {
    opts = opts || {};
    if (inited && !opts.force) return Promise.resolve({ mode: S.mode, reason: S.reason });
    inited = true; held = 0; ls = null;
    resetState();
    var cand = null;
    try {
      cand = has(opts, 'storage') ? opts.storage : win.localStorage;
      if (!cand) throw new Error('no storage');
      cand.getItem(PREFIX + '$t');
    } catch (e) { cand = null; S.reason = 'blocked'; }
    if (cand) {
      ls = cand; S.mode = 'persistent'; S.reason = 'ok';
      try { cand.setItem(PREFIX + '$t', '1'); cand.removeItem(PREFIX + '$t'); }
      catch (e) {
        if (isQuota(e)) { S.saved = false; S.lastError = 'quota'; S.nearFull = true; }
        else { ls = null; S.mode = 'memory'; S.reason = 'blocked'; }
      }
    }
    if (ls) {
      scanNewer();
      KEYS.forEach(load);
      if (S.newerVersion) { S.readOnly = false; goNewer(); }
      measure();
      if (!S.readOnly && S.lastError !== 'quota') probeHeadroom();
    } else {
      KEYS.forEach(function (k) { cache[k] = fresh(k); });
      S.saved = false; S.lastError = 'blocked';
      measure();
    }
    listen();
    emitStatus();
    return Promise.resolve({ mode: S.mode, reason: S.reason });
  }
  function listen() {
    if (listening || !win || typeof win.addEventListener !== 'function') return;
    listening = true;
    win.addEventListener('storage', onStorage);
    win.addEventListener('pagehide', forceFlush);
    if (win.document && win.document.addEventListener) {
      win.document.addEventListener('visibilitychange', function () { if (win.document.hidden) forceFlush(); });
    }
  }

  function refresh(key) {
    if (!ls || S.readOnly || dirty[key]) return;
    var raw;
    try { raw = ls.getItem(PREFIX + key); } catch (e) { return; }
    if (raw === baseRaw[key]) return;
    if (raw == null) { freshen(key); return; }
    var env = parseEnv(raw);
    if (env) adopt(key, raw, env);
  }
  /** A deep copy of the record (defaults when missing). */
  function get(key) { refresh(key); return U.copy(entry(key).rec); }
  /** The live record without copying: read-only use. */
  function peek(key) { refresh(key); return entry(key).rec; }

  function flush(key) {
    if (!dirty[key]) return true;
    if (S.readOnly || !ls) { S.saved = false; return false; }
    if (held > 0) return false;
    var e = cache[key], raw;
    try { raw = ls.getItem(PREFIX + key); } catch (err) { raw = baseRaw[key]; }
    if (raw != null && raw !== baseRaw[key]) {          // another tab wrote since this tab last looked
      var theirs = parseEnv(raw);
      if (theirs) {
        var m = SC.migrate(key, theirs.rec);
        if (m.newer) { goNewer(); return false; }
        var trec = SC.sanitizeRecord(key, m.rec);
        var merged = SC.mergeRecord(key, baseRec[key], e.rec, trec, { oursNewer: true });
        e = cache[key] = { rev: Math.max(e.rev, theirs.rev) + 1, at: Date.now(), by: TAB, rec: merged };
      }
    }
    var out = JSON.stringify(e);
    try { ls.setItem(PREFIX + key, out); }
    catch (err) {
      var wasErr = S.lastError;
      S.saved = false; S.lastError = isQuota(err) ? 'quota' : 'write';
      if (isQuota(err)) S.nearFull = true;
      if (wasErr !== S.lastError) emitStatus();
      return false;
    }
    baseRaw[key] = out; baseRec[key] = U.copy(e.rec); delete dirty[key];
    sizes[key] = (PREFIX.length + key.length + out.length) * 2;
    var before = S.saved;
    S.saved = Object.keys(dirty).length === 0;
    if (S.saved) S.lastError = null;
    measure();
    if (before !== S.saved) emitStatus();
    return true;
  }
  function flushAll() { var ok = true; Object.keys(dirty).forEach(function (k) { ok = flush(k) && ok; }); return ok; }
  function forceFlush() { var h = held; held = 0; flushAll(); held = h; }

  /** Replace a record (repaired to its schema). Returns true when it reached persistent storage. */
  function set(key, obj) {
    if (!U.isObj(obj)) return false;
    var rec = SC.sanitizeRecord(key, obj);
    var e = entry(key), sch = SC.SCHEMAS[key];
    // A record saved from a long-lived copy (the engine's learner) merges per record with what other tabs wrote.
    if (sch && typeof sch.onSet === 'function' && e.rev > 0) rec = SC.sanitizeRecord(key, sch.onSet(e.rec, rec));
    cache[key] = { rev: e.rev + 1, at: Date.now(), by: TAB, rec: rec };
    dirty[key] = true;
    var ok = flush(key);
    if (ok && Object.keys(dirty).length) flushAll();              // space came back: retry what failed before (status reports it)
    if (!ls || S.readOnly) {
      try { sizes[key] = JSON.stringify(cache[key]).length * 2; } catch (e) { /* ignore */ }
      measure();
    }
    changed(key, 'local');
    return ok;
  }
  /** fn(copy) may mutate the copy or return a new record. */
  function update(key, fn) {
    refresh(key);
    var rec = U.copy(entry(key).rec);
    var out = fn(rec);
    return set(key, out === undefined ? rec : out);
  }
  function hold() { held++; }
  function release() { if (held > 0) held--; if (held === 0) return flushAll(); return false; }

  var lastWipe = '';
  function wiped(stamp) { if (stamp === lastWipe) return true; lastWipe = stamp; return false; }   // one reset per wipe
  function onStorage(ev) {
    if (!ls || !ev) return;
    try { if (ev.storageArea && ev.storageArea !== ls) return; } catch (e) { /* ignore */ }
    var k = ev.key;
    if (k === null || k === undefined) { if (!S.readOnly) resetAll('remote'); return; }
    if (k.indexOf(PREFIX) !== 0) { var m = /^earshot\.v(\d+)\./.exec(k); if (m && +m[1] > 1) goNewer(); return; }
    var key = k.slice(PREFIX.length);
    // Delete everything in another tab: it sets and at once removes `$wipe`; either event is the signal (under load a
    // browser may hand over only the removal, which still carries the old value).
    if (key === '$wipe') { if ((ev.newValue || ev.oldValue) && !S.readOnly && !wiped(ev.newValue || ev.oldValue)) { resetAll('wipe'); S.corrupt = []; emitStatus(); } return; }
    if (!SC.SCHEMAS[key] || S.readOnly) return;
    var raw = ev.newValue;
    if (raw === baseRaw[key]) return;
    if (raw == null) {
      if (!dirty[key]) { freshen(key); changed(key, 'remote'); }
      return;
    }
    var theirs = parseEnv(raw);
    if (!theirs) return;
    if (!dirty[key]) { if (adopt(key, raw, theirs)) changed(key, 'remote'); return; }
    var mg = SC.migrate(key, theirs.rec);
    if (mg.newer) { goNewer(); return; }
    var trec = SC.sanitizeRecord(key, mg.rec), e = cache[key];
    var merged = SC.mergeRecord(key, baseRec[key], e.rec, trec, { oursNewer: e.at >= theirs.at });
    cache[key] = { rev: Math.max(e.rev, theirs.rev) + 1, at: Date.now(), by: TAB, rec: merged };
    baseRaw[key] = raw; baseRec[key] = U.copy(trec);
    flush(key);
    changed(key, 'remote');
  }

  function status() {
    return { mode: S.mode, reason: S.reason, saved: S.saved, lastError: S.lastError, bytes: S.bytes,
      nearFull: S.nearFull, newerVersion: S.newerVersion, readOnly: S.readOnly, held: held > 0,
      corrupt: S.corrupt.slice(), pending: Object.keys(dirty) };
  }

  /** The whole record as one versioned object (no device facts; own-voice recordings never included). */
  function exportAll() {
    var records = {};
    EXPORT_KEYS.forEach(function (k) { records[k] = U.copy(entry(k).rec); });
    return { format: 'earshot-backup', fv: 1, app: 'Earshot', appVersion: ES.VERSION, exportedAt: U.isoUtc(), records: records };
  }
  function parseLoose(text) {
    var s = String(text).replace(/^﻿/, '').trim();
    try { return JSON.parse(s); } catch (e) { /* try the outermost braces */ }
    var a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; } }
    return null;
  }
  /** Merge a backup into this device's record (nothing here is deleted). Accepts an object or JSON text. All or
      nothing (RV M9): a record from a newer version or with damaged contents (any wrong type or out-of-range value
      inside it) refuses the whole import and changes nothing. → { ok, imported:[keys], saved, error?, damaged?, keys? } */
  function importAll(input) {
    var fail = function (error, extra) { var r = { ok: false, error: error, imported: [], skipped: [], repaired: 0 }; if (extra) for (var k in extra) r[k] = extra[k]; return r; };
    var obj = input;
    if (typeof input === 'string') {
      if (input.length > MAX_IMPORT_CHARS) return fail('too-large');
      obj = parseLoose(input);
    }
    if (!U.isObj(obj)) return fail('not-a-backup');
    if (S.readOnly) return fail('read-only');
    var records = U.isObj(obj.records) ? obj.records : null;
    if (!records) {
      records = {};
      Object.keys(obj).forEach(function (k) {
        var name = k.indexOf(PREFIX) === 0 ? k.slice(PREFIX.length) : k;
        if (EXPORT_KEYS.indexOf(name) < 0) return;
        var v = obj[k];
        if (typeof v === 'string') { var env = parseEnv(v); v = env ? env.rec : parseLoose(v); }
        else if (U.isObj(v) && U.isObj(v.rec) && has(v, 'rev')) v = v.rec;
        records[name] = v;
      });
    }
    var plan = [], damaged = [], newer = [];
    EXPORT_KEYS.forEach(function (key) {
      if (!has(records, key)) return;
      var rec = records[key];
      if (typeof rec === 'string') rec = parseLoose(rec);
      if (!U.isObj(rec)) { damaged.push({ key: key, fixed: 0, dropped: 1 }); return; }
      var m = SC.migrate(key, rec);
      if (m.newer) { newer.push(key); return; }
      var r = { fixed: 0, dropped: 0 };
      var clean = SC.sanitizeRecord(key, m.rec, r);
      if (r.fixed + r.dropped > 0) { damaged.push({ key: key, fixed: r.fixed, dropped: r.dropped }); return; }
      plan.push({ key: key, rec: clean });
    });
    if (newer.length) return fail('newer-version', { keys: newer });
    if (damaged.length) return fail('damaged', { damaged: damaged });
    if (!plan.length) return fail('not-a-backup');
    var saved = true;
    plan.forEach(function (x) {
      var merged = SC.mergeRecord(x.key, undefined, entry(x.key).rec, x.rec, { oursNewer: false });
      if (!set(x.key, merged)) saved = false;
    });
    changed('*', 'import');
    return { ok: true, imported: plan.map(function (x) { return x.key; }), skipped: [], repaired: 0, saved: saved };
  }

  /** Delete every Earshot record on this device (and own-voice recordings). */
  function wipe() {
    if (S.readOnly) return { ok: false, reason: 'read-only' };
    if (ls) {
      var mine = [];
      try { for (var i = 0; i < ls.length; i++) { var k = ls.key(i); if (k && k.indexOf(PREFIX) === 0) mine.push(k); } } catch (e) { /* ignore */ }
      mine.forEach(function (k) { try { ls.removeItem(k); } catch (e) { /* ignore */ } });
      try { ls.setItem(PREFIX + '$wipe', String(Date.now())); ls.removeItem(PREFIX + '$wipe'); } catch (e) { /* ignore */ }
    }
    try { if (win.indexedDB && win.indexedDB.deleteDatabase) win.indexedDB.deleteDatabase('earshot-own'); } catch (e) { /* ignore */ }
    resetAll('wipe');
    S.corrupt = []; S.nearFull = false;
    if (ls) { S.saved = true; S.lastError = null; probeHeadroom(); }
    measure();
    emitStatus();
    return { ok: true };
  }

  ES.core.store = {
    PREFIX: PREFIX, KEYS: KEYS, EXPORT_KEYS: EXPORT_KEYS, tab: TAB,
    init: init, get: get, peek: peek, set: set, update: update, status: status, hold: hold, release: release,
    flush: flushAll, exportAll: exportAll, importAll: importAll, wipe: wipe, parseLoose: parseLoose,
    _onStorage: onStorage
  };
})(window.ES, window);
