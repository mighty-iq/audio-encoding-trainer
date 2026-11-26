/* ES.lab.exporter — exports and import (CONTRACTS §7, §11; PLAN §8). Pure builders; the screens deliver them.
   - json(): the versioned backup of every store key (ES.core.store.exportAll: no playtest record; own-voice
     recordings live in IndexedDB and are never included).
   - csv('runs' | 'sessions'): one row per probe run or training session; text cells are guarded against
     spreadsheet formula injection.
   - pooled(opts): the community format: a random pooling id, no name unless opts.nickname and a nickname exists,
     no user agent, language or time zone unless opts.device; days and weeks relative to the player's own start,
     no record ids (they embed times), no absolute times except the UTC export date.
   - importJson(text): detects what was given (backup of any version, bare records, a localStorage dump, a pooled
     file, CSV, damaged JSON), upgrades older backups through BACKUP_MIGRATIONS, merges through the store (nothing
     on this device is deleted), and reports in plain words. MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var L = ES.lab = ES.lab || {};
  var X = L.exporter = {};
  var FV = 1, POOL_FV = 1, DAY = 864e5, MAX_CHARS = 40000000;

  function U() { return ES.core.util; }
  function st() { return ES.core.store; }
  function isObj(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }
  function r2(x) { return typeof x === 'number' && isFinite(x) ? Math.round(x * 100) / 100 : null; }
  function utcDate(ms) { return new Date(ms == null ? Date.now() : ms).toISOString().slice(0, 10); }
  function iso(ms) { return typeof ms === 'number' && isFinite(ms) && ms > 0 ? new Date(ms).toISOString() : ''; }

  // ---- display helpers shared with the screens
  X.showValue = function (id, m) {
    var p = L.probes[id];
    if (m == null || !isFinite(m) || !p) return '';
    if (id === 'rooms') { var mt = p.metres(m); return (mt < 10 ? Math.round(mt * 10) / 10 : Math.round(mt)) + ' m'; }
    if (p.unit === 'dB') return U().fmtDb(m);
    if (p.unit === '%') return Math.round(m) + ' %';
    return (Math.round(m * 10) / 10) + ' of 5';
  };

  /** A change in the probe's "better" direction, in words with units (Rooms: as a distance factor). */
  X.showGain = function (id, g) {
    var p = L.probes[id];
    if (g == null || !isFinite(g) || !p) return '';
    var a = Math.abs(g);
    if (id === 'rooms') { var f = Math.pow(2, a / 6.02); return '×' + (Math.round(f * 100) / 100) + ' the distance'; }
    if (p.unit === 'dB') return (Math.round(a * 10) / 10) + ' dB';
    if (p.unit === '%') return Math.round(a) + ' points';
    return (Math.round(a * 10) / 10) + ' points';
  };

  // ---- JSON backup
  X.json = function () {
    var obj = st().exportAll(), text = JSON.stringify(obj, null, 1);
    return { kind: 'backup', name: 'earshot-backup-' + utcDate() + '.json', text: text, mime: 'application/json', obj: obj };
  };

  // ---- CSV
  X.csvCell = function (v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return isFinite(v) ? String(v) : '';
    if (typeof v === 'boolean') return v ? '1' : '0';
    var s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;   // formula injection guard for text cells
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  function table(head, rows) { return [head.join(',')].concat(rows.map(function (r) { return r.map(X.csvCell).join(','); })).join('\r\n') + '\r\n'; }
  X.runRows = function (runs) {
    return (runs || []).map(L.records.normalize).filter(Boolean).sort(function (a, b) { return a.at - b.at; }).map(function (r) {
      var p = L.probes[r.probe] || {};
      return [r.id, r.probe, p.name || r.probe, p.distance || '', r.proc || '', r.kind || '', !!r.practice, iso(r.at),
        r.end && r.at ? r2((r.end - r.at) / 60000) : null, r2(r.est.m), r2(r.est.s), r.unit || p.unit || '', X.showValue(r.probe, r.est.m),
        r.n || 0, r.hp == null ? '' : !!r.hp, r.edge || '', r.form == null ? '' : r.form, !!r.aborted];
    });
  };
  X.csv = function (kind, data) {
    var name = 'earshot-' + (kind === 'sessions' ? 'sessions' : 'probe-runs') + '-' + utcDate() + '.csv', text;
    if (kind === 'sessions') {
      var sessions = data || (st().peek('log').sessions || []);
      text = table(['session_id', 'start_utc', 'end_utc', 'active_min', 'mode', 'sets', 'trials', 'correct', 'exercises', 'demo'],
        sessions.slice().sort(function (a, b) { return (a.start || 0) - (b.start || 0); }).map(function (s) {
          var sets = Array.isArray(s.sets) ? s.sets : [], n = 0, c = 0, ex = [];
          sets.forEach(function (x) { n += x && x.n || 0; c += x && x.correct || 0; if (x && x.ex && ex.indexOf(x.ex) < 0) ex.push(x.ex); });
          return [s.id, iso(s.start), iso(s.end), r2((s.activeMs || 0) / 60000), s.mode || '', sets.length, n, c, ex.join(' '), !!s.demo];
        }));
    } else {
      text = table(['run_id', 'probe', 'probe_name', 'distance', 'procedure', 'kind', 'practice', 'started_utc', 'minutes', 'estimate', 'sd',
        'unit', 'shown', 'trials', 'headphones', 'edge', 'form', 'aborted'], X.runRows(data || st().peek('lab').runs || []));
    }
    return { kind: 'csv-' + (kind === 'sessions' ? 'sessions' : 'runs'), name: name, text: text, mime: 'text/csv' };
  };

  // ---- pooled community format
  X.pooledObject = function (src, opts) {
    opts = opts || {};
    var runs = (src.runs || []).map(L.records.normalize).filter(function (r) { return r && !r.aborted; }).sort(function (a, b) { return a.at - b.at; });
    var sessions = (src.sessions || []).filter(function (s) { return s && !s.demo && s.start; });
    var t0 = Math.min.apply(null, runs.map(function (r) { return r.at; }).concat(sessions.map(function (s) { return s.start; })).concat([Date.now()]));
    var week = function (ms) { return Math.floor((ms - t0) / (7 * DAY)); };
    var obj = { format: 'earshot-pooled', fv: POOL_FV, app: 'Earshot', appVersion: ES.VERSION, exportedOn: utcDate(), pid: src.pid,
      procedures: {}, probes: [], training: [], diary: [] };
    Object.keys(L.probes).forEach(function (id) { obj.procedures[id] = L.probes[id].proc; });
    if (opts.nickname && src.nickname) obj.nickname = String(src.nickname).slice(0, 40);
    if (opts.device && src.device) obj.device = src.device;
    runs.forEach(function (r) {
      var row = { probe: r.probe, proc: r.proc, day: r2((r.at - t0) / DAY), kind: r.kind, practice: !!r.practice, est: r2(r.est.m), sd: r2(r.est.s),
        n: r.n || 0, unit: r.unit, hp: r.hp == null ? null : !!r.hp, edge: r.edge || null };
      if (r.extra && typeof r.extra === 'object') {
        var keep = {};
        ['slope', 'lapse', 'pc', 'fit', 'metres', 'slope10', 'first', 'last', 'bands', 'effort', 'snr', 'intrusions'].forEach(function (k) { if (typeof r.extra[k] === 'number') keep[k] = r2(r.extra[k]); });
        row.extra = keep;
      }
      if (opts.trials !== false && Array.isArray(r.trials)) row.trials = r.trials.slice(0, 64);
      obj.probes.push(row);
    });
    var byWeek = {};
    sessions.forEach(function (s) {
      var w = week(s.start), b = byWeek[w] = byWeek[w] || { week: w, sessions: 0, activeMin: 0, byEx: {} };
      b.sessions++; b.activeMin += (s.activeMs || 0) / 60000;
      var sets = Array.isArray(s.sets) ? s.sets : [], per = sets.length ? (s.activeMs || 0) / 60000 / sets.length : 0;
      sets.forEach(function (x) { if (x && x.ex) b.byEx[x.ex] = (b.byEx[x.ex] || 0) + per; });
    });
    Object.keys(byWeek).map(Number).sort(function (a, b) { return a - b; }).forEach(function (w) {
      var b = byWeek[w]; b.activeMin = r2(b.activeMin); Object.keys(b.byEx).forEach(function (k) { b.byEx[k] = r2(b.byEx[k]); });
      obj.training.push(b);
    });
    ((src.diary && src.diary.entries) || []).forEach(function (e) {
      if (!e || !e.at || !Array.isArray(e.items)) return;
      var items = {};
      e.items.forEach(function (it) { if (it && typeof it === 'object' && it.id) items[it.id] = it.v >= 1 && it.v <= 5 ? it.v : null; });
      obj.diary.push({ week: week(e.at), items: items });
    });
    return obj;
  };
  X.deviceFacts = function () {
    var w = root, n = w.navigator || {}, tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { tz = ''; }
    var scr = w.screen ? w.screen.width + 'x' + w.screen.height : '';
    return { ua: String(n.userAgent || ''), lang: String(n.language || ''), tz: tz, screen: scr, touch: (n.maxTouchPoints || 0) > 0 };
  };
  X.pooled = function (opts) {
    opts = opts || {};
    var s = st(), prof = s.peek('profile');
    var obj = X.pooledObject({ runs: s.peek('lab').runs || [], sessions: s.peek('log').sessions || [], diary: s.peek('diary'),
      pid: L.records.pid(), nickname: prof.nickname, device: opts.device ? X.deviceFacts() : null }, opts);
    return { kind: 'pooled', name: 'earshot-pool-' + utcDate() + '.json', text: JSON.stringify(obj, null, 1), mime: 'application/json', obj: obj };
  };

  // ---- import
  var BACKUP_MIGRATIONS = X.BACKUP_MIGRATIONS = {
    // fv 0: a backup made before the format had a version (an object with `records`, or bare records)
    0: function (o) { return { format: 'earshot-backup', fv: 1, app: o.app || 'Earshot', appVersion: o.appVersion || o.version || '0', exportedAt: o.exportedAt || '', records: o.records || o }; }
  };
  X.detect = function (obj, text) {
    if (typeof text === 'string' && !isObj(obj)) {
      var head = text.slice(0, 400);
      if (/^\s*(run_id|session_id),/.test(head)) return 'csv';
      return text.trim() ? 'damaged' : 'empty';
    }
    if (!isObj(obj)) return 'unknown';
    if (obj.format === 'earshot-pooled') return 'pooled';
    if (obj.format === 'earshot-backup') return typeof obj.fv === 'number' && obj.fv > FV ? 'newer' : 'backup';
    var keys = Object.keys(obj);
    if (keys.some(function (k) { return k.indexOf('earshot.v') === 0; })) return 'storage';
    if (isObj(obj.records)) return 'backup0';
    var known = (st() && st().EXPORT_KEYS) || ['profile', 'learner', 'log', 'trials', 'lab', 'game', 'diary', 'missions'];
    if (keys.some(function (k) { return known.indexOf(k) >= 0 && isObj(obj[k]); })) return 'records';
    return 'unknown';
  };
  X.migrate = function (obj) {
    var o = obj, fv = typeof o.fv === 'number' ? o.fv : 0, guard = 0;
    while (fv < FV && guard++ < 20) { var fn = BACKUP_MIGRATIONS[fv]; o = fn ? fn(o) : o; fv = typeof o.fv === 'number' && o.fv > fv ? o.fv : fv + 1; }
    return o;
  };
  var SAY = {
    'too-large': 'That file is too large to be an Earshot backup.',
    empty: 'Nothing to import: the text is empty.',
    damaged: 'That file is damaged: it could not be read, so nothing was changed.',
    csv: 'That is a CSV table for spreadsheets. To restore your record, import the JSON backup instead.',
    pooled: 'That is a community pool export: it holds summaries, not your record. Import a JSON backup instead.',
    newer: 'That backup comes from a newer version of Earshot. Open it with that version.',
    unknown: 'That does not look like an Earshot backup.'
  };
  X.importJson = function (text) {
    var raw = typeof text === 'string' ? text : '';
    if (raw.length > MAX_CHARS) return { ok: false, kind: 'too-large', message: SAY['too-large'] };
    var obj = st().parseLoose ? st().parseLoose(raw) : (function () { try { return JSON.parse(raw); } catch (e) { return null; } })();
    var kind = X.detect(obj, raw);
    if (SAY[kind]) return { ok: false, kind: kind, message: SAY[kind] };
    var input = kind === 'backup0' ? X.migrate(obj) : kind === 'backup' ? X.migrate(obj) : obj;
    var rep = st().importAll(input);
    var out = { ok: !!rep.ok, kind: kind, imported: rep.imported || [], skipped: rep.skipped || [], repaired: rep.repaired || 0 };
    if (rep.ok) {
      out.message = 'Imported: ' + out.imported.join(', ') + '.' + (out.repaired ? ' ' + out.repaired + (out.repaired === 1 ? ' damaged entry was' : ' damaged entries were') + ' repaired or left out.' : '') +
        (out.skipped.length ? ' Skipped: ' + out.skipped.map(function (s) { return s.key + ' (' + s.reason + ')'; }).join(', ') + '.' : '') + ' Nothing on this device was deleted.';
    } else {
      out.message = rep.error === 'read-only' ? 'This tab is read-only because a newer version saved your record.' : rep.error === 'nothing-usable'
        ? 'Nothing in that file could be used' + (out.skipped.length ? ' (' + out.skipped.map(function (s) { return s.key + ': ' + s.reason; }).join(', ') + ')' : '') + '.' : SAY.unknown;
    }
    return out;
  };
  X.FV = FV;
})(typeof window !== 'undefined' ? window : globalThis);
