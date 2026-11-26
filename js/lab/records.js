/* ES.lab.records — probe runs in store key `lab` (CONTRACTS §7) and what is derived from them: trend points,
   per-probe summaries, the schedule state, the weakest probe for Focus mode (ES.lab.context()), and the random
   pooling id. Pure helpers take the runs as arguments (Node tests); the store-backed calls read ES.core.store.
   Run record: {id, probe, form, seed, at, end, practice, kind:'baseline'|'weekly'|'retention'|'extra', proc,
   est:{m, s}, n, unit, trials:[compact], extra, edge, hp, aborted, rv}. Older shapes are normalised on read
   (rv = record version of the run shape; 1 now). Diary weeks live in store key `diary` and become runs here.
   MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var L = ES.lab = ES.lab || {};
  var S = L.stats, DAY = 864e5, RV = 1;
  var R = L.records = {};

  function store() { return ES.core && ES.core.store; }
  function num(x) { return typeof x === 'number' && isFinite(x) ? x : null; }

  /** Bring a run of any older shape up to the current one (never throws; unknown fields pass through). */
  R.normalize = function (run) {
    if (!run || typeof run !== 'object') return null;
    var r = Object.assign({}, run), p = L.probes && L.probes[r.probe];
    if (!r.est || typeof r.est !== 'object') r.est = { m: num(r.m != null ? r.m : r.estimate), s: num(r.s != null ? r.s : r.sd) };
    r.est = { m: num(r.est.m), s: num(r.est.s) };
    if (!r.kind) r.kind = r.practice ? 'baseline' : 'extra';
    if (!r.unit && p) r.unit = p.unit;
    if (!r.proc && p) r.proc = p.id + '-1';
    if (r.practice == null) r.practice = false;
    if (!Array.isArray(r.trials)) r.trials = [];
    r.rv = RV;
    return r;
  };
  R.RV = RV;

  /** Diary weeks as runs (the Diary has no practice run: it is a self-report, not a test). */
  R.diaryRuns = function (diary) {
    return ((diary && diary.entries) || []).filter(function (e) { return e && e.at && Array.isArray(e.items); }).map(function (e) {
      var vals = e.items.map(function (it) { return it && typeof it === 'object' ? it.v : it; }).filter(function (v) { return v >= 1 && v <= 5; });
      var m = vals.length ? S.mean(vals) : null, s = vals.length > 1 ? Math.max(0.3, S.sd(vals) / Math.sqrt(vals.length)) : 0.6;
      return { id: 'diary-' + e.week, probe: 'diary', at: e.at, practice: false, kind: 'weekly', est: { m: m, s: s }, n: vals.length, unit: 'pts', aborted: vals.length < 3 };
    });
  };
  /** Finished runs of one probe, oldest first. */
  R.runsOf = function (runs, id, diary) {
    var list = id === 'diary' ? R.diaryRuns(diary) : (runs || []).map(R.normalize).filter(function (r) { return r && r.probe === id; });
    return list.filter(function (r) { return !r.aborted && r.est && r.est.m !== null; }).sort(function (a, b) { return a.at - b.at; });
  };
  /** Trend points: days since the probe's first run, ordinal r counting every finished run (practice included). */
  R.points = function (list) {
    if (!list.length) return [];
    var t0 = list[0].at;
    return list.map(function (r, i) { return { t: (r.at - t0) / DAY, y: r.est.m, s: r.est.s, r: i + 1, practice: !!r.practice, id: r.id, at: r.at, hp: r.hp }; });
  };
  R.trendOf = function (list, id) {
    var p = L.probes[id];
    return S.trend(R.points(list), { better: p.better, sigmaX: p.sigmaX, practice: p.practice, baselineN: p.core ? 2 : 1 });
  };
  /** Per-probe summary used by the screens and exports. */
  R.summarize = function (runs, diary) {
    var out = {};
    (L.probeOrder || Object.keys(L.probes)).forEach(function (id) {
      var list = R.runsOf(runs, id, diary), tr = R.trendOf(list, id), last = list[list.length - 1] || null;
      var setups = {}; list.forEach(function (r) { if (!r.practice) setups[r.hp ? 'hp' : 'spk'] = 1; });
      out[id] = { id: id, runs: list, n: list.length, measured: list.filter(function (r) { return !r.practice; }).length, last: last, trend: tr,
        mixedSetup: Object.keys(setups).length > 1 };
    });
    return out;
  };
  /** The probe furthest below our starting guess for it (p.ref; z units, better direction); the player's pick wins. */
  R.weakestFrom = function (sum, focus) {
    if (focus && L.probes[focus]) return { weakest: focus, why: 'your pick' };
    var best = null;
    Object.keys(sum).forEach(function (id) {
      var s = sum[id], p = L.probes[id];
      if (!p || id === 'diary' || !s.measured || !p.ref) return;
      var meas = s.runs.filter(function (r) { return !r.practice; }).slice(-2), m = S.mean(meas.map(function (r) { return r.est.m; }));
      var z = p.better * (m - p.ref.m) / p.ref.s;
      if (!best || z < best.z) best = { weakest: id, z: z };
    });
    return best ? { weakest: best.weakest, why: 'furthest below our starting guesses', z: S.round(best.z, 2) } : { weakest: null, why: 'no measured runs yet' };
  };

  // ---- store-backed
  function labRec() { var s = store(); return s ? s.peek('lab') : { runs: [] }; }
  function diaryRec() { var s = store(); return s ? s.peek('diary') : { entries: [] }; }
  R.all = function () { return (labRec().runs || []).map(R.normalize).filter(Boolean); };
  R.diary = diaryRec;
  R.summary = function () { return R.summarize(R.all(), diaryRec()); };
  R.trend = function (id) { return R.trendOf(R.runsOf(R.all(), id, diaryRec()), id); };
  R.add = function (run) {
    var s = store(), rec = R.normalize(run);
    if (!s || !rec) return false;
    return s.update('lab', function (r) { r.runs = (r.runs || []).filter(function (x) { return x.id !== rec.id; }).concat([rec]); });
  };
  R.focus = function () { return labRec().focus || null; };
  R.setFocus = function (id) {
    var s = store(); if (!s) return false;
    return s.update('lab', function (r) { r.focus = id && L.probes[id] ? id : null; r.focusAt = Date.now(); });
  };
  /** A random pooling id kept on this device (lets the community merge duplicates; links to nothing else). */
  R.pid = function (reset) {
    var s = store(), cur = labRec().pid;
    if (cur && !reset) return cur;
    var id = 'p' + ((ES.core.util && ES.core.util.uid) ? ES.core.util.uid('').replace(/[^a-z0-9]/gi, '').slice(-10) : Date.now().toString(36));
    if (s) s.update('lab', function (r) { r.pid = id; });
    return id;
  };
  R.state = function (now) {
    var s = store(), U = ES.core.util || {};
    return { runs: R.all(), diary: diaryRec(), sessions: s ? (s.peek('log').sessions || []) : [], now: now || Date.now(),
      dayKey: U.dayKey, weekKey: U.weekKey, trend: R.trend };
  };
  /** Counts and the next form index per probe (form = how many runs of it exist). */
  R.nextForm = function (id) { return R.all().filter(function (r) { return r.probe === id; }).length; };
  R.prevEst = function (id) { var l = R.runsOf(R.all(), id); return l.length ? l[l.length - 1].est.m : null; };

  /** For the engine's Focus mode (PROBE_MAP ids). Safe to call any time. */
  L.context = function () {
    try { return R.weakestFrom(R.summary(), R.focus()); } catch (e) { return { weakest: null, why: 'unavailable' }; }
  };
  L.weakest = function () { return L.context().weakest; };
  /** What the planner reads (shell request 18:13 UTC): {weakest} or null. */
  L.forPlanner = function () { var c = L.context(); return c && c.weakest ? { weakest: c.weakest } : null; };
})(typeof window !== 'undefined' ? window : globalThis);
